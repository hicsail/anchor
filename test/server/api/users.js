'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedAdmin = require('../fixtures/credentials-admin');
const AuthenticatedRoot = require('../fixtures/credentials-root');
const AuthenticatedClinician = require('../fixtures/credentials-clinician');
const AuthenticatedAnalyst = require('../fixtures/credentials-analyst');
const AuthenticatedUser = require('../fixtures/credentials-user');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const Lab = require('lab');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const UserPlugin = require('../../../server/api/users');


const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    User: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/user')] = stub.User;

  const ModelsPlugin = {
    register: Proxyquire('hapi-mongo-models', proxy),
    options: Manifest.get('/registrations').filter((reg) => {

      if (reg.plugin &&
        reg.plugin.register &&
        reg.plugin.register === 'hapi-mongo-models') {

        return true;
      }

      return false;
    })[0].plugin.options
  };

  const plugins = [HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, ModelsPlugin, AuthPlugin, UserPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.after((done) => {

  server.plugins['hapi-mongo-models'].MongoModels.disconnect();

  done();
});


lab.experiment('User Plugin Result List', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/users',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when paged find fails', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('paged find failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns an array of documents successfully', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, { data: [{}, {}, {}] });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });


  lab.test('it returns an array of documents successfully using filters', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, { data: [{}, {}, {}] });
    };

    request.url = '/users?limit=10&page=1';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });
});


lab.experiment('User Plugin Result List', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/table/users?search[value]=""',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when paged find fails', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('paged find failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns an array of documents successfully', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });


  lab.test('it returns an array of documents successfully using filters', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    request.url = '/table/users?fields=username studyId&order[0][dir]=desc&search[value]=test';
    request.credentials = AuthenticatedAnalyst;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an array of documents successfully using filters', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    request.url = '/table/users?fields=username studyId&order[0][dir]=asc&search[value]=test';
    request.credentials = AuthenticatedAnalyst;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an array of documents successfully if user is a clinician', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    request.credentials = AuthenticatedClinician;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an array of documents successfully if user has no roles', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    request.credentials = AuthenticatedUser;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an array of documents successfully if user is a analyst', (done) => {

    stub.User.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    request.credentials = AuthenticatedAnalyst;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin Read', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/users/93EP150D35',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when find by id fails', (done) => {

    stub.User.findById = function (id, callback) {

      callback(Error('find by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when find by id misses', (done) => {

    stub.User.findById = function (id, callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it returns a document successfully', (done) => {

    stub.User.findById = function (id, callback) {

      callback(null, { _id: '93EP150D35' });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});

lab.experiment('Users Plugin Select2', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/select2/users?term=root',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when find fails', (done) => {

    stub.User.pagedFind = function (query, fields, sort, limit, page, callback) {

      callback(Error('find failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });



  lab.test('it returns a document successfully', (done) => {

    stub.User.pagedFind = function (query, fields, sort, limit, page, callback) {

      callback(null, {
        data: [{}, {}, {}],
        pages: {
          hasNext: false
        }
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin (My) Read', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/users/my',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when find by id fails', (done) => {

    stub.User.findById = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when find by id misses', (done) => {

    stub.User.findById = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it returns a document successfully', (done) => {

    stub.User.findById = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, { _id: '93EP150D35' });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/users',
      payload: {
        username: 'muddy',
        password: 'dirtAndwater1',
        email: 'mrmud@mudmail.mud',
        name: 'muddy test'
      },
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when find one fails for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(null, {});
      }
      else {
        callback(Error('find one failed'));
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when find one fails for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(null, {});
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(Error('create failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it creates a document successfully', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });


  lab.test('it returns an error if passwords is not complex', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(null, {});
    };

    request.payload.password = 'password';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin Update', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/420000000000000000000000',
      payload: {
        name: 'Mr. Mud',
        username: 'muddy',
        email: 'mrmud@mudmail.mud'
      },
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when find one fails for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(null, {});
      }
      else {
        callback(Error('find one failed'));
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when find one fails for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(null, {});
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when update fails', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('update failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns not found when find by id misses', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, undefined);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });


  lab.test('it updates a document successfully', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin (My) Update', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/my',
      payload: {
        username: 'muddy',
        email: 'mrmud@mudmail.mud',
        name: 'my name'
      },
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when find one fails for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(null, {});
      }
      else {
        callback(Error('find one failed'));
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when find one fails for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(null, {});
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when update fails', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.findByIdAndUpdate = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('update failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it updates a document successfully', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.findByIdAndUpdate = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, { _id: '1D', username: 'muddy' });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin Set Password', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/420000000000000000000000/password',
      payload: {
        password: 'fromDirt1'
      },
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when generate password hash fails', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(Error('generate password hash failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns an error when find by user fails', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findById = function (id, callback) {

      callback(Error('findByUserFailed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when scope failed', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findById = function (id, callback) {

      callback(null, { roles: { root:true } });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(401);

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findById = function (id, callback) {

      callback(null, { roles:{} });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('update failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it sets the password successfully', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it returns an error if passwords is not complex', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {});
    };

    request.payload.password = 'password';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin (My) Set Password', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/my/password',
      payload: {
        password: 'fromDirt1'
      },
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when generate password hash fails', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(Error('generate password hash failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns an error when update fails', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findByIdAndUpdate = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('update failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it sets the password successfully', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findByIdAndUpdate = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });


  lab.test('it returns an error if passwords is not complex', (done) => {

    stub.User.generatePasswordHash = function (password, callback) {

      callback(null, { password: '', hash: '' });
    };

    stub.User.findByIdAndUpdate = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {});
    };

    request.payload.password = 'password';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Users Plugin Delete', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/users/93EP150D35',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when delete by id fails', (done) => {

    stub.User.findByIdAndDelete = function (id, callback) {

      callback(Error('delete by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when delete by id misses', (done) => {

    stub.User.findByIdAndDelete = function (id, callback) {

      callback(null, undefined);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it deletes a document successfully', (done) => {

    stub.User.findByIdAndDelete = function (id, callback) {

      callback(null, 1);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.message).to.match(/success/i);

      done();
    });
  });
});

lab.experiment('Users Plugin Clinician Promote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/clinician/93EP150D35',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when you are promoting yourself', (done) => {

    request.url = '/users/clinician/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if already role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          clinician: {}
        }
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.clinician).to.exist();

      done();
    });
  });

  lab.test('it returns successful when adding role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {
          clinician: true
        }
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.clinician).to.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});


lab.experiment('Users Plugin Analyst Promote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/analyst/93EP150D35',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when you are promoting yourself', (done) => {

    request.url = '/users/analyst/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if already role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          analyst: true
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {
          analyst: true
        }
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.analyst).to.exist();

      done();
    });
  });

  lab.test('it returns successful when adding role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.analyst).to.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});


lab.experiment('Users Plugin Researcher Promote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/researcher/93EP150D35',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when you are promoting yourself', (done) => {

    request.url = '/users/researcher/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if already role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          researcher: true
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {
          researcher: true
        }
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.researcher).to.exist();

      done();
    });
  });

  lab.test('it returns successful when adding role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.researcher).to.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});

lab.experiment('Users Plugin Admin Promote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/admin/93EP150D35',
      credentials: AuthenticatedRoot
    };

    done();
  });


  lab.test('it returns an error when you are promoting yourself', (done) => {

    request.url = '/users/admin/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if already role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          admin: true
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {
          admin: true
        }
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.admin).to.exist();

      done();
    });
  });

  lab.test('it returns successful when adding role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.admin).to.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});


lab.experiment('Users Plugin Clinician Demote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/users/clinician/93EP150D35',
      credentials: AuthenticatedRoot
    };

    done();
  });


  lab.test('it returns an error when you are demoting yourself', (done) => {

    request.url = '/users/clinician/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if role is not present', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.clinician).to.not.exist();

      done();
    });
  });

  lab.test('it returns successful when removing role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          clinician: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.clinician).to.not.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          clinician: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});


lab.experiment('Users Plugin Analyst Demote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/users/analyst/93EP150D35',
      credentials: AuthenticatedRoot
    };

    done();
  });


  lab.test('it returns an error when you are demoting yourself', (done) => {

    request.url = '/users/analyst/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if role is not present', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.analyst).to.not.exist();

      done();
    });
  });

  lab.test('it returns successful when removing role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          analyst: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.analyst).to.not.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          analyst: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});

lab.experiment('Users Plugin Researcher Demote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/users/researcher/93EP150D35',
      credentials: AuthenticatedRoot
    };

    done();
  });


  lab.test('it returns an error when you are demoting yourself', (done) => {

    request.url = '/users/researcher/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if role is not present', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.researcher).to.not.exist();

      done();
    });
  });

  lab.test('it returns successful when removing role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          researcher: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.researcher).to.not.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          researcher: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});


lab.experiment('Users Plugin Admin Demote', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/users/admin/93EP150D35',
      credentials: AuthenticatedRoot
    };

    done();
  });


  lab.test('it returns an error when you are demoting yourself', (done) => {

    request.url = '/users/admin/535HOW35';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns an error when findById fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if role is not present', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.researcher).to.not.exist();

      done();
    });
  });

  lab.test('it returns successful when removing role', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          admin: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.admin).to.not.exist();

      done();
    });
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.User.findById = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {
          admin: {}
        }
      });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});


lab.experiment('Users Plugin Participation', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/users/93EP150D35/participation',
      credentials: AuthenticatedRoot,
      payload: {
        inStudy: true,
        studyID: 1
      }
    };

    done();
  });

  lab.test('it returns an error when findByIdAndUpdate fails', (done) => {

    stub.User.findByIdAndUpdate = function (id, options, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when user is not found', (done) => {

    stub.User.findByIdAndUpdate = function (id, options, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });

  lab.test('it returns successful if role is not present', (done) => {

    stub.User.findByIdAndUpdate = function (id, options, callback) {

      callback(null, {
        username: 'test',
        roles: {}
      });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.roles.researcher).to.not.exist();

      done();
    });
  });
});


