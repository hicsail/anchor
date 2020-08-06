'use strict';
const Auth = require('../../../../server/auth');
const Code = require('code');
const Fixtures = require('../../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../../manifest');
const Login = require('../../../../server/web/routes/login');
const User = require('../../../../server/models/user');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const Vision = require('vision');

const lab = exports.lab = Lab.script();
let server;
let authenticatedRoot;

lab.before(async () => {

  server = Hapi.Server();
  const plugins = [];
  /*const plugins = Manifest.get('/register/plugins')
    .filter((entry) => Signup.dependencies.includes(entry.plugin))
    .map((entry) => {

      entry.plugin = require(entry.plugin);

      return entry;
    });*/

  plugins.push({ plugin: require('../../../../server/anchor/hapi-anchor-model'), options: Manifest.get('/register/plugins').filter((v) => v.plugin === './server/anchor/hapi-anchor-model.js')[0].options });
  plugins.push(HapiAuthBasic);  
  plugins.push(HapiAuthCookie);
  plugins.push(HapiAuthJWT);
  plugins.push(Auth);
  plugins.push(Vision);   
  plugins.push(Login);
  
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

lab.experiment('Login Page View', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/login'          
    };
  });  

  lab.test('login page renders properly', async () => {      

    const response = await server.inject(request);

    Code.expect(response.statusMessage).to.match(/Ok/i);
    Code.expect(response.statusCode).to.equal(200);    
  });  

  lab.test('it redirects when user is authenticated as an account', async () => {    
       
    request.credentials = authenticatedRoot;   

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(302);
  });  
});

lab.experiment('Logout Page View', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/logout'          
    };
  });  

  lab.test('it logout properly without logged in user', async () => {      

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(302);    
  });  

  lab.test('it redirects when user is authenticated as an account', async () => {    
       
    request.credentials = authenticatedRoot;   

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(302);
  }); 

  lab.test('it returns 500 server error code when session findByIdAndDelete misses', async () => {    
       
    request.credentials = User.create('ren', 'Pas1234', 'ren@stimpy.show', 'ren'); 
    request.credentials = User;  

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(500);
  });  
});

lab.experiment('Reset plugin', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/reset'          
    };
  });  

  lab.test('page loads successfully without logged in user ', async () => {      

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(200);    
  });  

  lab.test('it redirects when user is authenticated as an account', async () => {    
       
    request.credentials = authenticatedRoot;   

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(302);
  });  
});

lab.experiment('Forgot plugin', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'GET',
      url: '/forgot'          
    };
  });  

  lab.test('page loads successfully without logged in user ', async () => {      

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(200);    
  });  

  lab.test('it redirects when user is authenticated as an account', async () => {    
       
    request.credentials = authenticatedRoot;   

    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(302);
  });  
});