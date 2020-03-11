'use strict';

/**
 * sequelize model 基类
 */

/**
 * 排序
 * @typedef   {Object} orderBy 排序规则
 * @property  {String} field 排序字段
 * @property  {string} sort? 排序顺序
 */

const EventEmitter = require('events').EventEmitter;
const util = require('./util');
const toString = Object.prototype.toString;
const entityKey = Symbol.for('sequelize-base#model')
const SOFT_DELETED = Symbol.for('sequelize-base#softDeleted');

class BaseModel extends EventEmitter {

  /**
   * @param {Object} config
   * @param {import('sequelize').ModelType} config.entity sequelize 实体
   * @param {Boolean} config.enableSoftDeleted? 是否开启软删除，默认 true
   * @param {Object} config.softDeleted? 软删除配置
   * @param {String} config.softDeleted.field? 软删除字段名
   * @param {String} config.softDeleted.yes? 软删除字段有效枚举值
   * @param {String} config.softDeleted.no? 软删除字段无效枚举值
   */
  constructor(config) {
    super();
    this[entityKey] = config.entity;
    this.model = config.entity;
    this._enableSoftDeleted = true;
    config.enableSoftDeleted === false && (this._enableSoftDeleted = false);
    const softDeleted = config.softDeleted || {};
    this._softDeleted = softDeleted && softDeleted.field || 'invalid';
    this._softDeletedYes = softDeleted && softDeleted.yes || 'N';
    this._softDeletedNo = softDeleted && softDeleted.no || 'Y';
    this._cacher = config.cacher;
    this._entityName = this.model.name;

    const self = this;

    if (config.cacher) {
      // 代理entity方法
      self[entityKey] = new Proxy(self[entityKey], {
        get: function(target, key, receiver) {
          if (self._cacher.getFindMethods().includes(key)) {
            return function(...args) {
              const tables = self._getTableNames(args);
              return self._cacher.run(key, tables, ...args);
            };
          }

          if (self._cacher.getUpdateMethods().includes(key)) {
            self._cacher.batchClearCache([self.model.getTableName()]);
          }

          return Reflect.get(target, key, receiver);
        },
      });
    }
  }

  _getTableNames(args) {
    const self = this;
    const tables = [self.model.getTableName()];
    if (args.length && toString.call(args[0].include) === '[object Array]') {
      args[0].include.forEach(t => {
        tables.push(t.model.getTableName());
      });
    }
    return tables;
  }


  /**
   * 构造查询条件
   * @param {Object} where 查询条件
   * @param {Object} opts 查询配置参数
   */
  _wrapWhere(where = {}, opts = {}) {
    const baseWhere = {};
    // model 开启软删除，且查询参数 [SOFT_DELETED] 不为 false, 用于个别查询不需要软删除条件
    if (this._enableSoftDeleted && where[SOFT_DELETED] !== false) {
      baseWhere[this._softDeleted] = this._softDeletedYes;
    };
    const findWhere = {
      where: Object.assign(baseWhere, where),
    };

    return Object.assign(findWhere, opts);
  }


  /**
   * 附加返回字段
   * @param {Object} findWhere 查询条件
   * @param {Array<String>} fields 返回字段
   */
  _appendFields(findWhere, fields = []) {
    fields.length && (findWhere.attributes = fields);
  }


  /**
   * 附加排序规则
   * @param {Object} whereOpts where 配置
   * @param {Array<orderBy>|orderBy} order? 排序配置
   */
  _appendOrder(whereOpts, order) {
    let orderTemp = [];
    if (util.isType('Object', order)) {
      orderTemp.push(order);
    } else {
      orderTemp = orderTemp.concat(order);
    }
    const orderWhere = [];
    orderTemp.some(o => {
      if (util.isEmpty(o.field)) return true;
      orderWhere.push([
        o.field, o.sort || 'desc',
      ]);
    });
    if (orderWhere.length) {
      whereOpts.order = orderWhere;
    }
  }

  /**
   * 添加关联关系
   * @param {Object} whereOpts where 配置
   * @param {Array<Object>} include 关联关系 model
   */
  _appendContact(whereOpts, include) {
    whereOpts.include = include;
  }


  /**
   * 统计数量
   * @param {Object}? where 统计条件
   * @returns {Number} 数量
   */
  async count(where) {
    const findWhere = this._wrapWhere(where);

    return this[entityKey].count(findWhere);
  }


  /**
   * 查询列表
   * @param {Object} where? 查询条件
   * @param {Array<String>} fields? 返回字段
   * @param {Array<orderBy>|orderBy} order? 排序配置
   * @returns {Array<Object>} 返回值
   */
  async getList(where = {}, fields = [], order = []) {
    const [whereTmp, fieldsTemp] = util.wrapWhereFieldsByType(where, fields);
    const whereOpts = {};
    this._appendOrder(whereOpts, order);
    const findWhere = this._wrapWhere(whereTmp, whereOpts);
    this._appendFields(findWhere, fieldsTemp);

    return this[entityKey].findAll(findWhere);
  }


  /**
   * 连表查询列表
   * @param {Array<Object>} include 关联model数组配置，和sequelize保持一致
   * @param {Object} where 查询条件
   * @param {Array<String>} fields 返回字段
   * @param {Array<orderBy>|orderBy} order? 排序配置
   * @returns {Array<Object>} 返回值
   */
  async getListContact(include, where = {}, fields = [], order = []) {
    const [whereTmp, fieldsTemp] = util.wrapWhereFieldsByType(where, fields);
    const whereOpts = {raw: true};
    this._appendOrder(whereOpts, order);
    const findWhere = this._wrapWhere(whereTmp, whereOpts);
    this._appendFields(findWhere, fieldsTemp);
    this._appendContact(findWhere, include);

    const data = await this[entityKey].findAll(findWhere);
    return data.map(r => {
      Object.keys(r).forEach(keyName => {
        if (keyName.includes('.')) {
          r[keyName.split('.')[1]] = r[keyName];
          delete r[keyName];
        }
      });
      return r;
    });
  }


  /**
   * 查询
   * @param {Object} where 查询条件
   * @param {Array<String>}? fields 返回字段
   */
  async getData(where = {}, fields = []) {
    if (util.getObjectKeys(where) === 0) {
      throw new Error('No query conditions');
    }
    const findWhere = this._wrapWhere(where, {raw: true});
    this._appendFields(findWhere, fields);

    return this[entityKey].findOne(findWhere);
  }


  /**
   * 分页查询
   * @param {Number} currentPage 当前页
   * @param {Number} pageSize 每页数量
   * @param {Object} where? 查询条件
   * @param {Array<String>} fields? 返回字段
   * @param {Array<orderBy>|orderBy} order? 排序配置
   */
  async getPageList(currentPage, pageSize, where, fields = [], order = []) {
    const offset = util.getOffset(currentPage, pageSize);
    const [whereTmp, fieldsTemp] = util.wrapWhereFieldsByType(where, fields);
    let whereOpts = {offset, limit: pageSize};
    this._appendOrder(whereOpts, order);
    const findWhere = this._wrapWhere(whereTmp, whereOpts);
    this._appendFields(findWhere, fieldsTemp);

    return this[entityKey].findAndCountAll(findWhere);
  }

  /**
   * 分页关联查询
   * @param {Array<Object>} include 关联model数组配置，和sequelize保持一致
   * @param {Number} currentPage 当前页
   * @param {Number} pageSize 每页数量
   * @param {Object} where? 查询条件
   * @param {Array<String>} fields? 返回字段
   * @param {Array<orderBy>|orderBy} order? 排序配置
   */
  async getPageListContact(include, currentPage, pageSize, where, fields = [], order = []) {
    const offset = util.getOffset(currentPage, pageSize);
    const [whereTmp, fieldsTemp] = util.wrapWhereFieldsByType(where, fields);
    // 默认开启原始查询
    let whereOpts = {offset, limit: pageSize, raw: true};
    this._appendOrder(whereOpts, order);
    const findWhere = this._wrapWhere(whereTmp, whereOpts);
    this._appendFields(findWhere, fieldsTemp);
    this._appendContact(findWhere, include);
    
    const data = await this[entityKey].findAndCountAll(findWhere);
    data.rows = data.rows.map(r => {
      Object.keys(r).forEach(keyName => {
        if (keyName.includes('.')) {
          r[keyName.split('.')[1]] = r[keyName];
          delete r[keyName];
        }
      });
      return r;
    });
    return data;
  }


  /**
   * 创建
   * @param {Object} data data
   */
  async create(data) {
    return this[entityKey].create(data);
  }


  /**
   * 删除，如果配置软删除则默认软删除
   * @param {Object} where 删除条件
   */
  async delete(where = {}) {
    if (util.getObjectKeys(where) === 0) {
      throw new Error('No delete conditions');
    }

    const deleteWhere = this._wrapWhere(where);

    if (!this._enableSoftDeleted) {
      return this[entityKey].destroy(where);
    }

    const data = {
      [this._softDeleted]: this._softDeletedNo,
    };

    return this[entityKey].update(data, deleteWhere);
  }


  /**
   * 编辑
   * @param {Object} where 编辑条件
   * @param {Object} data 待编辑的数据
   */
  async update(where = {}, data) {
    if (util.getObjectKeys(where) === 0) {
      throw new Error('No update conditions');
    }
    const updateWhere = this._wrapWhere(where);

    return this[entityKey].update(data, updateWhere);
  }

}

BaseModel.SOFT_DELETED = SOFT_DELETED;

module.exports = BaseModel;