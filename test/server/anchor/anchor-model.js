'use strict';
const Joi = require('joi');
const Lab = require('lab');
const Code = require('code');
const AnchorModel = require('../../../server/anchor/anchor-model');
const Mongodb = require('mongodb');

const lab = exports.lab = Lab.script();
const config = {
  connection: {
    uri: 'mongodb://localhost:27017',
    db: 'anchor-models-test'
  },
  options: {}
};

lab.experiment('Connections', () => {

  lab.test('it connects and disconnects the database', async () => {

    const db = await AnchorModel.connect(config.connection, config.options);

    Code.expect(db).to.be.an.instanceof(Mongodb.Db);
    Code.expect(db.serverConfig.isConnected()).to.equal(true);

    AnchorModel.disconnect();

    Code.expect(db.serverConfig.isConnected()).to.equal(false);
  });

  lab.test('it throws when the db connection fails', async () => {

    const connection = {
      uri: 'mongodb://poison',
      db: 'pill'
    };

    await Code.expect(AnchorModel.connect(connection)).to.reject();
  });

  lab.test('it connects to multiple databases', async () => {

    const connection2 = {
      uri: config.connection.uri,
      db: `${config.connection.db}2`
    };
    const db = await AnchorModel.connect(config.connection, config.options);
    const db2 = await AnchorModel.connect(connection2, config.options, 'alt');

    Code.expect(db).to.be.an.instanceof(Mongodb.Db);
    Code.expect(db2).to.be.an.instanceof(Mongodb.Db);
    Code.expect(db.serverConfig.isConnected()).to.equal(true);
    Code.expect(db2.serverConfig.isConnected()).to.equal(true);

    AnchorModel.disconnect('alt');
    AnchorModel.disconnect();

    Code.expect(db.serverConfig.isConnected()).to.equal(false);
    Code.expect(db2.serverConfig.isConnected()).to.equal(false);
  });

  lab.test('it throws when trying to close a named db connection that misses', () => {

    Code.expect(AnchorModel.disconnect.bind(AnchorModel, 'poison')).to.throw();
  });

  lab.test('it binds db functions to a named connection using `with` and caches for subsequent use', async () => {

    const db = await AnchorModel.connect(config.connection, config.options, 'named');

    Code.expect(db).to.be.an.instanceof(Mongodb.Db);
    Code.expect(db.serverConfig.isConnected()).to.equal(true);

    class DummyModel extends AnchorModel {
    };

    DummyModel.collectionName = 'dummies';

    const count = await DummyModel.with('named').count({});

    Code.expect(count).to.be.a.number();

    const count2 = await DummyModel.with('named').count({});

    Code.expect(count2).to.be.a.number();

    AnchorModel.disconnect('named');

    Code.expect(db.serverConfig.isConnected()).to.equal(false);
  });

  lab.test('it throws when trying to use `with` and the named db misses', () => {

    class DummyModel extends AnchorModel {
    };

    Code.expect(DummyModel.with.bind(DummyModel, 'poison')).to.throw();
  });
});

lab.experiment('Instance construction', () => {

  lab.test('it constructs an instance using the schema', () => {

    class DummyModel extends AnchorModel {
    };

    DummyModel.schema = Joi.object().keys({
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date(),
      stuff: Joi.object().keys({
        foo: Joi.string().default('foozball'),
        bar: Joi.string().default('barzball'),
        baz: Joi.string().default('bazzball')
      }).default(() => {

        return {
          foo: 'llabzoof',
          bar: 'llabzrab',
          baz: 'llabzzab'
        };
      }, 'default stuff')
    });

    const instance1 = new DummyModel({
      name: 'Stimpson J. Cat'
    });

    Code.expect(instance1.name).to.equal('Stimpson J. Cat');
    Code.expect(instance1.stuff).to.be.an.object();
    Code.expect(instance1.stuff.foo).to.equal('llabzoof');
    Code.expect(instance1.stuff.bar).to.equal('llabzrab');
    Code.expect(instance1.stuff.baz).to.equal('llabzzab');

    const instance2 = new DummyModel({
      name: 'Stimpson J. Cat',
      stuff: {
        foo: 'customfoo'
      }
    });

    Code.expect(instance2.name).to.equal('Stimpson J. Cat');
    Code.expect(instance2.stuff).to.be.an.object();
    Code.expect(instance2.stuff.foo).to.equal('customfoo');
    Code.expect(instance2.stuff.bar).to.equal('barzball');
    Code.expect(instance2.stuff.baz).to.equal('bazzball');
  });


  lab.test('it throws if schema validation fails when creating an instance using the schema', () => {

    class DummyModel extends AnchorModel {
    };

    DummyModel.schema = Joi.object().keys({
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    });

    /*const blamo = function () {

      return new DummyModel({});
    };

    Code.expect(blamo).to.throw();*/

    const hello = new DummyModel({
      name: 'World'
    });

    Code.expect(hello).to.be.an.instanceof(DummyModel);
  });

});

lab.experiment('Validation', () => {

  lab.test('it returns the Joi validation results of a SubClass', () => {

    class DummyModel extends AnchorModel {
    };

    DummyModel.schema = Joi.object().keys({
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    });

    Code.expect(DummyModel.validate()).to.be.an.object();
  });

  lab.test('it returns the Joi validation results of a SubClass instance', () => {

    class DummyModel extends AnchorModel {
    };

    DummyModel.schema = Joi.object().keys({
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    });

    const dummy = new DummyModel({ name: 'Stimpy' });

    Code.expect(dummy.validate()).to.be.an.object();
  });
});

lab.experiment('Result factory', () => {

  let DummyModel;

  lab.before(() => {

    DummyModel = class extends AnchorModel {
    };

    DummyModel.schema = Joi.object().keys({
      _id: Joi.string(),
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    });
  });

  lab.test('it returns an instance for a single document result', () => {

    const input = {
      _id: '54321',
      name: 'Stimpy'
    };
    const result = DummyModel.resultFactory(input);

    Code.expect(result).to.be.an.instanceof(DummyModel);
  });

  lab.test('it returns an array of instances for a `writeOpResult` object', () => {

    const input = {
      ops: [
        { name: 'Ren' },
        { name: 'Stimpy' }
      ]
    };
    const result = DummyModel.resultFactory(input);

    Code.expect(result).to.be.an.array();

    result.forEach((item) => {

      Code.expect(item).to.be.an.instanceof(DummyModel);
    });
  });

  lab.test('it returns a instance for a `findOpResult` object', () => {

    const input = {
      value: {
        _id: 'ren',
        name: 'Ren'
      }
    };
    const result = DummyModel.resultFactory(input);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns undefined for a `findOpResult` object that missed', () => {

    const input = {
      value: null
    };

    const result = DummyModel.resultFactory(input);

    Code.expect(result).to.not.exist();
  });

  lab.test('it does not convert an object into an instance without an _id property', () => {

    const input = {
      name: 'Ren'
    };
    const result = DummyModel.resultFactory(input);

    Code.expect(result).to.be.an.object();
    Code.expect(result).to.not.be.an.instanceOf(DummyModel);
  });
});

lab.experiment('Indexes', () => {

  let DummyModel;

  lab.before(async () => {

    DummyModel = class extends AnchorModel {
    };

    DummyModel.collectionName = 'dummies';

    await AnchorModel.connect(config.connection, config.options);
  });

  lab.after(() => {

    AnchorModel.disconnect();
  });

  lab.test('it successfully creates indexes', async () => {

    const indexes = [{ key: { username: 1 } }];
    const result = await DummyModel.createIndexes(indexes);

    Code.expect(result).to.be.an.object();
  });
});

lab.experiment('Helpers', () => {

  lab.before(async () => {

    await AnchorModel.connect(config.connection, config.options);
  });

  lab.after(() => {

    AnchorModel.disconnect();
  });

  lab.test('it creates a fields document from a string', () => {

    const fields = AnchorModel.fieldsAdapter('one -two three');

    Code.expect(fields).to.be.an.object();
    Code.expect(fields.one).to.equal(true);
    Code.expect(fields.two).to.equal(false);
    Code.expect(fields.three).to.equal(true);

    const fields2 = AnchorModel.fieldsAdapter('');

    Code.expect(Object.keys(fields2)).to.have.length(0);
  });

  lab.test('it creates a fields document from a object', () => {

    const fields = AnchorModel.fieldsAdapter({ one: true, two: false, three: true });

    Code.expect(fields).to.be.an.object();
    Code.expect(fields.one).to.equal(true);
    Code.expect(fields.two).to.equal(false);
    Code.expect(fields.three).to.equal(true);

    const fields2 = AnchorModel.fieldsAdapter('');

    Code.expect(Object.keys(fields2)).to.have.length(0);
  });

  lab.test('it creates a sort document from a string', () => {

    const sort = AnchorModel.sortAdapter('one -two three');

    Code.expect(sort).to.be.an.object();
    Code.expect(sort.one).to.equal(1);
    Code.expect(sort.two).to.equal(-1);
    Code.expect(sort.three).to.equal(1);

    const sort2 = AnchorModel.sortAdapter('');

    Code.expect(Object.keys(sort2)).to.have.length(0);
  });

  lab.test('it creates a sort document from a object', () => {

    const sort = AnchorModel.sortAdapter({ one: 1, two: -1, three: 1 });

    Code.expect(sort).to.be.an.object();
    Code.expect(sort.one).to.equal(1);
    Code.expect(sort.two).to.equal(-1);
    Code.expect(sort.three).to.equal(1);

    const sort2 = AnchorModel.sortAdapter('');

    Code.expect(Object.keys(sort2)).to.have.length(0);
  });

  lab.test('it returns the raw mongodb collection', () => {

    class DummyModel extends AnchorModel {
    };

    DummyModel.collectionName = 'dummies';

    const collection = DummyModel.collection();

    Code.expect(collection).to.be.an.instanceof(Mongodb.Collection);
  });
});

lab.experiment('Paged find', () => {

  let DummyModel;

  lab.before(async () => {

    DummyModel = class extends AnchorModel {
    };

    DummyModel.schema = Joi.object().keys({
      _id: Joi.object(),
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    });

    DummyModel.collectionName = 'dummies';

    await AnchorModel.connect(config.connection, config.options);
  });

  lab.after(() => {

    AnchorModel.disconnect();
  });

  lab.afterEach(async () => {

    await DummyModel.deleteMany({});
  });

  lab.test('it throws when an error occurs', async () => {

    const realCount = DummyModel.count;

    DummyModel.count = function () {

      throw new Error('count failed');
    };

    const filter = {};
    const limit = 10;
    const page = 1;
    const options = {
      sort: { _id: -1 }
    };

    await Code.expect(
      DummyModel.pagedFind(filter, limit, page, options)
    ).to.reject();

    DummyModel.count = realCount;
  });

  lab.test('it returns paged results', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = {};
    const limit = 10;
    const page = 1;
    const options = {
      sort: { _id: -1 }
    };
    const result = await DummyModel.pagedFind(
      filter, limit, page, options
    );

    Code.expect(result).to.be.an.object();
  });

  lab.test('it returns paged results without timestamps', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    DummyModel.timestamps = false;

    await DummyModel.insertMany(documents);

    const filter = {};
    const limit = 10;
    const page = 1;
    const options = {
      sort: { _id: -1 }
    };
    const result = await DummyModel.pagedFind(
      filter, limit, page, options
    );

    Code.expect(result).to.be.an.object();

    DummyModel.timestamps = true;
  });

  lab.test('it returns paged results with no options', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = {};
    const limit = 10;
    const page = 1;
    const result = await DummyModel.pagedFind(
      filter, limit, page);

    Code.expect(result).to.be.an.object();
  });

  lab.test('it returns paged results where end item is less than total', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = {};
    const limit = 2;
    const page = 1;
    const options = {
      sort: { _id: -1 }
    };
    const result = await DummyModel.pagedFind(
      filter, limit, page, options
    );

    Code.expect(result).to.be.an.object();
  });

  lab.test('it returns paged results where begin item is less than total', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = { 'role.special': { $exists: true } };
    const limit = 2;
    const page = 1;
    const options = {
      sort: { _id: -1 }
    };
    const result = await DummyModel.pagedFind(
      filter, limit, page, options
    );

    Code.expect(result).to.be.an.object();
  });
});

lab.experiment('Proxy methods', () => {

  let DummyModel;

  lab.before(async () => {

    DummyModel = class extends AnchorModel {
    };

    DummyModel.schema = Joi.object().keys({
      _id: Joi.object(),
      count: Joi.number(),
      group: Joi.string(),
      isCool: Joi.boolean(),
      buddy: Joi.string(),
      name: Joi.string().required(),
      createdAt: Joi.date(),
      updatedAt: Joi.date()
    });

    DummyModel.collectionName = 'dummies';

    await AnchorModel.connect(config.connection, config.options);
  });

  lab.after(() => {

    AnchorModel.disconnect();
  });

  lab.afterEach(async () => {

    await DummyModel.deleteMany({});
  });

  lab.test('it inserts one document and returns the result', async () => {

    const document = {
      name: 'Horse'
    };
    const results = await DummyModel.insertOne(document);

    Code.expect(results).to.be.an.array();
    Code.expect(results.length).to.equal(1);
  });

  lab.test('it inserts one document without createdAt being passed in and returns the result', async () => {

    const date = new Date('2018-01-01');
    const document = {
      name: 'Pony',
      createdAt: date
    };

    const results = await DummyModel.insertOne(document);
    Code.expect(results).to.be.an.array();
    Code.expect(results[0].createdAt).to.equal(date);
    Code.expect(results.length).to.equal(1);
  });

  lab.test('it inserts many documents and returns the results', async () => {

    const documents = [
      { name: 'Toast' },
      { name: 'Space' }
    ];
    const results = await DummyModel.insertMany(documents);

    Code.expect(results).to.be.an.array();
    Code.expect(results.length).to.equal(2);
  });

  lab.test('it inserts many documents without createdAt being passed in and returns the result', async () => {

    const date = new Date('2018-01-01');
    const documents = [
      { name: 'Timon', createdAt: date },
      { name: 'Pumba', createdAt: date }
    ];

    const results = await DummyModel.insertMany(documents);
    Code.expect(results).to.be.an.array();
    Code.expect(results[0].createdAt).to.equal(date);
    Code.expect(results[1].createdAt).to.equal(date);
    Code.expect(results.length).to.equal(2);
  });

  lab.test('it updates a document and returns the results', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];
    const testDocs = await DummyModel.insertMany(documents);
    const filter = {
      _id: testDocs[1]._id
    };
    const update = {
      $set: { isCool: true }
    };
    const result = await DummyModel.updateOne(filter, update);

    Code.expect(result).to.be.an.object();
  });

  lab.test('it updates a document and returns the results without timestamps', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    DummyModel.timestamps = false;

    const testDocs = await DummyModel.insertMany(documents);
    const filter = {
      _id: testDocs[1]._id
    };
    const update = {
      $set: { isCool: true }
    };
    const result = await DummyModel.updateOne(filter, update);

    Code.expect(result).to.be.an.object();

    DummyModel.timestamps = true;
  });

  lab.test('it updates a document and returns the results', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];
    const testDocs = await DummyModel.insertMany(documents);
    const filter = {
      _id: testDocs[0]._id
    };
    const update = {
      $set: { isCool: true }
    };
    const options = { upsert: true };
    const result = await DummyModel.updateOne(filter, update, options);

    Code.expect(result).to.be.an.object();
  });

  lab.test('it updates many documents and returns the results', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = {};
    const update = { $set: { isCool: true } };
    const result = await DummyModel.updateMany(filter, update);

    Code.expect(result).to.be.an.object();
  });

  lab.test('it updates many documents and returns the results without timestamps', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    DummyModel.timestamps = false;

    await DummyModel.insertMany(documents);

    const filter = {};
    const update = { $set: { isCool: true } };
    const result = await DummyModel.updateMany(filter, update);

    Code.expect(result).to.be.an.object();

    DummyModel.timestamps = true;
  });

  lab.test('it updates many documents and returns the results (with options)', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = {};
    const update = { $set: { isCool: true } };
    const options = { upsert: true };
    const result = await DummyModel.updateMany(filter, update, options);

    Code.expect(result).to.be.an.object();
  });

  lab.test('it returns aggregate results from a collection', async () => {

    const documents = [
      { name: 'Ren', group: 'Friend', count: 100 },
      { name: 'Stimpy', group: 'Friend', count: 10 },
      { name: 'Yak', group: 'Foe', count: 430 }
    ];

    await DummyModel.insertMany(documents);

    const pipeline = [
      { $match: {} },
      { $group: { _id: '$group', total: { $sum: '$count' } } },
      { $sort: { total: -1 } }
    ];
    const result = await DummyModel.aggregate(pipeline);

    Code.expect(result[0].total).to.equal(430);
    Code.expect(result[1].total).to.equal(110);
  });

  lab.test('it returns a collection count', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const result = await DummyModel.count({});

    Code.expect(result).to.equal(3);
  });

  lab.test('it returns distinct results from a collection', async () => {

    const documents = [
      { name: 'Ren', group: 'Friend' },
      { name: 'Stimpy', group: 'Friend' },
      { name: 'Yak', group: 'Foe' }
    ];

    await DummyModel.insertMany(documents);

    const result = await DummyModel.distinct('group');

    Code.expect(result).to.be.an.array();
    Code.expect(result.length).to.equal(2);
  });

  lab.test('it returns a result array', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const results = await DummyModel.find({});

    Code.expect(results).to.be.an.array();

    results.forEach((result) => {

      Code.expect(result).to.be.an.instanceOf(DummyModel);
    });
  });

  lab.test('it returns a single result', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const result = await DummyModel.findOne({});

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns a single result via id', async () => {

    const document = {
      name: 'Ren'
    };
    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;
    const result = await DummyModel.findById(id);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it updates a single document via findByIdAndUpdate', async () => {

    const document = {
      name: 'Ren'
    };
    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;
    const update = {
      name: 'New Name'
    };
    const result = await DummyModel.findByIdAndUpdate(id, update);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it updates a single document via findByIdAndUpdate without timestamps', async () => {

    const document = {
      name: 'Ren'
    };

    DummyModel.timestamps = false;

    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;
    const update = {
      name: 'New Name'
    };
    const result = await DummyModel.findByIdAndUpdate(id, update);

    Code.expect(result).to.be.an.instanceOf(DummyModel);

    DummyModel.timestamps = true;
  });

  lab.test('it updates a single document via id (with options)', async () => {

    const document = {
      name: 'Ren'
    };
    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;
    const update = {
      name: 'New Name'
    };
    const options = {
      returnOriginal: false
    };
    const result = await DummyModel.findByIdAndUpdate(id, update, options);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it updates a single document via findOneAndUpdate', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const filter = { name: 'Ren' };
    const update = { name: 'New Name' };
    const result = await DummyModel.findOneAndUpdate(filter, update);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it updates a single document via findOneAndUpdate without timestamps', async () => {

    const document = {
      name: 'Ren'
    };

    DummyModel.timestamps = false;

    await DummyModel.insertOne(document);

    const filter = { name: 'Ren' };
    const update = { name: 'New Name' };
    const result = await DummyModel.findOneAndUpdate(filter, update);

    Code.expect(result).to.be.an.instanceOf(DummyModel);

    DummyModel.timestamps = true;
  });

  lab.test('it updates a single document via findOneAndUpdate (with options)', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const filter = { name: 'Ren' };
    const update = { name: 'New Name' };
    const options = { returnOriginal: true };
    const result = await DummyModel.findOneAndUpdate(filter, update, options);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it replaces a single document via findOneAndReplace', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const filter = {
      name: 'Ren'
    };
    const newDocument = {
      name: 'Stimpy'
    };
    const result = await DummyModel.findOneAndReplace(filter, newDocument);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it replaces a single document via findOneAndReplace (with options)', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const filter = {
      name: 'Ren'
    };
    const doc = {
      isCool: true
    };
    const options = {
      returnOriginal: true
    };
    const result = await DummyModel.findOneAndReplace(filter, doc, options);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it replaces one document and returns the result', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const filter = {
      name: 'Ren'
    };
    const newDocument = {
      name: 'Stimpy'
    };
    const result = await DummyModel.replaceOne(filter, newDocument);

    Code.expect(result).to.be.an.array();
    Code.expect(result[0]).to.be.an.instanceof(DummyModel);
  });

  lab.test('it replaces one document and returns the result (with options)', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const filter = {
      name: 'Ren'
    };
    const doc = {
      name: 'Stimpy'
    };
    const options = {
      upsert: true
    };
    const result = await DummyModel.replaceOne(filter, doc, options);

    Code.expect(result).to.be.an.array();
    Code.expect(result[0]).to.be.an.instanceof(DummyModel);
  });

  lab.test('it deletes a document via findOneAndDelete', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const filter = {
      name: 'Ren'
    };

    const result = await DummyModel.findOneAndDelete(filter);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it deletes a document via findByIdAndDelete', async () => {

    const document = {
      name: 'Ren'
    };
    const testDocs = await DummyModel.insertOne(document);

    const id = testDocs[0]._id;

    const result = await DummyModel.findByIdAndDelete(id);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it deletes a single document via findByIdAndDelete (with options)', async () => {

    const document = {
      name: 'Ren'
    };
    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;
    const options = {
      projection: {
        name: 1
      }
    };
    const result = await DummyModel.findByIdAndDelete(id, options);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it deletes one document via deleteOne', async () => {

    const document = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document);

    const result = await DummyModel.deleteOne({});

    Code.expect(result).to.be.an.object();
  });

  lab.test('it deletes multiple documents and returns the count via deleteMany', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const result = await DummyModel.deleteMany({});

    Code.expect(result).to.be.an.object();
  });

  lab.test('it returns a single result via lookupById with length of 2', async () => {

    const document1 = {
      name: 'Ren'
    };

    const document2 = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document1);
    await DummyModel.insertOne(document2);

    const parentDocument = {
      name: 'Jen',
      buddy: 'Ren'
    };

    const parentTestDocs = await DummyModel.insertOne(parentDocument);
    const parentId = parentTestDocs[0]._id;

    const lookup = [{
      local: 'buddy',
      foreign: 'name',
      as: 'buddy'
    }];

    const result = await DummyModel.lookupById(parentId, lookup);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
    Code.expect(result.buddy).to.be.an.array();
  });

  lab.test('it returns a single result via lookupById with length of 1 with one flag set', async () => {

    const document1 = {
      name: 'Ren'
    };

    const document2 = {
      name: 'Ren'
    };

    await DummyModel.insertOne(document1);
    await DummyModel.insertOne(document2);

    const parentDocument = {
      name: 'Jen',
      buddy: 'Ren'
    };

    const parentTestDocs = await DummyModel.insertOne(parentDocument);
    const parentId = parentTestDocs[0]._id;

    const lookup = [{
      local: 'buddy',
      foreign: 'name',
      one: true,
      as: 'buddy'
    }];

    const result = await DummyModel.lookupById(parentId, lookup);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
    Code.expect(result.buddy).to.be.an.object();
  });

  lab.test('it returns a single result via lookupById with lookup operator equal to $in', async () => {

    const document1 = {
      name: 'Ren1'
    };

    const document2 = {
      name: 'Ren2'
    };

    const friend1 = await DummyModel.insertOne(document1);
    const friend2 = await DummyModel.insertOne(document2);

    const parentDocument = {
      name: 'Jen',
      buddy: [`${friend1[0]._id}`,`${friend2[0]._id}`]
    };

    const parentTestDocs = await DummyModel.insertOne(parentDocument);
    const parentId = parentTestDocs[0]._id;

    const lookup = [{
      from: DummyModel,
      local: 'buddy',
      foreign: '_id',
      operator: '$in',
      as: 'buddy'
    }];

    const result = await DummyModel.lookupById(parentId, lookup);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
    Code.expect(result.buddy).to.be.an.array();
  });

  lab.test('it returns a single result via lookupById with length of 0', async () => {

    const parentDocument = {
      name: 'Jen',
      buddy: 'Ren'
    };

    const parentTestDocs = await DummyModel.insertOne(parentDocument);
    const parentId = parentTestDocs[0]._id;

    const lookup = [{
      local: 'buddy',
      foreign: 'name',
      as: 'buddy'
    }];

    const result = await DummyModel.lookupById(parentId,{}, lookup);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns a single result via lookupById with no lookup', async () => {

    const parentDocument = {
      name: 'Jen',
      buddy: 'Ren'
    };

    const parentTestDocs = await DummyModel.insertOne(parentDocument);
    const parentId = parentTestDocs[0]._id;

    const result = await DummyModel.lookupById(parentId);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns a single result via lookupOne', async () => {

    const document = {
      name: 'Ren'
    };

    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;

    const parentDocument = {
      name: 'Jen',
      buddy: id.toString()
    };

    await DummyModel.insertOne(parentDocument);

    const lookup = [{
      local: 'buddy',
      foreign: '_id',
      as: 'buddy'
    }];

    const result = await DummyModel.lookupOne({ name: 'Jen' }, lookup);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
    Code.expect(result.buddy).to.be.an.array();
  });

  lab.test('it returns a single result via lookupOne with options', async () => {

    const document = {
      name: 'Ren'
    };

    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;

    const parentDocument = {
      name: 'Jen',
      buddy: id.toString()
    };

    await DummyModel.insertOne(parentDocument);

    const lookup = [{
      local: 'buddy',
      foreign: '_id',
      as: 'buddy'
    }];

    const result = await DummyModel.lookupOne({ name: 'Jen' }, {}, lookup);

    Code.expect(result).to.be.an.instanceOf(DummyModel);
    Code.expect(result.buddy).to.be.an.array();
  });

  lab.test('it returns a single result via lookupOne no lookup', async () => {

    const document = {
      name: 'Ren'
    };

    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;

    const parentDocument = {
      name: 'Jen',
      buddy: id.toString()
    };

    await DummyModel.insertOne(parentDocument);

    const result = await DummyModel.lookupOne({ name: 'Jen' });

    Code.expect(result).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns results via pagedLookup', async () => {

    const document = {
      name: 'Ren'
    };

    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;

    const parentDocument = {
      name: 'Jen',
      buddy: id.toString()
    };

    await DummyModel.insertOne(parentDocument);

    const lookup = [{
      local: 'buddy',
      foreign: '_id',
      as: 'buddy'
    }];

    const result = await DummyModel.pagedLookup({ name: 'Jen' }, 1, 10, lookup);

    Code.expect(result.data[0]).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns results via pagedLookup with options', async () => {

    const document = {
      name: 'Ren'
    };

    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;

    const parentDocument = {
      name: 'Jen',
      buddy: id.toString()
    };

    await DummyModel.insertOne(parentDocument);

    const lookup = [{
      local: 'buddy',
      foreign: '_id',
      as: 'buddy'
    }];

    const result = await DummyModel.pagedLookup({ name: 'Jen' }, 1, 10, {}, lookup);

    Code.expect(result.data[0]).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns results via pagedLookup with no lookup', async () => {

    const document = {
      name: 'Ren'
    };

    const testDocs = await DummyModel.insertOne(document);
    const id = testDocs[0]._id;

    const parentDocument = {
      name: 'Jen',
      buddy: id.toString()
    };

    await DummyModel.insertOne(parentDocument);

    const result = await DummyModel.pagedLookup({ name: 'Jen' }, 1, 10);

    Code.expect(result.data[0]).to.be.an.instanceOf(DummyModel);
  });

  lab.test('it returns paged lookup results where begin item is less than total', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = { 'role.special': { $exists: true } };
    const limit = 2;
    const page = 1;
    const options = {
      sort: { _id: -1 }
    };
    const lookup = [{
      local: 'buddy',
      foreign: '_id',
      as: 'buddy'
    }];

    const result = await DummyModel.pagedLookup(
      filter, limit, page, options, lookup
    );

    Code.expect(result).to.be.an.object();
  });

  lab.test('it returns paged results where end item is less than total', async () => {

    const documents = [
      { name: 'Ren' },
      { name: 'Stimpy' },
      { name: 'Yak' }
    ];

    await DummyModel.insertMany(documents);

    const filter = {};
    const limit = 2;
    const page = 1;
    const options = {
      sort: { _id: -1 }
    };
    const lookup = [{
      local: 'buddy',
      foreign: '_id',
      as: 'buddy'
    }];
    const result = await DummyModel.pagedLookup(
      filter, limit, page, options, lookup
    );

    Code.expect(result).to.be.an.object();
  });
});

