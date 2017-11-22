'use strict';
const AuthPlugin = require('../../../server/auth');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const HapiAuthJWT = require('hapi-auth-jwt2');
const Lab = require('lab');
const MailerPlugin = require('../../../server/mailer');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const SignupPlugin = require('../../../server/api/signup');


const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    Session: MakeMockModel(),
    User: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;
  proxy[Path.join(process.cwd(), './server/models/user')] = stub.User;

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

  const plugins = [HapiAuthBasic, HapiAuthCookie, HapiAuthJWT, AuthPlugin, ModelsPlugin, MailerPlugin, SignupPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.after((done) => {

  server.plugins['hicsail-hapi-mongo-models'].MongoModels.disconnect();

  done();
});

lab.experiment('Signup Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/signup',
      payload: {
        name: 'Muddy Mudskipper',
        username: 'muddy',
        password: 'dirtandWater1',
        email: 'mrmud@mudmail.mud'
      }
    };

    done();
  });

  lab.test('it returns an error when find one fails for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(null, {});
      }
      else {
        callback(Error('find one failed'));
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when find one fails for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(null, {});
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });

  lab.test('it returns a conflict when password do not meet requirements', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback(null, null);
    };

    request.payload.password = 'notagoodpassword';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error if any critical setup step fails', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(Error('create failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it finishes successfully (even if sending welcome email fails)', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(null, { _id: 'BL4M0' });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, [{}, {}]);
    };

    const realSendEmail = server.plugins.mailer.sendEmail;
    server.plugins.mailer.sendEmail = function (options, template, context, callback) {

      callback(new Error('Whoops.'));
    };

    stub.Session.create = function (username, ip, userAgent, callback) {

      callback(null, {});
    };

    const realWarn = console.warn;
    console.warn = function () {

      console.warn = realWarn;

      done();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      server.plugins.mailer.sendEmail = realSendEmail;
    });
  });


  lab.test('it finishes successfully', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(null, { _id: 'BL4M0' });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, [{}, {}]);
    };

    const realSendEmail = server.plugins.mailer.sendEmail;
    server.plugins.mailer.sendEmail = function (options, template, context, callback) {

      callback(null, {});
    };

    stub.Session.create = function (username, ip, userAgent, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      server.plugins.mailer.sendEmail = realSendEmail;

      done();
    });
  });


  lab.test('it finishes successfully with an x-forwarded-for header', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(null, { _id: 'BL4M0' });
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, [{}, {}]);
    };

    const realSendEmail = server.plugins.mailer.sendEmail;
    server.plugins.mailer.sendEmail = function (options, template, context, callback) {

      callback(null, {});
    };

    stub.Session.create = function (username, ip, userAgent, callback) {

      callback(null, {});
    };

    request.headers = {
      'x-forwarded-for': '127.0.0.1'
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      server.plugins.mailer.sendEmail = realSendEmail;

      done();
    });
  });
});

lab.experiment('Available Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/available',
      payload: {}
    };

    done();
  });

  lab.test('it returns an error when input is not valid', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an error when username is taken', (done) => {

    request.payload.username = 'testUsername';

    stub.User.findOne = function (conditions, callback) {

      callback(null,{});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.username).to.equal(false);

      done();
    });
  });

  lab.test('it returns an error when email is taken', (done) => {

    request.payload.email = 'testEmail@email.email';

    stub.User.findOne = function (conditions, callback) {

      callback(null,{});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.email).to.equal(false);

      done();
    });
  });

  lab.test('it returns an error when find fails', (done) => {

    request.payload.email = 'testEmail@email.email';

    stub.User.findOne = function (conditions, callback) {

      callback(Error('test error'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns an successfully', (done) => {

    request.payload.email = 'testEmail@email.email';
    request.payload.username = 'username';

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.email).to.equal(true);
      Code.expect(response.result.username).to.equal(true);

      done();
    });
  });


});
