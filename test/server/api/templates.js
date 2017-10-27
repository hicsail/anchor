'use strict';
const TemplatePlugin = require('../../../server/api/templates');
const AuthPlugin = require('../../../server/auth');
const AuthenticatedAdmin = require('../fixtures/credentials-admin');
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


const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    Template: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/template')] = stub.Template;

  const ModelsPlugin = {
    register: Proxyquire('hicsail-hapi-mongo-models', proxy),
    options: Manifest.get('/registrations').filter((reg) => {

      if (reg.plugin &&
        reg.plugin.register &&
        reg.plugin.register === 'hicsail-hapi-mongo-models') {

        return true;
      }

      return false;
    })[0].plugin.options
  };

  const plugins = [HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, ModelsPlugin, AuthPlugin, TemplatePlugin];
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

  server.plugins['hicsail-hapi-mongo-models'].MongoModels.disconnect();

  done();
});


lab.experiment('Template Plugin Result List', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/templates',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when paged find fails', (done) => {

    stub.Template.pagedLookupById = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });


  lab.test('it returns an array of documents successfully', (done) => {

    stub.Template.pagedLookupById = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, { data: [{}, {}, {}] });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();

      done();
    });
  });
});


lab.experiment('Template Plugin Result List', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/table/templates?search[value]=""',
      credentials: AuthenticatedAdmin
    };

    done();
  });

  lab.test('it returns an error when paged find fails', (done) => {

    stub.Template.pagedLookupById = function () {

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

    stub.Template.pagedLookupById = function () {

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

    stub.Template.pagedLookupById = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    request.url = '/table/templates?fields=username ip time&order[0][dir]=desc&search[value]=test';
    request.credentials = AuthenticatedAnalyst;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an array of documents successfully using filters', (done) => {

    stub.Template.pagedLookupById = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {
        data: [{}, {}, {}],
        items: {
          total: 3
        }
      });
    };

    request.url = '/table/templates?fields=username ip time&order[0][dir]=asc&search[value]=test';
    request.credentials = AuthenticatedAnalyst;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an array of documents successfully if user is a clinician', (done) => {

    stub.Template.pagedLookupById = function () {

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

    stub.Template.pagedLookupById = function () {

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

    stub.Template.pagedLookupById = function () {

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

lab.experiment('Template Plugin Read', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/templates/93EP150D35',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when find by id fails', (done) => {

    stub.Template.findById = function (id, callback) {

      callback(Error('find by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when find by id misses', (done) => {

    stub.Template.findById = function (id, callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it returns a document successfully', (done) => {

    stub.Template.findById = function (id, callback) {

      callback(null, { _id: '93EP150D35' });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Template Plugin Delete', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/templates/93EP150D35',
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when delete by id fails', (done) => {

    stub.Template.findByIdAndDelete = function (id, callback) {

      callback(Error('delete by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when delete by id misses', (done) => {

    stub.Template.findByIdAndDelete = function (id, callback) {

      callback(null, undefined);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it deletes a document successfully', (done) => {

    stub.Template.findByIdAndDelete = function (id, callback) {

      callback(null, 1);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.message).to.match(/success/i);

      done();
    });
  });
});


lab.experiment('Template Plugin Update', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/templates/420000000000000000000000',
      payload: {
        name: 'name'
      },
      credentials: AuthenticatedAdmin
    };

    done();
  });

  lab.test('it returns an error when update fails', (done) => {

    stub.Template.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('update failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns not found when find by id misses', (done) => {

    stub.Template.findByIdAndUpdate = function (id, update, callback) {

      callback(null, undefined);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);

      done();
    });
  });


  lab.test('it updates a document successfully', (done) => {

    stub.Template.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Template Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/templates',
      payload: {
        name: 'name'
      },
      credentials: AuthenticatedAdmin
    };

    done();
  });


  lab.test('it returns an error when create fails', (done) => {

    stub.Template.create = function (name, userId, callback) {

      callback(Error('create failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it creates a document successfully', (done) => {

    stub.Template.create = function (name, userId, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});

