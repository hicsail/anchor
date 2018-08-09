'use strict';
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const BackupApi = require('../../../server/api/backup');
//const Backup = require('../../../server/models/backup');
const User = require('../../../server/models/user');
const Session = require('../../../server/models/session');

const lab = exports.lab = Lab.script();
let server;
let user;
let session;


lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => BackupApi.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });

  plugins.push({ plugin: require('../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(Auth);
  plugins.push(BackupApi);

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


lab.experiment('POST /api/backup', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/backup',
      headers: {
        authorization: Fixtures.Creds.authHeader(session._id, session.key)
      }
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.filename).to.be.a.string();
    Code.expect(response.result.local).to.be.a.boolean();
    Code.expect(response.result.createdAt).to.be.a.date();
    Code.expect(response.result._id).to.be.a.object();
  });
});


lab.experiment('POST /api/backup/internal', () => {

  let request;

  lab.beforeEach(() => {

    request = {
      method: 'POST',
      url: '/api/backup/internal',
      allowInternals: true
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.filename).to.be.a.string();
    Code.expect(response.result.local).to.be.a.boolean();
    Code.expect(response.result.createdAt).to.be.a.date();
    Code.expect(response.result._id).to.be.a.object();
  });
});
