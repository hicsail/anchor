'use strict';
const Feedback = require('../../../server/models/feedback');
const Code = require('code');
const Config = require('../../../config');
const Fixtures = require('../fixtures');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const config = Config.get('/hapiAnchorModel/mongodb');

lab.experiment('Feedback Model', () => {

  lab.before(async () => {

    await Feedback.connect(config.connection, config.options);
    await Fixtures.Db.removeAllData();
  });

  lab.after(async () => {

    await Fixtures.Db.removeAllData();

    Feedback.disconnect();
  });

  lab.test('it returns a new instance when create succeeds', async () => {

    const subject = 'subject';
    const description = 'description';
    const userId = 'testId';

    const feedback = await Feedback.create(subject, description, userId);

    Code.expect(feedback).to.be.an.instanceOf(Feedback);
    Code.expect(feedback.subject).to.equal('subject');
    Code.expect(feedback.description).to.equal('description');

  });
});
