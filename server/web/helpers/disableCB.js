'use strict';
const User = require('../../models/user');

module.exports = (user, userRow, role, options) => { //Checks and disable checkbox if user's role is lower than the specific role in route's scope.

  if (User.highestRole(user.roles) < User.highestRole({ [role.name]: true })){
    return options.fn(this);
  }
  return options.inverse(this);
};
