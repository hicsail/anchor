'use strict';
const Auth = require('../../../../server/auth');
const Code = require('code');
const Fixtures = require('../../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../../manifest');
const Feedback = require('../../../../server/web/routes/feedbacks');
const FeedbackModel = require('../../../../server/models/feedback');
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
    .filter((entry) => Feedback.dependencies.includes(entry.plugin))
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
  plugins.push(Feedback);

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

lab.experiment('Feedback Page View', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/feedback'
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

lab.experiment('Edit Feedback Page View', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/feedback/{id}'
    };
  });

  lab.test('it redirects when user is not logged in', async () => {

    request.url = '/feedback/555555555555555555555555';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(302);
  });

  lab.test('it returns 404 when feedback is not found', async () => {

    request.url = '/feedback/555555555555555555555555';
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result.message).to.match(/Feedback not found/i);
  });

  lab.test('it returns server error code 500 when feedback findById returns an error', async () => {

    //feedback id is not valid so feedback finfById returns an error
    request.url = '/feedback/5555555';
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(500);
  });

  lab.test('it returns properly when user is athenticated and token findById returns successfully', async () => {

    const feedback = await FeedbackModel.create('test subject', 'test description', authenticatedRoot.user._id.toString());

    request.url = '/feedback/' + feedback._id.toString();
    request.credentials = authenticatedRoot;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
  });
});
