'use strict';
const Auth = require('../../server/auth');
const Code = require('code');
const Hapi = require('hapi');
const Fixtures = require('./fixtures');
const Lab = require('lab');
const Config = ('../../../config');
const lab = exports.lab = Lab.script();
const User = require('../../server/models/user');
const Session = require('../../server/models/session');
let server; 

lab.experiment('Auth', () => {

  lab.before(async () => {

    server = Hapi.Server();

    await Auth.connect(config.connection,config.options);
    await Fixtures.Db.removeAllData();
  });

  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Auth.disconnect();
  });

  lab.test();



});
