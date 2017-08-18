'use strict';
const AuthPlugin = require('../../server/auth');
const Code = require('code');
const Config = require('../../config');
const CookieAdmin = require('./fixtures/cookie-admin');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const Lab = require('lab');
const MakeMockModel = require('./fixtures/make-mock-model');
const Manifest = require('../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Session = require('../../server/models/session');
const User = require('../../server/models/user');


const lab = exports.lab = Lab.script();
let server;
let stub;


lab.beforeEach((done) => {

  stub = {
    Session: MakeMockModel(),
    User: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;
  proxy[Path.join(process.cwd(), './server/models/user')] = stub.User;

  const ModelsPlugin = {
    register: Proxyquire('hapi-mongo-models', proxy),
    options: Manifest.get('/registrations').filter((reg) => {

      if (reg.plugin && reg.plugin.register && reg.plugin.register === 'hapi-mongo-models') {

        return true;
      }

      return false;
    })[0].plugin.options
  };

  const plugins = [HapiAuthCookie, HapiAuthBasic, ModelsPlugin, AuthPlugin];
  server = new Hapi.Server();
  server.connection({port: Config.get('/port/web')});
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.afterEach((done) => {

  server.plugins['hapi-mongo-models'].MongoModels.disconnect();

  done();
});


lab.experiment('Auth Plugin Basic', () => {

  lab.test('it returns authentication credentials', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({_id: '2D', userId: '1D', key: 'baddog'}));
    };

    stub.User.findById = function (username, callback) {

      callback(null, new User({_id: '1D', username: 'ren'}));
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('simple', request, (err, credentials) => {

          Code.expect(err).to.not.exist();
          Code.expect(credentials).to.be.an.object();
          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when the session is not found', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback();
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('simple', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          Code.expect(credentials).to.not.exist();
          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when the user is not found', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({username: 'ren', key: 'baddog'}));
    };

    stub.User.findByUsername = function (username, callback) {

      callback();
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('simple', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when a model error occurs', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(Error('session fail'));
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('simple', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          Code.expect(credentials).to.not.exist();
          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it takes over when the required role is missing', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({_id: '2D', userId: '1D', key: 'baddog'}));
    };

    stub.User.findById = function (id, callback) {

      callback(null, new User({_id: '1D', username: 'ren'}));
    };

    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategies: ['simple', 'session'],
          scope: 'admin'
        }
      },
      handler: function (request, reply) {

        Code.expect(request.auth.credentials).to.be.an.object();

        reply('ok');
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + (new Buffer('2D:baddog')).toString('base64')
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result.message).to.match(/insufficient scope/i);

      done();
    });
  });


  lab.test('it continues through pre handler when role is present', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({_id: '2D', userId: '1D', key: 'baddog'}));
    };

    stub.User.findById = function (id, callback) {

      const user = new User({
        username: 'ren',
        roles: {
          admin: {
            id: '953P150D35',
            name: 'Ren Höek'
          }
        }
      });

      user._roles = {
        admin: {
          _id: '953P150D35',
          name: {
            first: 'Ren',
            last: 'Höek'
          }
        }
      };

      callback(null, user);
    };

    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategies: ['simple', 'session'],
          scope: ['account', 'admin']
        }
      },
      handler: function (request, reply) {

        Code.expect(request.auth.credentials).to.be.an.object();

        reply('ok');
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + (new Buffer('ren:baddog')).toString('base64')
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result).to.match(/ok/i);

      done();
    });
  });
});

lab.experiment('Auth Plugin Cookie', () => {

  lab.test('it returns authentication credentials', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({_id: '2D', userId: '1D', key: 'baddog'}));
    };

    stub.User.findById = function (username, callback) {

      callback(null, new User({_id: '1D', username: 'ren'}));
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('session', request, (err, credentials) => {

          Code.expect(err).to.not.exist();
          Code.expect(credentials).to.be.an.object();

          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        cookie: CookieAdmin
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when the session is not found', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback();
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('session', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          // Code.expect(credentials).to.not.exist();

          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        cookie: CookieAdmin
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when the user is not found', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({username: 'ren', key: 'baddog'}));
    };

    stub.User.findByUsername = function (username, callback) {

      callback();
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('session', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        cookie: CookieAdmin
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when a model error occurs', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(Error('session fail'));
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('session', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          // Code.expect(credentials).to.not.exist();

          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        cookie: CookieAdmin
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it takes over when the required role is missing', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({_id: '2D', userId: '1D', key: 'baddog'}));
    };

    stub.User.findById = function (id, callback) {

      callback(null, new User({_id: '1D', username: 'ren'}));
    };

    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategy: 'session',
          scope: 'admin'
        }
      },
      handler: function (request, reply) {

        Code.expect(request.auth.credentials).to.be.an.object();

        reply('ok');
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        cookie: CookieAdmin
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result.message).to.match(/insufficient scope/i);

      done();
    });
  });


  lab.test('it continues through pre handler when role is present', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({_id: '2D', userId: '1D', key: 'baddog'}));
    };

    stub.User.findById = function (id, callback) {

      const user = new User({
        username: 'ren',
        roles: {
          admin: {
            id: '953P150D35',
            name: 'Ren Höek'
          }
        }
      });

      user._roles = {
        admin: {
          _id: '953P150D35',
          name: {
            first: 'Ren',
            last: 'Höek'
          }
        }
      };

      callback(null, user);
    };

    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategy: 'session',
          scope: ['account', 'admin']
        }
      },
      handler: function (request, reply) {

        Code.expect(request.auth.credentials).to.be.an.object();

        reply('ok');
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        cookie: CookieAdmin
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result).to.match(/ok/i);

      done();
    });
  });
});
