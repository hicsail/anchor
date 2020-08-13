'use strict';

module.exports = (user, roleName, options) => { //Block helper for checking if user.roles has roleName

  return user.roles[roleName] ?
    options.fn(this) :
    options.inverse(this);
};



