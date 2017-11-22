'use strict';
const AuthPlugin = require('../../server/auth');
const Code = require('code');
const Config = require('../../config');
const CookieAdmin = require('./fixtures/cookie-admin');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const Lab = require('lab');
const MakeMockModel = require('./fixtures/make-mock-model');
const Manifest = require('../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Session = require('../../server/models/session');
const Token = require('../../server/models/token');
const User = require('../../server/models/user');


const lab = exports.lab = Lab.script();
let server;
let stub;


lab.beforeEach((done) => {

  stub = {
    Session: MakeMockModel(),
    Token: MakeMockModel(),
    User: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;
  proxy[Path.join(process.cwd(), './server/models/token')] = stub.Token;
  proxy[Path.join(process.cwd(), './server/models/user')] = stub.User;

  const ModelsPlugin = {
    register: Proxyquire('hicsail-hapi-mongo-models', proxy),
    options: Manifest.get('/registrations').filter((reg) => {

      if (reg.plugin && reg.plugin.register && reg.plugin.register === 'hicsail-hapi-mongo-models') {

        return true;
      }

      return false;
    })[0].plugin.options
  };

  const plugins = [HapiAuthCookie, HapiAuthBasic, HapiAuthJWT, ModelsPlugin, AuthPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.afterEach((done) => {

  server.plugins['hicsail-hapi-mongo-models'].MongoModels.disconnect();

  done();
});


lab.experiment('Auth Plugin Basic', () => {

  lab.test('it returns authentication credentials', (done) => {

    stub.Session.findByCredentials = function (username, key, callback) {

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
    };

    stub.User.findById = function (username, callback) {

      callback(null, new User({ _id: '1D', username: 'ren' }));
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

      callback(null, new Session({ username: 'ren', key: 'baddog' }));
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

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
    };

    stub.User.findById = function (id, callback) {

      callback(null, new User({ _id: '1D', username: 'ren' }));
    };

    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategies: ['simple', 'jwt', 'session'],
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

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
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

    stub.Session.findByIdAndUpdate = function (id, update, callback) {

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
    };

    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategies: ['simple', 'jwt', 'session'],
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

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
    };

    stub.User.findById = function (username, callback) {

      callback(null, new User({ _id: '1D', username: 'ren' }));
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

      callback(null, new Session({ username: 'ren', key: 'baddog' }));
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

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
    };

    stub.User.findById = function (id, callback) {

      callback(null, new User({ _id: '1D', username: 'ren' }));
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

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
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

    stub.Session.findByIdAndUpdate = function (id, update, callback) {

      callback(null, new Session({ _id: '2D', userId: '1D', key: 'baddog' }));
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


lab.experiment('Auth Plugin Token', () => {

  lab.test('it returns authentication credentials', (done) => {

    stub.Token.findOne = function (id, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
    };

    stub.Token.findByIdAndUpdate = function (id, options, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
    };

    stub.User.findById = function (username, callback) {

      callback(null, new User({ _id: '1D', username: 'ren' }));
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('jwt', request, (err, credentials) => {

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
        authorization: 'eyJhbGciOiJIUzI1NiJ9.NTljMmI3MTM0YjNiMDAxYjljNzk3ZTEx.r3WbN1Aat3i2JUhQaEkZQggnyBpZBCax1nBceQXGHVk'
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when the token is not found', (done) => {

    stub.Token.findOne = function (id, callback) {

      callback();
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('jwt', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'eyJhbGciOiJIUzI1NiJ9.NTljMmI3MTM0YjNiMDAxYjljNzk3ZTEx.r3WbN1Aat3i2JUhQaEkZQggnyBpZBCax1nBceQXGHVk'
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when the user is not found', (done) => {

    stub.Token.findOne = function (id, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
    };

    stub.Token.findByIdAndUpdate = function (id, options, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
    };

    stub.User.findByUsername = function (username, callback) {

      callback();
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('jwt', request, (err, credentials) => {

          Code.expect(err).to.be.an.object();
          reply('ok');
        });
      }
    });

    const request = {
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'eyJhbGciOiJIUzI1NiJ9.NTljMmI3MTM0YjNiMDAxYjljNzk3ZTEx.r3WbN1Aat3i2JUhQaEkZQggnyBpZBCax1nBceQXGHVk'
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it returns an error when a model error occurs', (done) => {

    stub.Token.findOne = function (id, callback) {

      callback(Error('token fail'));
    };

    server.route({
      method: 'GET',
      path: '/',
      handler: function (request, reply) {

        server.auth.test('jwt', request, (err, credentials) => {

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
        authorization: 'eyJhbGciOiJIUzI1NiJ9.NTljMmI3MTM0YjNiMDAxYjljNzk3ZTEx.r3WbN1Aat3i2JUhQaEkZQggnyBpZBCax1nBceQXGHVk'
      }
    };

    server.inject(request, (response) => {

      done();
    });
  });


  lab.test('it takes over when the required role is missing', (done) => {

    stub.Token.findOne = function (id, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
    };

    stub.Token.findByIdAndUpdate = function (id, options, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
    };

    stub.User.findById = function (id, callback) {

      callback(null, new User({ _id: '1D', username: 'ren' }));
    };

    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: {
          strategies: ['jwt'],
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
        authorization: 'eyJhbGciOiJIUzI1NiJ9.NTljMmI3MTM0YjNiMDAxYjljNzk3ZTEx.r3WbN1Aat3i2JUhQaEkZQggnyBpZBCax1nBceQXGHVk'
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result.message).to.match(/insufficient scope/i);

      done();
    });
  });


  lab.test('it continues through pre handler when role is present', (done) => {

    stub.Token.findOne = function (id, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
    };

    stub.Token.findByIdAndUpdate = function (id, options, callback) {

      callback(null, new Token({ _id: '2D', userId: '1D', active: true }));
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
          strategies: ['jwt'],
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
        authorization: 'eyJhbGciOiJIUzI1NiJ9.NTljMmI3MTM0YjNiMDAxYjljNzk3ZTEx.r3WbN1Aat3i2JUhQaEkZQggnyBpZBCax1nBceQXGHVk'
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result).to.match(/ok/i);

      done();
    });
  });
});
