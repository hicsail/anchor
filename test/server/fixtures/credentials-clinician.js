'use strict';
const User = require('../../../server/models/user');

const user = new User({
  username: 'stimpy',
  roles: {
    clinician: {userAccess: ['userId']}
  }
});


module.exports = {
  user,
  roles: user._roles,
  scope: Object.keys(user.roles)
};


module.exports = {
  user,
  roles: user._roles,
  scope: Object.keys(user.roles)
};
