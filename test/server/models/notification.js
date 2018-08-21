'use strict';
const Notification = require('../../../server/models/notification');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');

lab.experiment('Notification Model', () => {

  lab.before(async () => {

    await Notification.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });

  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Notification.disconnect();
  });

  lab.test('it returns a new instance when create succeeds', async () => {

    const document = {
      onesignalId: '123456789',
      playerIds: ['1'],
      title: 'Hello',
      subtitle: 'World',
      message: 'Message',
      increaseBadgeNumber: 1
    };

    const notification = await Notification.create(document);

    Code.expect(notification).to.be.an.instanceOf(Notification);
    Code.expect(notification.onesignalId).to.equal('123456789');
    Code.expect(notification.playerIds).to.equal(['1']);
    Code.expect(notification.title).to.equal('Hello');
    Code.expect(notification.subtitle).to.equal('World');
    Code.expect(notification.message).to.equal('Message');
    Code.expect(notification.increaseBadgeNumber).to.equal(1);

  });
});
