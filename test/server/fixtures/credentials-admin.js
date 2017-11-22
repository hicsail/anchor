'use strict';
const Session = require('../../../server/models/session');
const User = require('../../../server/models/user');

const user = new User({
  _id: '535HOW35',
  username: 'ren',
  roles: {
    admin: true
  }
});

const session = new Session({
  '_id': '5250W35'
});



module.exports = {
  user,
  roles: user.roles,
  scope: Object.keys(user.roles),
  session
};
