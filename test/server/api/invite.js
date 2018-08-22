'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Invite = require('../../../server/models/invite');
const InviteApi = require('../../../server/api/invite');
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
  session = await Session.create({ userId: user._id.toString(), ip: '127.0.0.1', userAgent: 'Lab' });
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('POST /api/invites', () => {

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

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Invite);
  });
});
