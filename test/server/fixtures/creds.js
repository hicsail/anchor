'use strict';
const Session = require('../../../server/models/session');
const User = require('../../../server/models/user');

class Credentials {

  static authHeader(username,password) {

    const combo = `${username}:${password}`;

    const combo64 = (new Buffer(combo)).toString('base64');
    return `Basic ${combo64}`;


  };

  static async createUser() {

    const user = await User.create('root','root','root@rugrats.show');

    const session = await Session.create(`${user._id}`, '127.0.0.1', 'Lab');

    return {
      user,
      session
    };
  }
}

module.exports = Credentials;
