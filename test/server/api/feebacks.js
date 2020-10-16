'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const FeedbackApi = require('../../../server/api/feedbacks');
const Feedback = require('../../../server/models/feedback');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');

const lab = exports.lab = Lab.script();
let server;
let authenticatedRoot;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => FeedbackApi.dependencies.includes(entry.plugin))
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
  plugins.push(FeedbackApi);

  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  authenticatedRoot = await Fixtures.Creds.createRootUser('123abs','email@email.com');
  await Feedback.create('subject1', 'description1','555555555555555555555555');
  await Feedback.create('subject2', 'description2','155555555555555555555555');
  await Feedback.create('subject3', 'description3','255555555555555555555555');
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('GET /api/feedback/unresolved', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'GET',
      url: '/api/feedback/unresolved',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.match(/3/i);

  });
});

lab.experiment('PUT /api/feedback/{id}', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'PUT',
      url: '/api/feedback/{id}',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }
    };
  });

  lab.test('it returns HTTP 404 when feedback findByIdAndUpdate misees', async () => {

    request.url = '/api/feedback/555555555555555555555555';

    request.payload = {
      resolved: true,
      comment: 'new comment'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result.message).to.match(/feedback not found/i);
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const feedback = await Feedback.create('subject1', 'description1','555555555555555555555555');

    request.url = '/api/feedback/' + feedback._id.toString();

    request.payload = {
      resolved: true,
      comment: 'new comment'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Feedback);
    Code.expect(response.result.resolved).to.equal(true);
    Code.expect(response.result.comment).to.equal('new comment');
  });
});
