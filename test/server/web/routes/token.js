'use strict';
const AuthPlugin = require('../../../../server/auth');
const AuthenticatedAccount = require('../../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const MakeMockModel = require('../../fixtures/make-mock-model');
const Lab = require('lab');
const TokenPlugin = require('../../../../server/web/routes/tokens');
const Manifest = require('../../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Token = require('../../../../server/models/token');
const Vision = require('vision');
const Visionary = require('visionary');

const stub = {
  Token: MakeMockModel()
};

const proxy = {};
proxy[Path.join(process.cwd(), './server/models/token')] = stub.Token;

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

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, ModelsPlugin, AuthPlugin, TokenPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Token Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/tokens'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it renders properly when user is authenticated', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});


lab.experiment('Create Token Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/tokens/create'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it renders properly when user is authenticated', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});

lab.experiment('Edit Token Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/tokens/93EP150D35'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it renders properly when user is authenticated', (done) => {

    request.credentials = AuthenticatedAccount;

    Token.findById = function (id, callback) {

      return callback(null,{ 'id':'93EP150D35' });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });

  lab.test('it renders properly when user is authenticated', (done) => {

    request.credentials = AuthenticatedAccount;

    Token.findById = function (id, callback) {

      return callback(Error('Error'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);
      done();
    });
  });
});
