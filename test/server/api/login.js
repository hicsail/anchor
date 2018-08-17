'use strict';
const Auth = require('../../../server/auth');
const AuthAttempt = require('../../../server/models/auth-attempt');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Login = require('../../../server/api/login');
const Mailer = require('../../../server/mailer');
const Manifest = require('../../../manifest');
const User = require('../../../server/models/user');
const Session = require('../../../server/models/session');

const lab = exports.lab = Lab.script();
let server;


lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => Login.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });

  plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(Auth);
  plugins.push(Login);

  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  await User.create({ username: 'ren', password: 'baddog', email: 'ren@stimpy.show', name: 'ren' });
});


lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});


lab.experiment('POST /api/login', () => {

  const AuthAttempt_abuseDetected = AuthAttempt.abuseDetected;
  const User_findByCredentials = User.findByCredentials;
  let request;


  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/login',
      payload: {
        username: 'ren',
        password: 'baddog'
      }
    };
  });


  lab.afterEach(() => {

    AuthAttempt.abuseDetected = AuthAttempt_abuseDetected;
    User.findByCredentials = User_findByCredentials;
  });


  lab.test('it returns HTTP 400 when login abuse is detected', async () => {

    AuthAttempt.abuseDetected = () => true;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result.message)
      .to.match(/maximum number of auth attempts reached/i);
  });


  lab.test('it returns HTTP 400 when a user is not found', async () => {

    User.findByCredentials = () => undefined;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result.message)
      .to.match(/credentials are invalid or account is inactive/i);
  });


  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.user).to.be.an.object();
    Code.expect(response.result.session).to.be.an.object();
    Code.expect(response.result.authHeader).to.be.a.string();
  });
});


lab.experiment('POST /api/login/forgot', () => {

  const Mailer_sendEmail = Mailer.sendEmail;
  const User_findOne = User.findOne;
  let request;


  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/login/forgot',
      payload: {
        email: 'ren@stimpy.show'
      }
    };
  });


  lab.afterEach(() => {

    Mailer.sendEmail = Mailer_sendEmail;
    User.findOne = User_findOne;
  });


  lab.test('it returns HTTP 200 when the user query misses', async () => {

    User.findOne = () => undefined;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result.message).to.match(/success/i);
  });


  lab.test('it returns HTTP 200 when all is well', async () => {

    Mailer.sendEmail = () => undefined;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result.message).to.match(/success/i);
  });
});


lab.experiment('POST /api/login/reset', () => {

  const User_findOne = User.findOne;
  const Mailer_sendEmail = Mailer.sendEmail;
  let request;
  let key;


  lab.before(async () => {

    Mailer.sendEmail = (_, __, context) => {

      key = context.key;
    };

    await server.inject({
      method: 'POST',
      url: '/api/login/forgot',
      payload: {
        email: 'ren@stimpy.show'
      }
    });
  });


  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/login/reset',
      payload: {
        email: 'ren@stimpy.show',
        key,
        password: 'badcat'
      }
    };
  });


  lab.afterEach(() => {

    Mailer.sendEmail = Mailer_sendEmail;
    User.findOne = User_findOne;
  });


  lab.test('it returns HTTP 400 when the user query misses', async () => {

    User.findOne = () => undefined;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result.message).to.match(/invalid email or key/i);
  });


  lab.test('it returns HTTP 400 when the key match misses', async () => {

    request.payload.key += 'poison';

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(400);
    Code.expect(response.result.message).to.match(/invalid email or key/i);
  });


  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result.message).to.match(/success/i);
  });
});


lab.experiment('DELETE /api/logout', () => {

  let request;


  lab.beforeEach(() => {

    request = {
      method: 'DELETE',
      url: '/api/logout'
    };
  });


  lab.test('it returns HTTP 200 when credentials are missing', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result.message).to.match(/success/i);
  });


  lab.test('it returns HTTP 200 when credentials are present', async () => {

    const user = await User.create({ username: 'ren', password:'baddog', email:'ren@stimpy.show', name: 'ren' });
    const session = await Session.create({ userId: 'ren', ip: 'baddog', userAgent:'ren@stimpy.show' });

    request.credentials = {
      roles: [],
      session,
      user
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result.message).to.match(/success/i);
  });
});
