'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hapi-mongo-models'].Session;
  const User = server.plugins['hapi-mongo-models'].User;

  server.route({
    method: 'GET',
    path: '/table/sessions',
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

      const query = {};
      //no role
      if (accessLevel === 0) {
        query.userId = request.auth.credentials.user._id.toString();
      }
      //analyst
      else if (accessLevel === 1) {
        if (fields) {
          fields = fields.split(' ');
          let length = fields.length;
          for (let i = 0; i < length; ++i) {
            if (User.PHI().concat(['key']).indexOf(fields[i]) !== -1) {

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

      Session.pagedFind(query, fields, sort, limit, page, (err, results) => {

        const sessions = [];

        if (err) {
          return reply(err);
        }

        Async.each(results.data, (session, callback) => {

          let userFields = 'studyID username inStudy';

          if (accessLevel === 1) {
            //if analyst
            userFields = userFields.split(' ');
            let length = userFields.length;
            for (let i = 0; i < length; ++i) {
              if (User.PHI().indexOf(userFields[i]) !== -1) {

                userFields.splice(i, 1);
                i--;
                length--;
              }
            }
            userFields = userFields.join(' ');
          }

          userFields = User.fieldsAdapter(userFields);

          User.findById(session.userId,userFields,(err, user) => {

            if (err) {
              return callback(err);
            }

            session.user = user;
            const pattern = new RegExp(request.query['search[value]'].toLowerCase());
            if (accessLevel === 1) { //analyst
              if (!user.inStudy) {
                return callback(null,session);
              }
            }
            if (pattern.test(session.user.username)) {
              sessions.push(session);
            }
            callback(null,session);
          });
        }, (err) => {

          reply({
            draw: request.query.draw,
            recordsTotal: results.data.length,
            recordsFiltered: results.items.total,
            data: sessions,
            error: err
          });
        });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/sessions',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root', 'admin', 'researcher']
      },
      validate: {
        query: {
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      }
    },
    handler: function (request, reply) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      Session.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/sessions/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: 'admin'
      }
    },
    handler: function (request, reply) {

      Session.findById(request.params.id, (err, session) => {

        if (err) {
          return reply(err);
        }

        if (!session) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(session);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/sessions/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin']
      }
    },
    handler: function (request, reply) {

      Session.findByIdAndDelete(request.params.id, (err, session) => {

        if (err) {
          return reply(err);
        }

        if (!session) {
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
  name: 'sessions'
};
