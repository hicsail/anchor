'use strict';
const AuthPlugin = require('../../../../server/auth');
const AuthenticatedAccount = require('../../fixtures/credentials-user');
const Code = require('code');
const Config = require('../../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const MakeMockModel = require('../../fixtures/make-mock-model');
const Lab = require('lab');
const SetupPlugin = require('../../../../server/web/routes/setup');
const Manifest = require('../../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Vision = require('vision');
const Visionary = require('visionary');
const User = require('../../../../server/models/user');

const stub = {
  User: MakeMockModel()
};

const proxy = {};
proxy[Path.join(process.cwd(), './server/models/user')] = stub.User;

const lab = exports.lab = Lab.script();
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

const VisionaryPlugin = {
  register: Visionary,
  options: Manifest.get('/registrations').filter((reg) => {

    if (reg.plugin && reg.plugin.register && reg.plugin.register === 'visionary') {

      return true;
    }

    return false;
  })[0].plugin.options
};


let request;
let server;


lab.before((done) => {

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, ModelsPlugin, AuthPlugin, SetupPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Setup Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/setup'
    };

    done();
  });


  lab.test('it renders properly', (done) => {

    User.findOne = function (query,callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it renders properly with an authenticated account', (done) => {

    User.findOne = function (query,callback) {

      callback();
    };
    request.credentials = AuthenticatedAccount;
    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it return an error when find user fails', (done) => {

    User.findOne = function (query,callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});

lab.experiment('Setup Plugin Create Root User', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/setup',
      payload: {
        email: 'ren@stimpy.show',
        password: 'strongPassw0rd'
      }
    };

    done();
  });

  lab.test('it returns an error when password do not meet complexity standards', (done) => {

    request.payload.password = 'letmein';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when find one fails', (done) => {

    User.findOne = function (conditions, callback) {

      callback(Error('find one failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an error when email is in use', (done) => {

    User.findOne = function (conditions, callback) {

      callback(null,{});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an successful', (done) => {

    User.findOne = function (conditions, callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it returns an error if password hash failed', (done) => {

    User.generatePasswordHash = function (conditions, callback) {

      callback(Error('Password failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});
