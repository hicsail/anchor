'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Feedback = require('../models/feedback');
const User = require('../models/user');

const register = function (server, options) { 

  server.route({
    method: 'GET',
    path: '/api/table/feedback',
    options: {
      auth: {
        strategies: ['simple', 'session'],        
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

      /*let userFields = 'studyID username';
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
      userFields = User.fieldsAdapter(userFields);*/

      const lookups = [{
        from: User,
        local: 'userId',
        foreign: '_id',
        as: 'user',
        one: false                
      }];      

      const feedbacks = await Feedback.pagedLookup(query,page,limit,lookups);

      return {
        draw: request.query.draw,
        recordsTotal: feedbacks.data.length,
        recordsFiltered: feedbacks.items.total,
        data: feedbacks.data          
      };      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/feedback',
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

      const feedbacks = await Feedback.pagedFind(query, page, limit);

      return feedbacks;      
    }
  });

  server.route({
    method: 'POST',
    path: '/api/feedback',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: Feedback.payload
      }
    },
    handler: async function (request, h) {

      const feedback = Feedback.create(request.payload.subject,request.payload.description, request.auth.credentials.user._id.toString());

      return feedback;      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/feedback/unresolved',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: async function (request, h) {

      const total = await Feedback.count({ resolved: false });

      return total;      
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/feedback/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin','researcher']
      },
      validate: {
        payload: {
          resolved: Joi.boolean().required(),
          comment: Joi.string().required()
        }
      }
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          resolved: request.payload.resolved,
          comment: request.payload.comment
        }
      };

      const feedback = await Feedback.findByIdAndUpdate(id, update);

      if (!feedback) {
          throw Boom.notFound('feedback not found.');          
      }

      return feedback;      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/feedback/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root', 'admin', 'researcher']
      }
    },
    handler: async function (request, h) {

      const feedback = await Feedback.findById(request.params.id);

      if (!feedback) {
        throw Boom.notFound('feedback not found.'); 
      }

      return feedback;      
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/feedback/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin']
      }
    },
    handler: async function (request, h) {

      const feedback = await Feedback.findByIdAndDelete(request.params.id);

      if (!feedback) {
        throw Boom.notFound('feedback not found.'); 
      }

      return { message: 'Success.' };      
    }
  });  
};

module.exports = {
  name: 'feedbacks',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};