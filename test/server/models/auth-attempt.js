'use strict';
const AuthAttempt = require('../../../server/models/auth-attempt');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');

lab.experiment('AuthAttempt Model', () => {

  lab.before(async () => {

    await AuthAttempt.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });

  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    AuthAttempt.disconnect();
  });

  lab.test('it detects login abuse from an ip and many users', async () => {

    const attemptConfig = Config.get('/authAttempts');
    const authRequest = (i) =>

      AuthAttempt.create({
        ip: '127.0.0.2',
        username: `mudskipper${i}`,
        userAgent: [
          'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us)',
          ' AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405'
        ].join('')
      });
    const authSpam = Array(attemptConfig.forIp).fill().map((_, i) => authRequest(i));

    await Promise.all(authSpam);

    const result = await AuthAttempt.abuseDetected('127.0.0.2', 'yak');

    Code.expect(result).to.equal(true);
  });

  lab.test('it detects login abuse from an ip and one user', async () => {

    const attemptConfig = Config.get('/authAttempts');
    const authRequest = () =>

      AuthAttempt.create({
        ip: '127.0.0.3',
        username: 'steve',
        userAgent: [
          'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us)',
          ' AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405'
        ].join('')
      });
    const authSpam = Array(attemptConfig.forIpAndUser).fill().map((_) => authRequest());

    await Promise.all(authSpam);

    const result = await AuthAttempt.abuseDetected('127.0.0.3', 'steve');

    Code.expect(result).to.equal(true);
  });

  lab.test('it returns a new instance when create succeeds', async () => {

    const document = {
      ip: '127.0.0.4',
      username: 'apollo',
      userAgent: [
        'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us)',
        ' AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405'
      ].join('')
    };

    const authAttempt = await AuthAttempt.create(document);

    Code.expect(authAttempt).to.be.an.instanceOf(AuthAttempt);
    Code.expect(authAttempt.ip).to.equal('127.0.0.4');
    Code.expect(authAttempt.username).to.equal('apollo');

  });
});
