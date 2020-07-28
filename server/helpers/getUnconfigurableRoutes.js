'use strict';

module.exports = (DefaultRoles, server, PermissionConfigTable) => { //looks at ALL routes and compares to see if they are "unconfigurable"

  const routes = [];
  for (const item of server.table()[0].table){
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
      PermissionConfigTable[routeObject.method][routeObject.path].some((role) => {//if a certain route doesn't have the same scope as the one in server means its unconfigurable.

        if (!set.has(role)){
          console.log('adding unconfigurable route: ', routeObject.method, routeObject.path );
          routes.push(routeObject);
          return true;
        }
      });
    }
  }
  return routes;
};
