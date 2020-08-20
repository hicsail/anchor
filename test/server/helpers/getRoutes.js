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
const GetRoutes = require('../../../server/helpers/getRoutes');
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

lab.experiment('Get Routes Helper', () => {

  lab.test('it returns successful when getting server routes', (done) => {

    GetRoutes('server', server, (err, routes) => {

      Code.expect(err).to.be.equal(null);
      Code.expect(routes).to.be.an.object();
      Code.expect(routes).to.exist();
      done();
    });
  });

  lab.test('it returns an error message when getting server routes with no server param' , (done) => {

    GetRoutes('server', null, (err, routes) => {

      Code.expect(err).to.equal('server flag with no server data');
      Code.expect(routes).to.be.equal(null);
      done();
    });
  });

  lab.test('it returns successful when getting permission-config routes', (done) => {

    GetRoutes('permission-config', null, (err, routes) => {

      Code.expect(err).to.be.equal(null);
      Code.expect(routes).to.be.an.object();
      Code.expect(routes).to.exist();
      done();
    });
  });

  lab.test('it returns successful when getting database routes', (done) => {

    GetRoutes('database', null, (err, routes) => {

      Code.expect(err).to.be.equal(null);
      Code.expect(routes).to.be.an.object();
      Code.expect(routes).to.exist();
      done();
    });
  });

  // lab.test('it returns an error message when model method returns error', (done) => {
  //
  //   stub.RouteScope.find = function (query, callback) {
  //
  //     callback(Error('failed'), null);
  //   };
  //
  //   GetRoutes('database', null, (err, routes) => {
  //
  //     // Code.expect(err).to.equal(null);
  //     // Code.expect(routes).to.equal(null);
  //     done();
  //   });
  // });
});
