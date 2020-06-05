'use strict';

module.exports = (user, roleName, options) => { //this is a Block Helper

  if (user.roles[roleName]) {
    return options.fn(this);
  }
  return options.inverse(this);
};



