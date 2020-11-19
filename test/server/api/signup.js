'use strict';
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Mailer = require('../../../server/mailer');
const Manifest = require('../../../manifest');
const Signup = require('../../../server/api/signup');
const User = require('../../../server/models/user');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');

const lab = exports.lab = Lab.script();
let server;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => Signup.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });
  plugins.push({
    plugin: require('../../../server/anchor/hapi-anchor-model'),
    options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options
  });
  plugins.push(HapiAuthBasic);
  plugins.push(HapiAuthCookie);
  plugins.push(HapiAuthJWT);
  plugins.push(Auth);
  plugins.push(Signup);

  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('POST /api/signup', () => {

  const Mailer_sendEmail = Mailer.sendEmail;
  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/signup'
    };
  });

  lab.afterEach(() => {

    Mailer.sendEmail = Mailer_sendEmail;
  });

  lab.test('it returns HTTP 409 when the username is already in use', async () => {

    await User.create('ren', 'baddog', 'ren@stimpy.show', 'ren');

    request.payload = {
      name: 'Unoriginal Bill',
      email: 'bill@hotmail.gov',
      username: 'ren',
      password: 'pass123'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/username already in use/i);
  });

  lab.test('it returns HTTP 409 when the email is already in use', async () => {

    request.payload = {
      name: 'Unoriginal Bill',
      email: 'ren@stimpy.show',
      username: 'bill',
      password: 'pass123'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/email already in use/i);
  });

  lab.test('it returns HTTP 409 when the password does not meet complexity standards', async () => {

    request.payload = {
      name: 'arezoo',
      email: 'asadeg02@bu.edu',
      username: 'asadeg02',
      password: 'juststringspasswrod'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Password does not meet complexity standards/i);
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    Mailer.sendEmail = () => undefined;

    request.payload = {
      name: 'Captain Original',
      email: 'captain@stimpy.show',
      username: 'captain',
      password: 'Delaram@1999'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.user).to.be.an.object();
    Code.expect(response.result.session).to.be.an.object();
    Code.expect(response.result.authHeader).to.be.a.string();
  });

  lab.test('it returns HTTP 200 when all is well and logs any mailer errors', async () => {

    Mailer.sendEmail = function () {

      throw new Error('Failed to send mail.');
    };

    const mailerLogEvent = server.events.once({
      name: 'request',
      filter: ['error', 'mailer']
    });

    request.payload = {
      name: 'Assistant Manager',
      email: 'manager@stimpy.show',
      username: 'assistant',
      password: 'Delaram@1999'
    };

    const response = await server.inject(request);
    const [, event] = await mailerLogEvent;

    Code.expect(event.error.message).to.match(/failed to send mail/i);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.user).to.be.an.object();
    Code.expect(response.result.session).to.be.an.object();
    Code.expect(response.result.authHeader).to.be.a.string();
  });
});

/*lab.experiment('POST /api/root', () => {

  const Mailer_sendEmail = Mailer.sendEmail;
  let request;

  lab.beforeEach(async () => {

    await Fixtures.Db.removeAllData();

    request = {
      method: 'POST',
      url: '/api/root'
    };
  });

  lab.afterEach(() => {

    Mailer.sendEmail = Mailer_sendEmail;
  });

  lab.test('it returns HTTP 409 when the email is already in use', async () => {

    await Fixtures.Creds.createRootUser('baddog','ren@stimpy.show');

    request.payload = {
      email: 'ren@stimpy.show',
      password: 'pass123'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    Mailer.sendEmail = () => undefined;

    request.payload = {
      email: 'captain1@stimpy.show',
      password: 'allaboard'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.user).to.be.an.object();
    Code.expect(response.result.session).to.be.an.object();
    Code.expect(response.result.authHeader).to.be.a.string();
  });

  lab.test('it returns HTTP 200 when all is well and logs any mailer errors', async () => {

    Mailer.sendEmail = function () {

      throw new Error('Failed to send mail.');
    };

    const mailerLogEvent = server.events.once({
      name: 'request',
      filter: ['error', 'mailer']
    });

    request.payload = {
      email: 'manager@stimpy.show',
      password: 'totheregionalmanager'
    };

    const response = await server.inject(request);
    const [, event] = await mailerLogEvent;

    Code.expect(event.error.message).to.match(/failed to send mail/i);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.user).to.be.an.object();
    Code.expect(response.result.session).to.be.an.object();
    Code.expect(response.result.authHeader).to.be.a.string();
  });
});*/
