'use strict';

const getUserAccess = function (admin, roleName) {

  return admin.roles[roleName];
};

module.exports = getUserAccess;

