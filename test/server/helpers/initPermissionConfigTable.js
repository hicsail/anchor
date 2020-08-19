'use strict';
const AuthPlugin = require('../../../server/auth');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const InitPermissionConfigTable = require('../../../server/helpers/initPermissionConfigTable');
const UserPlugin = require('../../../server/api/users');
const MakeMockModel = require('../fixtures/make-mock-model');
const Path = require('path');
const Proxyquire = require('proxyquire');

const lab = exports.lab = Lab.script();
let server;
const stub = {
  RouteScope: MakeMockModel()
};

lab.before((done) => {

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/route-scope')] = stub.RouteScope;

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

  const plugins = [HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, AuthPlugin, UserPlugin, ModelsPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});

lab.experiment('Initialize permission config table', () => {

  lab.test('it returns nothing when successfully ', (done) => {

    Code.expect(InitPermissionConfigTable(server)).to.equal(undefined);
    done();
  });

});
