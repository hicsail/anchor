'use strict';
const Clinician = require('../../../server/models/clinician');
const Lab = require('lab');

const lab = exports.lab = Lab.script();

lab.experiment('Clinician Class Methods', () => {

    lab.test('it creates a clinician successfully', (done) => {

        Clinician.create(['userId'], done());

    });
});
