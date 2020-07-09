'use strict';

module.exports = (cb, roleName, options) => {

  return cb.includes(roleName) ?
    options.fn(this) :
    options.inverse(this);
};
