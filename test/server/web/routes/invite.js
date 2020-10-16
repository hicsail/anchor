'use strict';
const Auth = require('../../../../server/auth');
const Code = require('code');
const Fixtures = require('../../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../../manifest');
const Invite = require('../../../../server/web/routes/invite');
const InviteModel = require('../../../../server/models/invite');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const Vision = require('vision');

const lab = exports.lab = Lab.script();
let server;
let authenticatedRoot;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => Invite.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });

  plugins.push({ plugin: require('../../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(HapiAuthBasic);
  plugins.push(HapiAuthCookie);
  plugins.push(HapiAuthJWT);
  plugins.push(Auth);
  plugins.push(Vision);
  plugins.push(Invite);

  await server.register(plugins);
  server.views({
    engines: { handlebars: require('handlebars') },
    relativeTo: __dirname,
    path: '../../../../server/web/templates',
    layout: 'layout',
    layoutPath: '../../../../server/web/layouts',
    partialsPath: '../../../../server/web/partials',
    helpersPath: '../../../../server/web/helpers'
  });
  await server.start();
  await Fixtures.Db.removeAllData();

  authenticatedRoot = await Fixtures.Creds.createRootUser('123abs','email@email.com');
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('Invite Page View', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/invite'
    };
  });

  lab.test('it redirects when user is not logged in', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(302);
  });

  lab.test('it renders properly when user is authenticated', async () => {

    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });
});

lab.experiment('Invite Create Page View', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/invite/create'
    };
  });

  lab.test('it redirects when user is not logged in', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(302);
  });

  lab.test('it renders properly when user is authenticated', async () => {

    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });
});

lab.experiment('Invite Edit Page View', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/invite/edit/{id}'
    };
  });

  lab.test('it redirects when user is not logged in', async () => {

    request.url = '/invite/edit/555555555555555555555555';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(302);
  });

  lab.test('it renders properly when user is authenticated', async () => {

    request.url = '/invite/edit/555555555555555555555555';
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns server error code 500 when invite findById returns an error', async () => {

    request.url = '/invite/edit/5555555';
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(500);
  });

  lab.test('it returns properly when user is athenticated and invite findById returns successfully', async () => {

    const invite = await InviteModel.create('testName','testEmail', 'testDescription', authenticatedRoot.user._id.toString());
    request.url = '/invite/edit/' + invite._id.toString();
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });
});

lab.experiment('Invite View Page', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/invite/{id}'
    };
  });

  lab.test('it redirects when user is not logged in', async () => {

    request.url = '/invite/555555555555555555555555';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(302);
  });

  lab.test('it renders properly when user is authenticated', async () => {

    request.url = '/invite/555555555555555555555555';
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns server error code 500 when invite findById returns an error', async () => {

    request.url = '/invite/5555555';
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(500);
  });

  lab.test('it returns properly when user is athenticated and invite findById returns successfully', async () => {

    const invite = await InviteModel.create('testName','testEmail', 'testDescription', authenticatedRoot.user._id.toString());
    request.url = '/invite/' + invite._id.toString();
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });
});
