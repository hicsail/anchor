'use strict';
const PermissionConfigTable = require('../permission-config.json');

module.exports = (path, method, scopes) => {//gets the scope of the specified route's path and method, if no scope exists for route then the default scopes will be returned

  if (PermissionConfigTable && PermissionConfigTable.hasOwnProperty(method)){
    return PermissionConfigTable[method][path];
  }
  return scopes;
};
