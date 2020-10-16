'use strict';

module.exports = (scope, role, options) => {

  return scope.includes(role) ?
    options.fn(this) :
    options.inverse(this);
};
