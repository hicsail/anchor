'use strict';

exports.register = function (server, options, next) {

  server.route({//TODO: this route didn't have any strategies or auth before
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

      reply({ message: 'Welcome to the plot device.' });
    }
  });


  next();
};


exports.register.attributes = {
  name: 'index'
};
