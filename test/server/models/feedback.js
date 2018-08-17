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

    const document = {
      title: 'title',
      description: 'description',
      userId: 'testId'
    };

    const feedback = await Feedback.create(document);

    Code.expect(feedback).to.be.an.instanceOf(Feedback);
    Code.expect(feedback.title).to.equal('title');
    Code.expect(feedback.description).to.equal('description');

  });
});
