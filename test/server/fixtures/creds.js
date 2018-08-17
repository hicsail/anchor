'use strict';
const Session = require('../../../server/models/session');
const User = require('../../../server/models/user');

class Credentials {

  static authHeader(username,password) {

    const combo = `${username}:${password}`;

    const combo64 = (new Buffer(combo)).toString('base64');
    return `Basic ${combo64}`;


  };

  static async createUser(username,password,email,name) {

    const user = await User.create({
      username,
      password,
      email,
      name
    });

    const session = await Session.create({
      userId: `${user._id}`,
      ip: '127.0.0.1',
      userAgent: 'Lab'
    });

    return {
      user,
      session
    };
  }
}

module.exports = Credentials;
