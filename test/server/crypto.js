'use strict';
const Code = require('code');
const Crypto = require('../../server/crypto');
const Lab = require('lab');

const lab = exports.lab = Lab.script();

lab.experiment('Crypto Methods', () => {

  lab.test('it returns a new generateKeyHash successfully', async () => {

    const keyHash = await Crypto.generateKeyHash();

    Code.expect(keyHash).to.not.be.undefined();
  });

  lab.test('it returns true when comparing hashes is sucessful', async () => {

    const keyHash = await Crypto.generateKeyHash();

    const compare = await Crypto.compare(keyHash.key,keyHash.hash);

    Code.expect(compare).to.be.a.boolean().and.to.equal(true);
  });
});