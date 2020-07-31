'use strict';
const AnchorApi = require('../../../server/anchor/anchor-api');
const Auth = require('../../../server/auth');
const Code = require('code');
const Fixtures = require('../fixtures');
const Hapi = require('hapi');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Mailer = require('../../../server/mailer');
const User = require('../../../server/models/user');
const UserApi = require('../../../server/api/users');
const Session = require('../../../server/models/session');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');

const lab = exports.lab = Lab.script();
let server;
let user;
let invite;
let authenticatedRoot;
let authenticatedAdmin;

lab.before(async () => {

  server = Hapi.Server();

  const plugins = Manifest.get('/register/plugins')
    .filter((entry) => UserApi.dependencies.includes(entry.plugin))
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
  plugins.push(UserApi);
  
  await server.register(plugins);
  await server.start();
  await Fixtures.Db.removeAllData();

  user = await User.create('ren', 'Pas1234', 'ren@stimpy.show', 'ren');
  authenticatedRoot = await Fixtures.Creds.createRootUser('123abs','email@email.com'); 
  authenticatedAdmin = await Fixtures.Creds.createUser('asadeg02','asade02@test.com','Pas123','test', ['admin']); 
    
});

lab.after(async () => {

  await Fixtures.Db.removeAllData();
  await server.stop();
});

lab.experiment('POST /api/users', () => {

  let request;

  lab.beforeEach(async () => {    

    request = {
      method: 'POST',
      url: '/api/users',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  });  

  lab.test('it returns HTTP 409 when the username is already in use', async () => {    

    request.payload = {
      name: 'Unoriginal Bill',
      email: 'bill@hotmail.gov',
      username: 'ren',
      password: 'Pass123'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Username already in use/i);    
  });

  lab.test('it returns HTTP 409 when email is already in use', async () => {    

    request.payload = {
      name: 'user',
      email: 'ren@stimpy.show',
      username: 'newren',
      password: 'Pass123'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Email already in use/i);    
  });

  lab.test('it returns HTTP 409 when password does not meet password complexity standadrds' , async () => {    

    request.payload = {
      name: 'user1',
      email: 'user1@stimpy.show',
      username: 'user1',
      password: 'allstrings'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Password does not meet complexity standards/i);    
  });


  lab.test('it returns HTTP 200 when all is well', async () => {

    request.payload = {
      name: 'user2',
      email: 'user2@stimpy.show',
      username: 'user2',
      password: 'Dlearam@1999'
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(User);

  });  
});

lab.experiment('PUT /api/users/{id}', async () => {

  let request;

  lab.beforeEach(async () => {    
    
    request = {
      method: 'PUT',
      url: '/api/users/{id}',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  }); 

  lab.test('it returns HTTP 409 when the username is already in use', async () => { 

    request.url = '/api/users/555555555555555555555555';    

    request.payload = {
      name: 'Arezoo',
      email: 'test@test.com',
      username: 'ren'      
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Username already in use/i);    
  });

  lab.test('it returns HTTP 409 when email is already in use', async () => {

    request.url = '/api/users/555555555555555555555555';       

    request.payload = {
      name: 'Arezoo',
      email: 'ren@stimpy.show',
      username: 'Arezoo'      
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Email already in use/i);    
  });

  lab.test('it returns HTTP 404 when `User.findByIdAndUpdate` misses' , async () => { 

    request.url = '/api/users/555555555555555555555555'

    request.payload = {
      name: 'sepideh',
      email: 'sepideh@stimpy.show',
      username: 'sepideh'      
    };     

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result.message).to.match(/not found/i);    
  });


  lab.test('it returns HTTP 200 when all is well', async () => {

    const userToBeUpdated = await User.create('asadeg02', 'Pas1234', 'asadeg02@stimpy.show', 'userTobeUpdated'); 
    request.url = '/api/users/'+ userToBeUpdated._id.toString();

    request.payload = {
      name: 'sepideh',
      email: 'sepideh@stimpy.show',
      username: 'sepideh'      
    };
    
    const response = await server.inject(request);
    
    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.instanceOf(User);
    Code.expect(response.result.name).to.equal('sepideh');
    Code.expect(response.result.username).to.equal('sepideh');
    Code.expect(response.result.email).to.equal('sepideh@stimpy.show');

  });  
});

lab.experiment('PUT /api/users/{id}/password', async () => {

  let request;

  lab.beforeEach(async () => {    
    
    request = {
      method: 'PUT',
      url: '/api/users/{id}/password',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  }); 

  lab.test('it returns HTTP 409 when password does not meet complexity standard', async () => { 

    request.url = '/api/users/555555555555555555555555/password';    

    request.payload = {
      password: 'allstrings'      
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Password does not meet complexity standards/);    
  });

  lab.test('it returns HTTP 404 when `User.findByIdAndUpdate` misses', async () => {

        request.url = '/api/users/555555555555555555555555/password'; 

        request.payload = {
            password: 'Delaram@1999'
        };

        const response = await server.inject(request);

        Code.expect(response.statusCode).to.equal(404);
        Code.expect(response.result.message).to.match(/User not found/i);
  });

  lab.test('it returns HTTP 200 when all is well', async () => {        

        request.url = '/api/users/' + authenticatedAdmin.user._id.toString() + '/password'; 

        request.payload = {
            password: 'Delaram@1999'
        };      
        
        const response = await server.inject(request);

        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.result).to.be.an.object();
        Code.expect(response.result.username).to.equal(authenticatedAdmin.user.username);
  });
});

lab.experiment('PUT /api/users/my/password', async () => {

  let request;

  lab.beforeEach(async () => {    
    
    request = {
      method: 'PUT',
      url: '/api/users/my/password',
      credentials: authenticatedAdmin,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedAdmin.session._id, authenticatedAdmin.session.key)
      }     
    };
  }); 

  lab.test('it returns HTTP 409 when password does not meet complexity standard', async () => {       

    request.payload = {
      password: 'allstrings'      
    };

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(409);
    Code.expect(response.result.message).to.match(/Password does not meet complexity standards/);    
  });
  
  lab.test('it returns HTTP 200 when all is well', async () => {        

        request.payload = {
            password: 'Selaram@1999'
        };      
        
        const response = await server.inject(request);

        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.result).to.be.an.object();
        Code.expect(response.result.username).to.equal(authenticatedAdmin.user.username);
  });  
});

lab.experiment('DELETE /api/users/{id}', async () => {

  let request;

  lab.beforeEach(async () => {    
    
    request = {
      method: 'DELETE',
      url: '/api/users/{id}',
      credentials: authenticatedRoot,
      headers: {
        authorization: Fixtures.Creds.authHeader(authenticatedRoot.session._id, authenticatedRoot.session.key)
      }     
    };
  }); 

  lab.test('it returns HTTP 404 when `User.findByIdAndDelete` misses', async () => {
   
    request.url = '/api/users/555555555555555555555555';        

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(404);
    Code.expect(response.result.message).to.match(/not found/i);
  });

  lab.test('it returns HTTP 200 when all is well', async () => {

    request.url = '/api/users/' + authenticatedAdmin.user._id.toString();

    const response = await server.inject(request);

    Code.expect(response.statusCode).to.equal(200);
    Code.expect(response.result).to.be.an.object();
    Code.expect(response.result.message).to.match(/success/i);      
  });  
});