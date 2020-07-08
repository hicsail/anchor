'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const Event = require('../models/event');

const register = function (server, options) {  

  server.route({
    method: 'GET',
    path: '/api/table/events',
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

      const events = await Event.pagedLookup(query,page,limit,lookups);

      return {
        draw: request.query.draw,
        recordsTotal: events.data.length,
        recordsFiltered: events.items.total,
        data: events.data        
      };      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/events',
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

      const events = await Event.pagedFind(query, page, limit);

      return events;      
    }
  });

  server.route({
    method: 'POST',
    path: '/api/events/{name}',
    options: {
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
    handler: async function (request, h) {

      let userId = null;

      if (request.auth.isAuthenticated) {
        userId = request.auth.credentials.user._id.toString();
      }

      const event = await Event.create(request.params.name,userId);

      return event;      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/events/name/{name}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      }
    },
    handler: async function (request, h) {

      const fields = Event.fieldsAdapter('time');

      const events = await Event.find({ name: request.params.name});

      return events;      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/events/user/{userId}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      }
    },
    handler: async function (request, h) {

      const fields = Event.fieldsAdapter('name time');

      const events = await Event.find({ userId: request.params.userId });

      return events;      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/events/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin']
      }
    },
    handler: async function (request, h) {

      const event = await Event.findByIdAndDelete(request.params.id);

      if (!event) {
        throw Boom.notFound('Document not found.');
      }

      return { message: 'Success.' };      
    }
  });  
};

module.exports = {
  name: 'events',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};