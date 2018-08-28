'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Token = require('../../../server/models/token');
const TokenApi = require('../../../server/api/token');
const Permission = require('../../../server/api/permissions');
const User = require('../../../server/models/user');
const Session = require('../../../server/models/session');

const lab = exports.lab = Lab.script();
let server;
let user;
let session;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => TokenApi.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });

  plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(Auth);
  plugins.push(AnchorApi);
  plugins.push(Permission);
  plugins.push(TokenApi);

  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  user = await User.create({ username: 'ren', password: 'baddog', email: 'ren@stimpy.show', name: 'ren' });
  session = await Session.create({ userId: user._id.toString(), ip: '127.0.0.1', userAgent: 'Lab' });
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('POST /api/tokens', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/tokens',
      payload: {
        description: 'Test Token',
        permissions: {}
      },
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 400 when permission vaildation fails', async () => {

    request.payload.permissions = { 'POST-fake-route': false };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Token);
  });
});

lab.experiment('PUT /api/tokens/{id}/active', () => {

  let request;

  lab.beforeEach(async () => {

    let token = await Token.create({ description: 'test', permission: {} });
    token = await Token.findByIdAndUpdate(`${token._id}`, { $set: { isActive: false } });

    Code.expect(token.isActive).to.equal(false);

    request = {
      method: 'PUT',
      url:  `/api/tokens/${token._id}/active`,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Token);
    Code.expect(response.result.isActive).to.equal(true);

  });
});

lab.experiment('PUT /api/tokens/{id}/deactive', () => {

  let request;

  lab.beforeEach(async () => {

    const token = await Token.create({ description: 'test', permission: {} });

    Code.expect(token.isActive).to.equal(true);

    request = {
      method: 'PUT',
      url:  `/api/tokens/${token._id}/deactive`,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Token);
    Code.expect(response.result.isActive).to.equal(false);

  });
});
