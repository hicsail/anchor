'use strict';
const PermissionConfigTable = require('../permission-config.json');

module.exports = (path, method, scopes) => {//gets the scope of the specified route's path and method
  //TODO: Remove this function

  if (PermissionConfigTable && PermissionConfigTable.hasOwnProperty(method)){
    return PermissionConfigTable[method][path];
  }
  return scopes;
};
