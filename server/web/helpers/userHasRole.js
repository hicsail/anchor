'use strict';

module.exports = (user, roleName, options) => { //this is a Block Helper

  return user.roles[roleName] ?
    options.fn(this) :
    options.inverse(this);
};



