'use strict';

import test from 'ava';
import mm from 'mm';
import Base from './app';

const UPDATE = 'update';
const DESTORY = 'destroy';
const CREATE = 'create';
const COUNT = 'count';
const FIND_ALL = 'findAll';
const FIND_ONE = 'findOne';
const FIND_AND_COUNT_ALL = 'findAndCountAll';

function mockEntity(data) {
  this.data = data;
}

mockEntity[UPDATE] = async (data, where) => {
  return {data, where, method: UPDATE}
};
mockEntity[DESTORY] = async where => {
  return {where, method: DESTORY}
};
mockEntity[COUNT] = async where => {
  return {where, method: COUNT}
};
mockEntity[FIND_ALL] = async where => {
  return {where, method: FIND_ALL}
};
mockEntity[FIND_ONE] = async where => {
  return {where, method: FIND_ONE}
};
mockEntity[FIND_AND_COUNT_ALL] = async where => {
  return {where, method: FIND_AND_COUNT_ALL}
};

mockEntity.prototype.save = async function() {
  return {data: this.data, method: CREATE};
};


class Model extends Base {
  constructor(opts) {
    super(opts);
  }

  static getInstance(opts = {entity: mockEntity}) {
    if (!this.instance) {
      this.instance = new Model(opts);
    }
    return this.instance;
  }
}

test('getInstance() 单例模式', t => {
  const model = Model.getInstance();
  const newModel = Model.getInstance();
  t.deepEqual(model, newModel);
});

test('delete() 根据是否配置软删除进行删除', async t => {
  let model = new Model({entity: mockEntity, enableSoftDeleted: false});
  const where = {
    userId: 1
  };

  const error = await t.throwsAsync(async () => {
    await model.delete();
  }, Error);
  t.is(error.message, 'No delete conditions');

  let result = await model.delete(where);
  t.deepEqual(result.where, where);
  t.is(result.method, DESTORY);

  model = new Model({entity: mockEntity});
  result = await model.delete(where);
  t.deepEqual(result.where, {where: {invalid: 'N', userId: 1}});
  t.deepEqual(result.data, {invalid: 'Y'});
  t.is(result.method, UPDATE);
});

test('create() 创建', async t => {
  let model = Model.getInstance();
  const data = {
    userId: 1
  };
  const result = await model.create(data);
  t.deepEqual(result.data, data);
  t.is(result.method, CREATE);
});

test('update() 编辑', async t => {
  let model = Model.getInstance();
  const data = {
    userId: 1,
  };
  const where = {
    roleId: 1,
  };

  const error = await t.throwsAsync(async () => {
    await model.update();
  }, Error);
  t.is(error.message, 'No update conditions');

  const result = await model.update(where, data);
  t.deepEqual(result.where, {where: Object.assign({invalid: 'N'}, where)});
  t.deepEqual(result.data, data);
  t.is(result.method, UPDATE);
});


test('count() 统计', async t => {
  let model = Model.getInstance();
  const where = {
    userId: 1
  };
  const result = await model.count(where);
  t.deepEqual(result.where, {where: Object.assign({invalid: 'N'}, where)});
  t.is(result.method, COUNT);
});

test('getList() 列表', async t => {
  let model = Model.getInstance();
  const where = {
    userId: 1
  };
  const fields = ['a', 'b'];
  let result = await model.getList(where, fields);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.deepEqual(result.where.attributes, fields);
  t.is(result.method, FIND_ALL);

  result = await model.getList(fields);
  t.deepEqual(result.where.where, {invalid: 'N'});
  t.deepEqual(result.where.attributes, fields);
  t.is(result.method, FIND_ALL);

  result = await model.getList();
  t.deepEqual(result.where.where, {invalid: 'N'});
  t.is(result.where.attributes, undefined);
  t.is(result.method, FIND_ALL);

  result = await model.getList(where, fields, {});
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.deepEqual(result.where.attributes, fields);
  t.deepEqual(result.where.order, undefined);
  t.is(result.method, FIND_ALL);

  result = await model.getList(where, fields, {field: 'ctime'});
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.deepEqual(result.where.attributes, fields);
  t.deepEqual(result.where.order, [['ctime', 'desc']]);
  t.is(result.method, FIND_ALL);

  result = await model.getList(where, fields, {field: 'ctime', sort: 'asc'});
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.deepEqual(result.where.attributes, fields);
  t.deepEqual(result.where.order, [['ctime', 'asc']]);
  t.is(result.method, FIND_ALL);

  result = await model.getList(where, fields, [{field: 'mtime', sort: 'asc'}]);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.deepEqual(result.where.attributes, fields);
  t.deepEqual(result.where.order, [['mtime', 'asc']]);
  t.is(result.method, FIND_ALL);
});


test('getData() 详情', async t => {
  let model = Model.getInstance();
  const where = {
    userId: 1,
  };
  const fields = ['a', 'b'];
  const error = await t.throwsAsync(async () => {
    await model.getData();
  }, Error);
  t.is(error.message, 'No query conditions');

  let result = await model.getData(where);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.attributes, undefined);
  t.is(result.method, FIND_ONE);

  result = await model.getData(where, fields);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.attributes, fields);
  t.is(result.method, FIND_ONE);
});

test('getPageList() 分页查询', async t => {
  let model = Model.getInstance();
  const where = {
    userId: 1,
  };
  const fields = ['a', 'b'];
  const currentPage = 1;
  const pageSize = 10;
  let result = await model.getPageList(currentPage, pageSize);
  t.deepEqual(result.where.where, {invalid: 'N'});
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, undefined);
  t.is(result.method, FIND_AND_COUNT_ALL);

  result = await model.getPageList(currentPage, pageSize, where);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, undefined);
  t.is(result.method, FIND_AND_COUNT_ALL);

  result = await model.getPageList(currentPage, pageSize, where, fields);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, fields);
  t.is(result.method, FIND_AND_COUNT_ALL);

  result = await model.getPageList(currentPage, pageSize, fields);
  t.deepEqual(result.where.where, {invalid: 'N'});
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, fields);
  t.is(result.method, FIND_AND_COUNT_ALL);

  result = await model.getPageList(currentPage, pageSize, where, fields, {});
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, fields);
  t.is(result.where.order, undefined);
  t.is(result.method, FIND_AND_COUNT_ALL);

  result = await model.getPageList(currentPage, pageSize, where, fields, {field: 'ctime'});
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, fields);
  t.deepEqual(result.where.order, [['ctime', 'desc']]);
  t.is(result.method, FIND_AND_COUNT_ALL);

  result = await model.getPageList(currentPage, pageSize, where, fields, {field: 'ctime', sort: 'desc'});
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, fields);
  t.deepEqual(result.where.order, [['ctime', 'desc']]);
  t.is(result.method, FIND_AND_COUNT_ALL);

  result = await model.getPageList(currentPage, pageSize, where, fields, [{field: 'ctime'}]);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, fields);
  t.deepEqual(result.where.order, [['ctime', 'desc']]);
  t.is(result.method, FIND_AND_COUNT_ALL);
});


test('getPageListContact() 关联分页查询', async t => {
  let model = Model.getInstance();
  const where = {
    userId: 1,
  };

  mm(mockEntity, FIND_AND_COUNT_ALL, async where => {
    return {where, method: FIND_AND_COUNT_ALL, count: 1, rows: [{
      'User.nickName': 'test',
      'id': 1,
      'User.avatarUrl': 'url',
    }]};
  });

  const fields = ['a'];

  const include = [{
    model: () => {},
    where: {
      id: 1,
    },
    attributes: ['nickName', 'avatarUrl'],
    required: false,
  }];

  let result = await model.getPageListContact(include, 1, 10, where, fields);
  t.deepEqual(result.where.where, Object.assign({invalid: 'N'}, where));
  t.is(result.where.offset, 0);
  t.is(result.where.limit, 10);
  t.is(result.where.attributes, fields);
  t.is(result.where.include, include);
  t.is(result.method, FIND_AND_COUNT_ALL);
  t.is(result.count, 1);
  t.deepEqual(result.rows, [{ id: 1, nickName: 'test', avatarUrl: 'url' }]);

  mm.restore();
});
