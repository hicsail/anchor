'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Session = require('../../../server/models/session');
const User = require('../../../server/models/user');
const Token = require('../../../server/models/token');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');

const lab = exports.lab = Lab.script();
let server;
let user;
let session;
let authenticatedRoot;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => AnchorApi.dependencies.includes(entry.plugin))
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

  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  authenticatedRoot = await Fixtures.Creds.createRootUser('123abs','email@email.com');
  user = await User.create('ren', 'baddog', 'ren@stimpy.show', 'ren');
  session = await Session.create(user._id.toString(), 'test', 'test');
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('GET /api/{collectionName}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/users',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id.toString(), authenticatedRoot.session.key)
      }
    };

    User.routes.getAll.disabled = false;
    User.routes.getAll.auth = true;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    User.routes.getAll.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;
    delete request.credentials;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 400 when query is not valid', async () => {

    request.url += '?extra=test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    User.routes.getAll.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });
});

lab.experiment('POST /api/{collectionName}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/tokens',
      payload: {
        tokenName: 'test token',
        active: false
      },
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };

    Token.routes.create.disabled = false;
    Token.routes.create.auth = true;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    Token.routes.create.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 400 when payload is incorrect', async () => {

    request.payload.extra = 'canIAddThis';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;
    delete request.credentials;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    Token.routes.create.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  /*lab.test('it returns HTTP 200 when auth is not required and not provided', async () => {

    Token.routes.create.auth = false;
    request.payload.userId = user._id.toString();
    delete request.headers;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });*/
});

lab.experiment('GET /api/{collectionName}/{id}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/users/' + user._id.toString(),
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };

    User.routes.getId.disabled = false;
    User.routes.getId.auth = true;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/id';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    User.routes.getId.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;
    delete request.credentials;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notFoundModel/' + '000000000000000000000000';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    User.routes.getId.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });
});

lab.experiment('GET /api/{collectionName}/my', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/users/my',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };

    User.routes.getMy.disabled = false;
    User.routes.getMy.auth = true;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/my';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    User.routes.getMy.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;
    delete request.credentials;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 400 when query is not valid', async () => {

    request.url += '?extra=test';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    User.routes.getMy.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });
});

/*lab.experiment('PUT /api/{collectionName}/{id}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'PUT',
      url: '/api/users/' + user._id.toString(),
      payload: {
        username: 'ren',
        password: 'baddog',
        name: 'ren',
        email: 'ren@email.com'
      },
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };

    User.routes.update.disabled = false;
    User.routes.update.auth = true;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/id';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    User.routes.update.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 400 when payload is incorrect', async () => {

    request.payload.extra = 'canIAddThis';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/users/' + '000000000000000000000000';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    User.routes.update.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });
});*/

lab.experiment('GET /api/{collectionName}/routes', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/users/routes',
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.string();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/routes';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });
});

lab.experiment('GET /api/{collectionName}/schema', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/users/schema',
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.string();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/schema';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });
});

lab.experiment('GET /api/{collectionName}/{id}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/users/' + user._id.toString(),
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };

    User.routes.getId.disabled = false;
    User.routes.getId.auth = true;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/id';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    User.routes.getId.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;
    delete request.credentials;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    User.routes.getId.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });
});

/*lab.experiment('POST /api/{collectionName}/insertMany', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/users/insertMany',
      payload: [{
        username: 'ren',
        password: 'baddog',
        name: 'ren',
        email: 'ren@email.com'
      }],
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };

    User.routes.insertMany.disabled = false;
    User.routes.insertMany.auth = true;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.array();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/insertMany';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    User.routes.insertMany.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 400 when payload is incorrect', async () => {

    request.payload[0].extra = 'canIAddThis';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    User.routes.insertMany.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.array();
  });

  lab.test('it returns HTTP 200 when auth is not required and not provided', async () => {

    User.routes.insertMany.auth = false;
    delete request.headers;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.array();
  });
});*/

lab.experiment('DELETE /api/{collectionName}/{id}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'DELETE',
      url: '/api/users/' + user._id.toString(),
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };

    User.routes.delete.disabled = false;
    User.routes.delete.auth = true;
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notReal/my';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 403 when route is disabled', async () => {

    User.routes.delete.disabled = true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(403);
    Code.expect(response.result).to.be.an.object();

  });

  lab.test('it returns HTTP 401 when auth is not provided and required', async () => {

    delete request.headers;
    delete request.credentials;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(401);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when auth is not required', async () => {

    const newUser = await User.create('ren', 'baddog', 'ren@stimpy.show', 'ren');
    request.url = '/api/users/' + newUser._id.toString();
    User.routes.delete.auth = false;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 404 when model is not found', async () => {

    request.url = '/api/notFoundModel/' + '000000000000000000000000';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result).to.be.an.object();
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const newUser = await User.create('ren', 'baddog', 'ren@stimpy.show', 'ren');
    request.url = '/api/users/' + newUser._id.toString();

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
  });
});

