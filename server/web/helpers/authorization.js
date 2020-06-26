'use strict';
const User = require('../../models/user');

module.exports = (request, roles_array) => {

  let isAuthorized = false;
  if (User.highestRole(request.auth.credentials.user.roles) >= User.lowestRole(roles_array) ){
    isAuthorized = true;
  }
  return isAuthorized;
};
