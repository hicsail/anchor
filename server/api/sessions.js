'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const Session = require('../models/session');


const register = function (server, options) {  

  server.route({
    method: 'GET',
    path: '/api/table/sessions',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        query: Joi.any()
      }
    },
    handler: async function (request, h) {

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

      const lookups = [{
        from: User,
        local: 'userId',
        foreign: '_id',
        as: 'user',
        one: false                
      }];          

      const sessions = await Session.pagedLookup(query,page,limit,options,lookups);
      
      return {
        draw: request.query.draw,
        recordsTotal: sessions.data.length,
        recordsFiltered: sessions.items.total,
        data: sessions.data          
      };     
    }
  });

  server.route({
    method: 'GET',
    path: '/api/sessions',
    options: {
      auth: {
        strategies: ['simple', 'session'],
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
    handler: async function (request, h) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      const sessions = await Session.pagedFind(query, page, limit);

      return sessions;      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/sessions/my',
    options: {
      auth: {
        strategies: ['simple', 'session']
      }
    },
    handler: async function (request, h) {

      const id = request.auth.credentials.user._id.toString();

      const session = await Session.find({ userId: id });

      if (!session) {
        throw Boom.notFound('Document not found.');
      }

      return session;      
    }
  });


  server.route({
    method: 'GET',
    path: '/api/sessions/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      }
    },
    handler: async function (request, h) {      
      
      const session = await Session.findById(request.params.id);

      if (!session) {
        throw Boom.notFound('Document not found.');
      }

      return session;      
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sessions/my/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      pre: [{
        assign: 'current',
        method: async function (request,h) {

          const currentSession = request.auth.credentials.session._id.toString();

          if (currentSession === request.params.id) {

            throw Boom.badRequest('Unable to close your current session. You can use logout instead.');
          }

          return h.continue;
        }
      }]
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const userId = request.auth.credentials.user._id.toString();

      const filter = {
        _id: Session.ObjectID(id),
        userId
      };

      const session = await Session.findOneAndDelete(filter);

      if (!session) {
        throw Boom.notFound('Document not found.');
      }

      return ({ message: 'Success' });      
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/sessions/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin']
      }
    },
    handler: async function (request, h) {

      const session = await Session.findByIdAndDelete(request.params.id);

      if (!session) {
        throw Boom.notFound('Document not found.');
      }

      return ({ message: 'Success.' });      
    }
  });  
};

module.exports = {
  name: 'sessions',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};