'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Event = server.plugins['hapi-mongo-models'].Event;
  const User = server.plugins['hapi-mongo-models'].User;

  server.route({
    method: 'GET',
    path: '/events',
    config: {
      auth: {
        strategies: ['simple', 'session']
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

      Event.pagedFind(query, fields, sort, limit, page, (err, results) => {

        const events = [];

        if (err) {
          return reply(err);
        }

        Async.each(results.data, (event, callback) => {

          let userFields = 'studyID username';

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

          if (event.userId) {

            userFields = User.fieldsAdapter(userFields);
            User.findById(event.userId,userFields,(err, user) => {

              if (err) {
                return callback(err);
              }

              event.user = user;
              const pattern = new RegExp(request.query['search[value]'].toLowerCase());
              if (accessLevel === 1) { //analyst
                if (!user.inStudy) {
                  return callback(null,event);
                }
              }
              if (pattern.test(event.user.username)) {
                events.push(event);
              }
              callback(null,event);
            });
          }
          else {
            events.push(event);
            callback(null,event);
          }

        }, (err) => {

          reply({
            draw: request.query.draw,
            recordsTotal: results.data.length,
            recordsFiltered: results.items.total,
            data: events,
            error: err
          });
        });
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/events/{name}',
    config: {
      auth: {
        mode: 'try',
        strategies: ['simple', 'session']
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      let userId = null;

      if (request.auth.isAuthenticated) {
        userId = request.auth.credentials.user._id.toString();
      }

      Event.create(request.params.name,userId,(err, event) => {

        if (err) {
          return reply(err);
        }

        reply(event);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/events/name/{name}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      }
    },
    handler: function (request, reply) {

      const fields = Event.fieldsAdapter('time');
      Event.find({ name: request.params.name },fields,(err, events) => {

        if (err) {
          return reply(err);
        }

        reply(events);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/events/user/{userId}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      }
    },
    handler: function (request, reply) {

      const fields = Event.fieldsAdapter('name time');
      Event.find({ userId: request.params.userId },fields, (err, events) => {

        if (err) {
          return reply(err);
        }

        reply(events);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/events/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      }
    },
    handler: function (request, reply) {

      Event.findByIdAndDelete(request.params.id, (err, event) => {

        if (err) {
          return reply(err);
        }

        if (!event) {
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
  name: 'events'
};
