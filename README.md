# sequelize-base

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/sequelize-base.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sequelize-base
[travis-image]: https://img.shields.io/travis/rickyes/sequelize-base.svg?style=flat-square
[travis-url]: https://travis-ci.org/rickyes/sequelize-base
[codecov-image]: https://codecov.io/gh/rickyes/sequelize-base/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/github/rickyes/sequelize-base?branch=master
[download-image]: https://img.shields.io/npm/dm/sequelize-base.svg?style=flat-square
[download-url]: https://npmjs.org/package/sequelize-base

A base class for sequelize with some common functions.

### Install

```bash
$ npm install sequelize-base
```

### Usage
```js
// modle/user.js
'use strict';

const Base = require('sequelize-base');
const Sequelize = require('sequelize');
const {INTEGER, STRING, CHAR} = DataTypes;

const pool = new Sequelize(Object.assign(config, {
  logging: (msg) => log.info(msg),
}));

const attributes = {
  userId: {type: INTEGER(11), primaryKey: true, autoIncrement: true, field: 'user_id'},
  account: {type: STRING(30), comment: 'accout', allowNull: false, unique: true, field: 'accout'},
  nickName: {type: STRING(30), comment: 'nickName', allowNull: false, field: 'nickname'},
  password: {type: STRING(32), comment: '密码', allowNull: false, field: 'password'},
  invalid: {type: CHAR(1), defaultValve: 'N', comment: '是否有效', field: 'invalid'},
};

const UserEntity = pool.define('User', attributes, {
  timestamps: true,
  freezeTableName: true,
  updatedAt: 'mtime',
  createdAt: 'ctime',
  tableName: 'bas_user',
  charset: 'utf8mb4',
  comment: '用户表',
});

class UserModel extends Base {

  constructor() {
    super({entity: UserEntity});
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new UserModel();
    }
    return this.instance;
  }

}

module.exports = UserModel;
```

#### API
> 请参考 [测试套件](./test.js)
- super(config)
   - config.entity sequelize model
   - config.enableSoftDeleted 是否开启软删除，默认为 true
   - config.softDeleted 软删除字段配置
   - config.softDeleted.field 软删除字段名
   - config.softDeleted.yes 软删除字段有效枚举值
   - config.softDeleted.no 软删除字段无效枚举值

- instance
   - model sequelize model instance, 参考 [sequelize model usage api](https://sequelize.org/v4/manual/tutorial/models-usage.html)
   - count(where?)
   - getList(where, fields?)
      - or getList(fields)
      - or getList()
      - or getList(where, fields, order)
   - getData(where, fields?)
   - getPageList(currentPage, pageSize, where?, fields?)
     - or getPageList(currentPage, pageSize, fields)
     - or getPageList(currentPage, pageSize)
     - or getPageList(currentPage, pageSize, fields, order)
   - create(data)
   - delete(where)
   - update(where, data)
   - getPageListContact(include, currentPage, pageSize, where?, fields?)
     - or getPageListContact(include, currentPage, pageSize, fields)
     - or getPageListContact(include, currentPage, pageSize)
     - or getPageListContact(include, currentPage, pageSize, fields, order)

- instance where
   - [Base.SOFT_DELETED] 是否构造软删除有效字段条件