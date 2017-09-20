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
const IndexPlugin = require('../../../../server/web/routes/index');
const Manifest = require('../../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Vision = require('vision');
const Visionary = require('visionary');

const stub = {
  Session: MakeMockModel()
};

const proxy = {};
proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;

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

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, ModelsPlugin, AuthPlugin, IndexPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Index Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/'
    };

    done();
  });


  lab.test('it renders properly', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);

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
