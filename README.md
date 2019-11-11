# sequelize-base
A base class for sequelize with some common functions.

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
- super(config)
   - config.entity sequelize model
   - config.enableSoftDeleted 是否开启软删除，默认为 true
   - config.softDeleted 软删除字段配置
   - config.softDeleted.field 软删除字段名
   - config.softDeleted.yes 软删除字段有效枚举值
   - config.softDeleted.no 软删除字段无效枚举值

- instance
   - count(where)
   - getList(where, fields?) or getList(fields)
   - getData(where, fields?)
   - getPageList(currentPage, pageSize, where, fields)
   - create(data)
   - delete(where)
   - update(where, data)