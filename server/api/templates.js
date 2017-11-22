/* $lab:coverage:off$ */
'use strict';
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Template = server.plugins['hicsail-hapi-mongo-models'].Template;
  const User = server.plugins['hicsail-hapi-mongo-models'].User;


  server.route({
    method: 'GET',
    path: '/table/templates',
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
        name: { $regex: request.query['search[value]'].toLowerCase() }
      };
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
        //query.userId = request.auth.credentials.user._id.toString();
      }

      let userFields = 'studyID name username';
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

      Template.pagedLookupById(query,sort,limit,page,User,'user','userId',fields, userFields, (err, results) => {

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
    path: '/templates',
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

      Template.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/templates/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      }
    },
    handler: function (request, reply) {

      Template.findById(request.params.id, (err, document) => {

        if (err) {
          return reply(err);
        }

        if (!document) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(document);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/templates',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: Template.payload
      }
    },
    handler: function (request, reply) {

      Template.create(
        request.payload.name,
        request.auth.credentials.user._id.toString(),
        (err, document) => {

          if (err) {
            return reply(err);
          }

          reply(document);
        });
    }
  });


  server.route({
    method: 'PUT',
    path: '/templates/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        payload: Template.payload
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name
        }
      };

      Template.findByIdAndUpdate(id, update, (err, document) => {

        if (err) {
          return reply(err);
        }

        if (!document) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(document);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/templates/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session'],
        scope: ['root','admin']
      }
    },
    handler: function (request, reply) {

      Template.findByIdAndDelete(request.params.id, (err, document) => {

        if (err) {
          return reply(err);
        }

        if (!document) {
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
  name: 'templates'
};
/* $lab:coverage:on$ */
