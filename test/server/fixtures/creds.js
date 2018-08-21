'use strict';
const Session = require('../../../server/models/session');
const User = require('../../../server/models/user');

class Credentials {

  static authHeader(username,password) {

    const combo = `${username}:${password}`;

    const combo64 = (Buffer.from(combo)).toString('base64');
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

  static async createRootUser(password,email) {

    const user = await User.insertOne({
      _id: User._idClass('000000000000000000000000'),
      username: 'root',
      password,
      email,
      name: 'root',
      roles: [],
      permissions: {}
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
