'use strict';
const User = require('../../../server/models/user');


const user = new User({
  _id: User.ObjectID('59970dd7153ff93721c590ac'),
  username: 'stimpy',
  roles: {}
});


module.exports = {
  user,
  roles: user.roles,
  scope: Object.keys(user.roles)
};
