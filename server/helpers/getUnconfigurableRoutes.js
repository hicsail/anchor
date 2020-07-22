'use strict';

module.exports = (DefaultRoles, server, PermissionConfigTable) => {

  return server.table()[0].table.filter((item) => {

    if (item.hasOwnProperty('path')){//processing routes in server
      let routeObject = {};
      if (item.settings.hasOwnProperty('auth') && typeof item.settings.auth !== 'undefined' && item.settings.auth.hasOwnProperty('access') ){
        routeObject = {
          path: item.path,
          method: item.method.toUpperCase(),
          scope: item.settings.auth.access[0].scope.selection
        };
      }
      else {
        routeObject = {
          path: item.path,
          method: item.method.toUpperCase(),
          scope: DefaultRoles
        };
      }
      const set = new Set();
      routeObject.scope.forEach((role) => {

        set.add(role);
      });
      return PermissionConfigTable[routeObject.method][routeObject.path].some((role) => {//if a certain route doesn't have the same scope as the one in server means its unconfigurable.

        if (!set.has(role)){
          return true;
        }
      });
    }
  });
};
