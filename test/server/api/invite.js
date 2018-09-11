'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Mailer = require('../../../server/mailer');
const Invite = require('../../../server/models/invite');
const InviteApi = require('../../../server/api/invite');
const Permission = require('../../../server/api/permissions');
const User = require('../../../server/models/user');
const Session = require('../../../server/models/session');

const lab = exports.lab = Lab.script();
let server;
let user;
let session;
let invite;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => InviteApi.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });

  plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(Auth);
  plugins.push(AnchorApi);
  plugins.push(Permission);
  plugins.push(InviteApi);

  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  user = await User.create({ username: 'ren', password: 'baddog', email: 'ren@stimpy.show', name: 'ren' });
  invite = await Invite.create({ username: 'renren', email: 'mytest@test.com', name: 'renny', userId: user._id });
  session = await Session.create({ userId: user._id.toString(), ip: '127.0.0.1', userAgent: 'Lab' });
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('POST /api/invites', () => {

  const Mailer_sendEmail = Mailer.sendEmail;
  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/invites',
      payload: {
        username: 'newUsername',
        email: 'newSailor@bu.edu',
        name: 'Ahoy Sailor'
      },
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.afterEach(() => {

    Mailer.sendEmail = Mailer_sendEmail;
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    Mailer.sendEmail = () => undefined;

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Invite);
  });

  lab.test('it returns HTTP 200 when all is well and logs any mailer errors', async () => {

    Mailer.sendEmail = function () {

      throw new Error('Failed to send mail.');
    };

    const mailerLogEvent = server.events.once({
      name: 'request',
      filter: ['error', 'mailer']
    });

    const response = await server.inject(request);
    const [, event] = await mailerLogEvent;

    Code.expect(event.error.message).to.match(/failed to send mail/i);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Invite);
  });
});

lab.experiment('POST /api/invites/{id}',  () => {

  let request;
  const Mailer_sendEmail = Mailer.sendEmail;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/invites/' + invite._id,
      payload: {
        username: 'ren2',
        password: 'Baddog222!',
        email: 'ren2@stimpy.show',
        name: 'ren2'
      },
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.afterEach(() => {

    Mailer.sendEmail = Mailer_sendEmail;
  });

  lab.test('it returns HTTP 200 when everything goes well', async () => {

    Mailer.sendEmail = () => undefined;
    console.log(request);
    const response = await server.inject(request);
    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns HTTP 200 when everything goes well and logs any mailer errors', async () => {

    Mailer.sendEmail = () => {

      throw new Error('Failed to send mail.');
    };

    const response = await server.inject(request);
    Code.expect(response.statusCode).to.equal(200);
  });

  lab.test('it returns HTTP 500 when the invite id is incorrect', async () => {

    request.url = '/api/invites/000001';
    console.log(request);
    const response = await server.inject(request);
    Code.expect(response.statusCode).to.equal(500);
  });

});
