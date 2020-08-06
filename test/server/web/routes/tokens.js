'use strict';
const Auth = require('../../../../server/auth');
const Code = require('code');
const Fixtures = require('../../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../../manifest');
const Token = require('../../../../server/web/routes/tokens');
const TokenModel = require('../../../../server/models/token')
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
    .filter((entry) => Token.dependencies.includes(entry.plugin))
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
  plugins.push(Token);
  
  await server.register(plugins);
  server.views({
    engines: {handlebars: require('handlebars') },
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

lab.experiment('Token Page View', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/tokens'          
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

lab.experiment('Create Token Page View', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/tokens/create'          
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

lab.experiment('Edit Token Page View', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/tokens/{id}'          
    };
  });  

  lab.test('it redirects when user is not logged in', async () => {

    request.url = '/tokens/555555555555555555555555';    

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(302);    
  });  

  lab.test('it renders properly when user is authenticated and token is not found', async () => {    
     
    request.url = '/tokens/555555555555555555555555';  
    request.credentials = authenticatedRoot;   

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(200);
  });  

  lab.test('it returns server error code 500 when token findById returns an error', async () => {    
     
    request.url = '/tokens/5555555';  
    request.credentials = authenticatedRoot;   

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(500);
  }); 

  lab.test('it returns properly when user is athenticated and token findById returns successfully', async () => {    
     
    const token = await TokenModel.create({tokenName: 'name', userId: '555555555555555555555555'});
    request.url = '/tokens/' + token._id.toString();  
    request.credentials = authenticatedRoot;   

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(200);
  });   
});