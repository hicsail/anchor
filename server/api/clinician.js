'use strict';
const Boom = require('boom');
const Clinician = require('../models/clinician');
const Config = require('../../config');
const Joi = require('joi');

const internals = {};


internals.applyRoutes = function (server, next) {

  const User = server.plugins['hicsail-hapi-mongo-models'].User;

  server.route({
    method: 'PUT',
    path: '/clinician/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      pre: [
        {
          assign: 'clinician',
          method: function (request, reply) {

            User.findById(request.params.id, (err, user) => {

              if (err) {
                return (err);
              }

              if (!user) {
                return reply(Boom.notFound('User not found'));
              }

              if (!user.roles.clinician) {
                return reply(Boom.conflict('User is not a clinician'));
              }

              reply(user);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const clinician = request.pre.clinician;
      const userId = request.auth.credentials.user._id.toString();

      const userAccess = Clinician.addUser(clinician.roles.clinician, userId);
      clinician.roles.clinician = userAccess;


      const update = {
        $set: {
          roles: clinician.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply('Success');
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/clinician/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      pre: [
        {
          assign: 'clinician',
          method: function (request, reply) {

            User.findById(request.params.id, (err, user) => {

              if (err) {
                return (err);
              }

              if (!user) {
                return reply(Boom.notFound('User not found'));
              }

              if (!user.roles.clinician) {
                return reply(Boom.conflict('User is not a clinician'));
              }

              reply(user);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const clinician = request.pre.clinician;
      const userId = request.auth.credentials.user._id.toString();

      const userAccess = Clinician.removeUser(clinician.roles.clinician, userId);
      clinician.roles.clinician = userAccess;


      const update = {
        $set: {
          roles: clinician.roles
        }
      };

      User.findByIdAndUpdate(request.params.id, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply('Success');
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/clinician/{userId}/{clinicianId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin','researcher']
      },
      pre: [
        {
          assign: 'clinician',
          method: function (request, reply) {

            User.findById(request.params.clinicianId, (err, user) => {

              if (err) {
                return (err);
              }

              if (!user) {
                return reply(Boom.notFound('Clinician not found'));
              }

              if (!user.roles.clinician) {
                return reply(Boom.conflict('User is not a clinician'));
              }

              reply(user);
            });
          }
        },{
          assign: 'user',
          method: function (request, reply) {

            User.findById(request.params.userId, (err, user) => {

              if (err) {
                return (err);
              }

              if (!user) {
                return reply(Boom.notFound('User not found'));
              }

              reply(request.params.userId);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const clinician = request.pre.clinician;
      const userId = request.pre.user;

      const userAccess = Clinician.addUser(clinician.roles.clinician, userId);
      clinician.roles.clinician = userAccess;


      const update = {
        $set: {
          roles: clinician.roles
        }
      };

      User.findByIdAndUpdate(request.params.clinicianId, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply('Success');
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/clinician/{userId}/{clinicianId}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin','researcher']
      },
      pre: [
        {
          assign: 'clinician',
          method: function (request, reply) {

            User.findById(request.params.clinicianId, (err, user) => {

              if (err) {
                return (err);
              }

              if (!user) {
                return reply(Boom.notFound('Clinician not found'));
              }

              if (!user.roles.clinician) {
                return reply(Boom.conflict('User is not a clinician'));
              }

              reply(user);
            });
          }
        },{
          assign: 'user',
          method: function (request, reply) {

            User.findById(request.params.userId, (err, user) => {

              if (err) {
                return (err);
              }

              if (!user) {
                return reply(Boom.notFound('User not found'));
              }

              reply(request.params.userId);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const clinician = request.pre.clinician;
      const userId = request.pre.user;

      const userAccess = Clinician.removeUser(clinician.roles.clinician, userId);
      clinician.roles.clinician = userAccess;


      const update = {
        $set: {
          roles: clinician.roles
        }
      };

      User.findByIdAndUpdate(request.params.clinicianId, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply('Success');
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'clinicians'
};
