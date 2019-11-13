'use strict';

/**
 * sequelize model 基类
 */

const EventEmitter = require('events').EventEmitter;
const util = require('./util');

class BaseModel extends EventEmitter {

  /**
   * @param {Object} config
   * @param {import('sequelize').ModelType} config.entity sequelize 实体
   * @param {Boolean} config.enableSoftDeleted 是否开启软删除，默认 true
   * @param {Object} config.softDeleted 软删除配置
   * @param {String} config.softDeleted.field 软删除字段名
   * @param {String} config.softDeleted.yes 软删除字段有效枚举值
   * @param {String} config.softDeleted.no 软删除字段无效枚举值
   */
  constructor(config) {
    super();
    this.entity = config.entity;
    this._enableSoftDeleted = true;
    config.enableSoftDeleted === false && (this._enableSoftDeleted = false);
    const softDeleted = config.softDeleted || {};
    this._softDeleted = softDeleted && softDeleted.field || 'invalid';
    this._softDeletedYes = softDeleted && softDeleted.yes || 'N';
    this._softDeletedNo = softDeleted && softDeleted.no || 'Y';
  }


  /**
   * 构造查询条件
   * @param {Object} where 查询条件
   * @param {Object} opts 查询配置参数
   */
  _wrapWhere(where, opts = {}) {
    const baseWhere = {};
    this._enableSoftDeleted && (baseWhere[this._softDeleted] = this._softDeletedYes);
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
   * 统计数量
   * @param {Object}? where 统计条件
   * @returns {Number} 数量
   */
  async count(where) {
    const findWhere = this._wrapWhere(where);

    return this.entity.count(findWhere);
  }


  /**
   * 查询列表
   * @param {Object}? where 查询条件
   * @param {Array<String>}? fields 返回字段
   * @returns {Array<Object>} 返回值
   */
  async getList(where = {}, fields = []) {
    const [whereTmp, fieldsTemp] = util.wrapWhereFieldsByType(where, fields);
    const findWhere = this._wrapWhere(whereTmp);
    this._appendFields(findWhere, fieldsTemp);

    return this.entity.findAll(findWhere);
  }


  /**
   * 查询
   * @param {Object} where 查询条件
   * @param {Array<String>}? fields 返回字段
   */
  async getData(where = {}, fields = []) {
    if (Object.keys(where).length === 0) {
      throw new Error('No query conditions');
    }
    const findWhere = this._wrapWhere(where, {raw: true});
    this._appendFields(findWhere, fields);

    return this.entity.findOne(findWhere);
  }


  /**
   * 分页查询
   * @param {Number} currentPage 当前页
   * @param {Number} pageSize 每页数量
   * @param {Object} where? 查询条件
   * @param {Array<String>} fields? 返回字段
   */
  async getPageList(currentPage, pageSize, where, fields = []) {
    const offset = util.getOffset(currentPage, pageSize);
    const [whereTmp, fieldsTemp] = util.wrapWhereFieldsByType(where, fields);
    const findWhere = this._wrapWhere(whereTmp, {offset, limit: pageSize});
    this._appendFields(findWhere, fieldsTemp);

    return this.entity.findAndCountAll(findWhere);
  }


  /**
   * 创建
   * @param {Object} data data
   */
  async create(data) {
    const model = new this.entity(data);

    return model.save();
  }


  /**
   * 删除，如果配置软删除则默认软删除
   * @param {Object} where 删除条件
   */
  async delete(where = {}) {
    if (Object.keys(where).length === 0) {
      throw new Error('No delete conditions');
    }
    if (!this._enableSoftDeleted) {
      return this.entity.destroy(where);
    }
    const deleteWhere = this._wrapWhere(where);

    const data = {
      [this._softDeleted]: this._softDeletedNo,
    };

    return this.entity.update(data, deleteWhere);
  }


  /**
   * 编辑
   * @param {Object} where 编辑条件
   * @param {Object} data 待编辑的数据
   */
  async update(where = {}, data) {
    if (Object.keys(where).length === 0) {
      throw new Error('No update conditions');
    }
    const updateWhere = this._wrapWhere(where);

    return this.entity.update(data, updateWhere);
  }

}

module.exports = BaseModel;