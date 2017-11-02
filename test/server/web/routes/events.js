'use strict';
const AuthPlugin = require('../../../../server/auth');
const AuthenticatedAccount = require('../../fixtures/credentials-user');
const Code = require('code');
const Config = require('../../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const MakeMockModel = require('../../fixtures/make-mock-model');
const Lab = require('lab');
const EventPlugin = require('../../../../server/web/routes/events');
const Manifest = require('../../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Vision = require('vision');
const Visionary = require('visionary');
const Event = require('../../../../server/models/event');

const stub = {
  Session: MakeMockModel()
};

const proxy = {};
proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;

const lab = exports.lab = Lab.script();
const ModelsPlugin = {
  register: Proxyquire('hicsail-hapi-mongo-models', proxy),
  options: Manifest.get('/registrations').filter((reg) => {

    if (reg.plugin &&
      reg.plugin.register &&
      reg.plugin.register === 'hicsail-hapi-mongo-models') {

      return true;
    }

    return false;
  })[0].plugin.options
};

const VisionaryPlugin = {
  register: Visionary,
  options: Manifest.get('/registrations').filter((reg) => {

    if (reg.plugin && reg.plugin.register && reg.plugin.register === 'visionary') {

      return true;
    }

    return false;
  })[0].plugin.options
};


let request;
let server;


lab.before((done) => {

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, ModelsPlugin, AuthPlugin, EventPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Event Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/events'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it returns error when distinct fails', (done) => {

    request.credentials = AuthenticatedAccount;

    Event.distinct = function (query, callback) {

      return callback(Error('distinct failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);
      done();
    });
  });

  lab.test('it renders properly when distinct passes', (done) => {

    request.credentials = AuthenticatedAccount;

    Event.distinct = function (query, callback) {

      return callback(null,{ name:'eventName' });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});



lab.experiment('Single Event Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/events/name/APP_OPEN'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it returns error when distinct fails', (done) => {

    request.credentials = AuthenticatedAccount;

    Event.distinct = function (query, callback) {

      return callback(Error('distinct failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);
      done();
    });
  });

  lab.test('it renders properly when distinct passes', (done) => {

    request.credentials = AuthenticatedAccount;

    Event.distinct = function (query, callback) {

      return callback(null,{ name:'eventName' });
    };

    Event.find = function (query, options, callback) {

      return callback(null,[{ time: new Date() },{ time: new Date() }]);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});



lab.experiment('User Event Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/events/user/93EP150D35'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it returns error when distinct fails', (done) => {

    request.credentials = AuthenticatedAccount;

    Event.distinct = function (query, callback) {

      return callback(Error('distinct failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);
      done();
    });
  });

  lab.test('it renders properly when distinct passes', (done) => {

    request.credentials = AuthenticatedAccount;

    Event.distinct = function (query, callback) {

      return callback(null,{ name:'eventName' });
    };

    Event.find = function (query, options, callback) {

      return callback(null,[{ time: new Date() },{ time: new Date() }]);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});

