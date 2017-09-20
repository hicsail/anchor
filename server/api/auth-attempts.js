'use strict';
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const AuthAttempt = server.plugins['hapi-mongo-models'].AuthAttempt;
  const User = server.plugins['hapi-mongo-models'].User;


  server.route({
    method: 'GET',
    path: '/auth-attempts',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const accessLevel = User.highestRole(request.auth.credentials.user.roles);
      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      let fields = request.query.fields;

      const query = {
        username: { $regex: request.query['search[value]'].toLowerCase() }
      };
      //no role
      if (accessLevel === 0) {
        query.username = request.auth.credentials.user.username;
      }
      //analyst
      else if (accessLevel === 1) {
        if (fields) {
          fields = fields.split(' ');
          let length = fields.length;
          for (let i = 0; i < length; ++i) {
            if (User.PHI().indexOf(fields[i]) !== -1) {

              fields.splice(i, 1);
              i--;
              length--;
            }
          }
          fields = fields.join(' ');
        }
      }
      //clinician
      else if (accessLevel === 2) {
        query.username = request.auth.credentials.user.username;
      }

      AuthAttempt.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({
          draw: request.query.draw,
          recordsTotal: results.data.length,
          recordsFiltered: results.items.total,
          data: results.data,
          error: err
        });
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/auth-attempts/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: 'admin'
      }
    },
    handler: function (request, reply) {

      AuthAttempt.findById(request.params.id, (err, authAttempt) => {

        if (err) {
          return reply(err);
        }

        if (!authAttempt) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(authAttempt);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/auth-attempts/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: 'admin'
      }
    },
    handler: function (request, reply) {

      AuthAttempt.findByIdAndDelete(request.params.id, (err, authAttempt) => {

        if (err) {
          return reply(err);
        }

        if (!authAttempt) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({ message: 'Success.' });
      });
    }
  });


  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'auth-attempts'
};
