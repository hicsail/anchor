'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {


  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'roles',
  dependencies: 'visionary'
};
