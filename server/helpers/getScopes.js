'use strict';
const PermissionConfigTable = require('../../permission-config.json');
const DefaultRoles = require('.//getDefaultRoles');

module.exports = (path, method, scope) => {

  if (PermissionConfigTable && PermissionConfigTable.hasOwnProperty(method)){
    return PermissionConfigTable[method][path];
  }
  return scope ?
    scope :
    DefaultRoles;
};
