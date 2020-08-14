'use strict';
const User = require('../../models/user');

module.exports = (user, userRow, role, options) => { //Only disable CB if userRow is root and

  if (userRow.roles.root || User.highestRole(user.roles) < User.highestRole({ [role.name]: true })){
    return options.fn(this);
  }
  return options.inverse(this);
};