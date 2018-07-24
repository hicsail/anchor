'use strict';
const Bcrypt = require('bcrypt');
const UUID = require('uuid/v4');

class Crypto {


  static async generateKeyHash() {

    const key = UUID();
    const salt = await  Bcrypt.genSalt(10);
    const hash = await Bcrypt.hash(key,salt);

    return { key, hash };
  }

}


module.exports = Crypto;

