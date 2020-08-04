'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const BackupApi = require('../../../server/api/backups');
const Backup = require('../../../server/models/backup');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');

const lab = exports.lab = Lab.script();
let server;
let authenticatedRoot;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => BackupApi.dependencies.includes(entry.plugin))
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
  plugins.push(BackupApi);
  
  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  authenticatedRoot = await Fixtures.Creds.createRootUser('123abs','email@email.com');   
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('POST /api/backups', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'POST',
      url: '/api/backups',      
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  });   

  lab.test('it returns HTTP 200 when all is well', async () => {     
    
    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.backupId).to.be.a.string();
    Code.expect(response.result.zip).to.be.a.boolean();
    Code.expect(response.result.s3).to.be.a.boolean();
    Code.expect(response.result.time).to.be.a.date();
    Code.expect(response.result._id).to.be.a.object();

  });  
});

lab.experiment('POST /api/backups/internal', () => {

  let request;

  lab.beforeEach(async () => {

    request = {
      method: 'POST',
      url: '/api/backups/internal',
      allowInternals: true
    };
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.backupId).to.be.a.string();
    Code.expect(response.result.zip).to.be.a.boolean();
    Code.expect(response.result.s3).to.be.a.boolean();
    Code.expect(response.result.time).to.be.a.date();
    Code.expect(response.result._id).to.be.a.object();
  });
});

lab.experiment('DELETE /api/backups/{id}', () => {

  let request;

  lab.beforeEach(async () => {

    request = {
      method: 'DELETE',
      url: '/api/backups/{id}',
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }         
    };
  });

  lab.test('it returns HTTP 404 when backup findByIdAndDelete misses', async () => {    
    console.log("here")
    request.url = '/api/backups/555555555555555555555555';
    
    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result.message).to.match(/backup not found/i);    
  });

  lab.test('it returns HTTP 200 when all is well', async () => {
 
    const backup = await Backup.create('New Backup', true, false);

    request.url = '/api/backups/' + backup._id.toString();
    
    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result.message).to.match(/Success/i);    
  });
});
