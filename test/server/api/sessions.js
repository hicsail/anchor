'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const SessionApi = require('../../../server/api/sessions');
const Session = require('../../../server/models/session');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');

const lab = exports.lab = Lab.script();
let server;
let authenticatedRoot;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => SessionApi.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });

  plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(HapiAuthBasic);
  plugins.push(HapiAuthCookie);
  plugins.push(HapiAuthJWT);
  plugins.push(Auth);
  plugins.push(AnchorApi);
  plugins.push(SessionApi);

  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  authenticatedRoot = await Fixtures.Creds.createRootUser('123abs','email@email.com');
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('DELETE /api/sessions/my/{id}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'DELETE',
      url: '/api/sessions/my/{id}',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }
    };
  });

  lab.test('it returns HTTP 400 when the logged in user tries to delete the current session', async () => {

    request.url = '/api/sessions/my/' + authenticatedRoot.session._id.toString();

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result.message).to.match(/Unable to close your current session. You can use logout instead/i);
  });

  lab.test('it returns HTTP 404 session findOneAndDelete misses', async () => {

    request.url = '/api/sessions/my/' + '555555555555555555555555';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result.message).to.match(/Document not found/i);

  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const session = await Session.create(`${authenticatedRoot.user._id}`,'127.0.0.1','Lab');
    request.url = '/api/sessions/my/' + session._id.toString();

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result.message).to.match(/Success/i);

  });
});
