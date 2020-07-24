'use strict';
const Boom = require('boom');
const Joi = require('joi');
const ScopeArray = require('../helpers/getScopes');
// eslint-disable-next-line hapi/hapi-capitalize-modules
const defaultScopes = require('../helpers/getRoleNames');

const internals = {};


internals.applyRoutes = function (server, next) {

  const Feedback = server.plugins['hicsail-hapi-mongo-models'].Feedback;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;

  server.route({
    method: 'GET',
    path: '/table/feedback',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/table/feedback', 'GET', defaultScopes)
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

      let userFields = 'studyID username';
      if (accessLevel === 1) {
        //if analyst remove PHI
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

      Feedback.pagedLookupById(query,sort,limit,page,User,'user','userId',fields, userFields, (err, results) => {

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
    path: '/feedback',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/feedback', 'GET', ['root', 'admin', 'researcher'])
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

      Feedback.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/feedback',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/feedback', 'POST', defaultScopes)
      },
      validate: {
        payload: Feedback.payload
      }
    },
    handler: function (request, reply) {

      Feedback.create(request.payload.subject,request.payload.description, request.auth.credentials.user._id.toString(),(err, feedback) => {

        if (err) {
          return reply(err);
        }

        reply(feedback);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/feedback/unresolved',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/feedback/unresolved', 'GET', ['root', 'admin', 'researcher'])
      }
    },
    handler: function (request, reply) {

      Feedback.count({ resolved: false }, (err,total) => {

        if (err) {
          return reply(err);
        }

        reply(total);
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/feedback/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/feedback/{id}', 'PUT', ['root','admin','researcher'])
      },
      validate: {
        payload: {
          resolved: Joi.boolean().required(),
          comment: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          resolved: request.payload.resolved,
          comment: request.payload.comment
        }
      };

      Feedback.findByIdAndUpdate(id, update, (err, feedback) => {

        if (err) {
          return reply(err);
        }

        if (!feedback) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(feedback);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/feedback/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/feedback/{id}', 'GET', ['root', 'admin', 'researcher'])
      }
    },
    handler: function (request, reply) {

      Feedback.findById(request.params.id, (err, feedback) => {

        if (err) {
          return reply(err);
        }

        if (!feedback) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(feedback);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/feedback/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ScopeArray('/api/feedback/{id}', 'DELETE', ['root','admin'])
      }
    },
    handler: function (request, reply) {

      Feedback.findByIdAndDelete(request.params.id, (err, event) => {

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

  server.dependency(['auth', 'hicsail-hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'feedback'
};
