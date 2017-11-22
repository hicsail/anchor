'use strict';
const AuthPlugin = require('../../../../server/auth');
const AuthenticatedAccount = require('../../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const MakeMockModel = require('../../fixtures/make-mock-model');
const Lab = require('lab');
const InvitePlugin = require('../../../../server/web/routes/invite');
const Invite = require('../../../../server/models/invite');
const Manifest = require('../../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Vision = require('vision');
const Visionary = require('visionary');

const stub = {
  Invite: MakeMockModel()
};

const proxy = {};
proxy[Path.join(process.cwd(), './server/models/invite')] = stub.Invite;

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

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, ModelsPlugin, AuthPlugin, InvitePlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Invite Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/invite'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it renders properly when user is authenticated', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});


lab.experiment('Invite Create Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/invite/create'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it renders properly when user is authenticated', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});


lab.experiment('Invite Edit Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/invite/edit/someID'
    };

    done();
  });


  lab.test('it redirects when user is not logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it renders properly when user is authenticated', (done) => {

    Invite.findById = function (id, callback) {

      callback(null, {});
    };

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });


  lab.test('it returns an error if find by id fails', (done) => {

    Invite.findById = function (id, callback) {

      callback(Error('failed'));
    };

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);
      done();
    });
  });
});



lab.experiment('Invite View Page', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/invite/someID'
    };

    done();
  });


  lab.test('it does not redirects when user is not logged in', (done) => {

    Invite.findById = function (id, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it renders if invite is valid', (done) => {

    Invite.findById = function (id, callback) {

      callback(null, { status:'Pending',expiredAt:new Date(9999999999999) });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it renders if invite is not valid', (done) => {

    Invite.findById = function (id, callback) {

      callback(null, { status:'Pending',expiredAt:new Date(0) });
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it renders even if invite is not found', (done) => {

    Invite.findById = function (id, callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it returns an error if findById fails', (done) => {

    Invite.findById = function (id, callback) {

      callback(Error('failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it redirects you if user is logged in', (done) => {

    Invite.findById = function (id, callback) {

      callback(null, {});
    };

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);
      done();
    });
  });


  lab.test('it returns redirects you if find by id fails', (done) => {

    Invite.findById = function (id, callback) {

      callback(Error('failed'));
    };

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);
      done();
    });
  });
});
