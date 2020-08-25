'use strict';
const _ = require('lodash');

const getUserAccess = function (admin, roleName) {  

  return admin.roles[roleName];
};

module.exports = getUserAccess;

