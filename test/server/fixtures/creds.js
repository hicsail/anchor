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
    
    const user = (await User.insertOne({
      _id: User._idClass('000000000000000000000000'),
      username: 'root',
      password,
      email,
      name: 'root',
      roles: { root:true, admin:true }     
    }))[0];

    const session = await Session.create(`${user._id}`, '127.0.0.1', 'Lab');  

    return {
      user,
      session,
      roles: user.roles,
      scope: Object.keys(user.roles)
    };
  }

  static async createUser(username, email, password, name, rolesArray) {

    const roles = {};
    for (const role of rolesArray) {
      roles[role] = true;
    }
    const user = await User.create(username, password, email, name);

    const update = {
      $set: {
        roles: roles
      }
    };

    await User.findByIdAndUpdate(user._id.toString(), update);    

    const session = await Session.create(`${user._id}`, '127.0.0.1', 'Lab');  

    return {
      user,
      session,
      roles: user.roles,
      scope: Object.keys(user.roles)
    };
  }
}

module.exports = Credentials;
