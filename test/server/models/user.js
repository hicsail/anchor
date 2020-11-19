'use strict';
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');
const User = require('../../../server/models/user');

const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');

lab.experiment('User Model', () => {

  lab.before(async () => {

    await User.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });

  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    User.disconnect();
  });

  lab.test('it returns a new instance when create succeeds', async () => {

    const username =  'ren';
    const password = 'bighouseblues';
    const email =  'ren@stimpy.show';
    const name =  'Ren';

    const user = await User.create(username, password, email, name);

    Code.expect(user).to.be.an.instanceOf(User);
  });

  lab.test('it returns undefined when finding by credentials user misses', async () => {

    const user = await User.findByCredentials('steve', '123456');

    Code.expect(user).to.be.undefined();
  });

  lab.test('it returns undefined when finding by credentials user hits and password match misses', async () => {

    const user = await User.findByCredentials('ren', '123456');

    Code.expect(user).to.be.undefined();
  });

  lab.test('it returns an instance when finding by credentials user hits and password match hits', async () => {

    const withUsername = await User.findByCredentials('ren', 'bighouseblues');

    Code.expect(withUsername).to.be.an.instanceOf(User);

    const withEmail = await User.findByCredentials('ren@stimpy.show', 'bighouseblues');

    Code.expect(withEmail).to.be.an.instanceOf(User);
  });

  lab.test('it returns an instance when finding by email', async () => {

    const user = await User.findByEmail('ren@stimpy.show');

    Code.expect(user).to.be.an.instanceOf(User);
  });

  lab.test('it returns an instance when finding by username', async () => {

    const user = await User.findByUsername('ren');

    Code.expect(user).to.be.an.instanceOf(User);
  });

  lab.test('it creates a password hash combination', async () => {

    const password = '3l1t3f00&&b4r';
    const result = await User.generatePasswordHash(password);

    Code.expect(result).to.be.an.object();
    Code.expect(result.password).to.equal(password);
    Code.expect(result.hash).to.be.a.string();
  });

});
