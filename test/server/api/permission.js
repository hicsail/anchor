'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Permission = require('../../../server/api/permissions');
const Role = require('../../../server/models/role');
const User = require('../../../server/models/user');
const Session = require('../../../server/models/session');

const lab = exports.lab = Lab.script();
let server;
let user;
let session;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => Permission.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });

  plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(Auth);
  plugins.push(AnchorApi);
  plugins.push(Permission);

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

lab.experiment('GET /api/permissions/available', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/permissions/available',
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.array();
    Code.expect(response.result[0].method).to.be.an.string();
    Code.expect(response.result[0].path).to.be.an.string();
    Code.expect(response.result[0].tag).to.be.an.string();
    Code.expect(response.result[0].key).to.be.an.string();
  });
});

lab.experiment('POST /api/role', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/role',
      payload: {
        name: 'testRole',
        permissions: {}
      },
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns HTTP 400 when payload is incorrect', async () => {

    request.payload.extra = 'test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
  });

  lab.test('it returns HTTP 400 when permission payload is incorrect', async () => {

    request.payload.permissions.testing = 'test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
  });
});

lab.experiment('PUT /api/role', () => {

  let request;

  lab.beforeEach(async () => {

    const role = await Role.create({ name: 'test', permissions: {}, userId: user._id.toString(), filter: [] });

    request = {
      method: 'PUT',
      url: '/api/role/' + role._id.toString(),
      payload: {
        name: 'testRole',
        permissions: {}
      },
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns HTTP 400 when payload is incorrect', async () => {

    request.payload.extra = 'test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
  });

  lab.test('it returns HTTP 400 when permission payload is incorrect', async () => {

    request.payload.permissions.testing = 'test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
  });
});

lab.experiment('PUT /api/permissions/user/{id}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'PUT',
      url: '/api/permissions/user/' + user._id.toString(),
      payload: {
        permissions: {}
      },
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns HTTP 400 when payload is incorrect', async () => {

    request.payload.extra = 'test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
  });

  lab.test('it returns HTTP 400 when permission payload is incorrect', async () => {

    request.payload.permissions.testing = 'test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
  });
});

lab.experiment('PUT /api/permissions/user/{userId}/role/{roleId}', () => {

  let request;
  let role;

  lab.beforeEach(async () => {

    role = await Role.create({ name: 'test', permissions: {}, userId: user._id.toString(), filter: [] });

    request = {
      method: 'PUT',
      url: `/api/permissions/user/${user._id}/role/${role._id}`,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns HTTP 404 when user is not found', async () => {

    request.url = `/api/permissions/user/555555555555555555555555/role/${role._id}`;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
  });

  lab.test('it returns HTTP 404 when user is not found', async () => {

    request.url = `/api/permissions/user/${user._id}/role/555555555555555555555555`;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
  });

  lab.test('it returns HTTP 200 when the user already has that role', async () => {

    user.roles.push(role._id.toString());

    await User.findByIdAndUpdate(user._id.toString(), {
      $set: {
        roles: user.roles
      }
    });

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });

});
