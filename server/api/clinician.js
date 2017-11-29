'use strict';
const Boom = require('boom');
const Clinician = require('../models/clinician');
const MongoModels = require('hicsail-mongo-models');
const Joi = require('joi');

const internals = {};


internals.applyRoutes = function (server, next) {

  const User = server.plugins['hicsail-hapi-mongo-models'].User;


  server.route({
    method: 'GET',
    path: '/table/clinicians',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;
      const userId = MongoModels.ObjectID(request.auth.credentials.user._id.toString());

      const query = {
        username: { $regex: request.query['search[value]'].toLowerCase() },
        'roles.clinician.userAccess': { $in: [userId] }
      };


      User.pagedFind(query, fields, sort, limit, page, (err, results) => {

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
    path: '/table/clinicians/{id}',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: function (request, reply) {

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;
      const fields = request.query.fields;
      const userId = MongoModels.ObjectID(request.params.id);

      const query = {
        username: { $regex: request.query['search[value]'].toLowerCase() },
        'roles.clinician.userAccess': { $in: [userId] }
      };


      User.pagedFind(query, fields, sort, limit, page, (err, results) => {

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
    path: '/select2/clinicians',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
      },
      validate: {
        query: {
          term: Joi.string(),
          _type: Joi.string(),
          q: Joi.string()
        }
      }
    },
    handler: function (request, reply) {

      const query = {
        $or: [
          { email: { $regex: request.query.term, $options: 'i' } },
          { name: { $regex: request.query.term, $options: 'i' } },
          { username: { $regex: request.query.term, $options: 'i' } }
        ],
        'roles.clinician': { $exists: true }
      };
      const fields = 'name email username';
      const limit = 25;
      const page = 1;

      User.pagedFind(query, fields, null, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({
          results: results.data,
          pagination: {
            more: results.pages.hasNext
          }
        });
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/clinicians',
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

      const query = {
        'roles.clinician': { $exists: true }
      };
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      User.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/clinicians/my',
    config: {
      auth: {
        strategies: ['simple', 'jwt', 'session']
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

      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;
      const userId = MongoModels.ObjectID(request.auth.credentials.user._id.toString());

      const query = {
        'roles.clinician.userAccess': { $in: [userId] }
      };

      User.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/clinicians/{id}',
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
    path: '/clinicians/{id}',
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
    path: '/clinicians/{userId}/{clinicianId}',
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
    path: '/clinicians/{userId}/{clinicianId}',
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
