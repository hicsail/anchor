'use strict';

module.exports = (routes) => {

  let numServerRoutes = 0;
  Object.keys(routes).forEach((method) => {

    numServerRoutes = numServerRoutes + Object.keys(routes[method]).length;
  });
  return numServerRoutes;
};
