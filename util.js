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