'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const EventApi = require('../../../server/api/events');
const Event = require('../../../server/models/event');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');

const lab = exports.lab = Lab.script();
let server;
let authenticatedRoot;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => EventApi.dependencies.includes(entry.plugin))
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
  plugins.push(EventApi);
  
  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  authenticatedRoot = await Fixtures.Creds.createRootUser('123abs','email@email.com');   
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('POST /api/events/{name}', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'POST',
      url: '/api/events/{name}',      
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  }); 

  lab.afterEach(async () => {

    await Event.deleteMany({});
  });  

  lab.test('it returns HTTP 200 when all is well', async () => {     

    request.url = '/api/events/testEvent';   
    
    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(Event); 
    Code.expect(response.result.name).to.equal('testEvent'.toUpperCase());    
  });  
});

lab.experiment('GET /api/events/name/{name}', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/api/events/name/{name}',      
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  });

  lab.afterEach(async () => {

    await Event.deleteMany({});
  });  

  lab.test('it returns HTTP 200 when all is well', async () => {     

    const event = await Event.create('test event', authenticatedRoot.user._id.toString());
    
    request.url = '/api/events/name/' + event.name;   
    
    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(200);  
    Code.expect(response.result.length).to.equal(1);  
    Code.expect(response.result[0]).to.be.an.instanceOf(Event); 
    Code.expect(response.result[0].name).to.equal(event.name);    
  });  
});

lab.experiment('GET /api/events/user/{userId}', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/api/events/user/{userId}',      
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  });

  lab.afterEach(async () => {

    await Event.deleteMany({});
  });  

  lab.test('it returns HTTP 200 when all is well', async () => {     

    const event = await Event.create('test event', authenticatedRoot.user._id.toString());
    
    request.url = '/api/events/user/' + authenticatedRoot.user._id.toString();   
    
    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(200);  
    Code.expect(response.result.length).to.equal(1);  
    Code.expect(response.result[0]).to.be.an.instanceOf(Event); 
    Code.expect(response.result[0].userId).to.equal(authenticatedRoot.user._id.toString());    
  });  
});