'use strict';
const Boom = require('boom');
const Joi = require('joi');
const PermissionConfigTable = require('../../permission-config');
const DEFAULT_ROLES = require('../helper/getDefaultRoles');

const internals = {};


internals.applyRoutes = function (server, next) {

  const Token = server.plugins['hicsail-hapi-mongo-models'].Token;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;

  server.route({
    method: 'GET',
    path: '/table/tokens',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.GET['/api/table/tokens'] || DEFAULT_ROLES
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
      //researcher
      else if (accessLevel === 3) {
        query.userId = request.auth.credentials.user._id.toString();
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

      Token.pagedLookupById(query,sort,limit,page,User,'user','userId',fields, userFields, (err, results) => {

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
    path: '/tokens',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.GET['/api/tokens'] || ['root', 'admin', 'researcher']
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

      Token.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/tokens',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.POST['/api/tokens'] || DEFAULT_ROLES
      },
      validate: {
        payload: Token.payload
      }
    },
    handler: function (request, reply) {

      Token.create(request.payload.tokenName, request.auth.credentials.user._id.toString(),(err, feedback) => {

        if (err) {
          return reply(err);
        }

        reply(feedback);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/tokens/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.PUT['/api/tokens/{id}'] || DEFAULT_ROLES
      },
      validate: {
        payload: Token.payload
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          tokenName: request.payload.tokenName,
          active: request.payload.active
        }
      };

      Token.findByIdAndUpdate(id, update, (err, token) => {

        if (err) {
          return reply(err);
        }

        if (!token) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(token);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/tokens/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: PermissionConfigTable.DELETE['/api/tokens/{id}'] || ['root','admin']
      }
    },
    handler: function (request, reply) {

      Token.findByIdAndDelete(request.params.id, (err, token) => {

        if (err) {
          return reply(err);
        }

        if (!token) {
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
  name: 'tokens'
};
