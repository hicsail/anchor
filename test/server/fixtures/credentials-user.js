'use strict';
const User = require('../../../server/models/user');


const user = new User({
  username: 'stimpy',
  roles: {}
});


module.exports = {
  user,
  roles: user.roles,
  scope: Object.keys(user.roles)
};
