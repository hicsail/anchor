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
const GetServerRoutes = require('../../../server/helpers/getServerRoutes');
const UserPlugin = require('../../../server/api/users');

const lab = exports.lab = Lab.script();
let server;


lab.before((done) => {

  const ModelsPlugin = {
    register: require('hicsail-hapi-mongo-models'),
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

lab.experiment('Get Server Routes Helper', () => {

  lab.test('it returns successfully all server routes', (done) => {

    const routes = GetServerRoutes(server);

    Code.expect(routes).to.exist();
    Code.expect(routes).to.be.an.object();
    done();
  });
});
