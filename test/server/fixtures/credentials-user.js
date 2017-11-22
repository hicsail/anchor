'use strict';
const User = require('../../../server/models/user');
const Session = require('../../../server/models/session');

const user = new User({
  _id: User.ObjectID('59970dd7153ff93721c590ac'),
  username: 'stimpy',
  roles: {}
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
