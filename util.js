'use strict';

/**
 * 获取分页偏移量
 * @param {Number} current 当前页
 * @param {Number} size 每页数据
 * @return {Number} 偏移量
 */
exports.getOffset = (current, size) => (current - 1) * size;


/**
 * 类型判断
 * eg:
 * isType('String', 'hello'); // true
 * isType('Number', 1); // true
 * isType('Object', []); // false
 * @param {类型字符串} type
 */
exports.isType = (type, obj) => {
  return Object.prototype.toString.call(obj) === `[object ${type}]`;
};


/**
 * 根据类型推选where和fields
 * @param {Object} where 查询条件
 * @param {Array<String>} 查询字段
 * @returns {Array<Object>} 推选结果，0：where, 1: fields
 */
exports.wrapWhereFieldsByType = (where, fields) => {
  let whereTmp = where;
  let fieldsTemp = fields;
  if (this.isType('Array', whereTmp)) {
    fieldsTemp = whereTmp;
    whereTmp = {};
  }
  return [whereTmp, fieldsTemp];
};