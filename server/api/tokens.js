'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Token = require('../models/token');
const User = require('../models/user');

const register  = function (server, options) {
  
  server.route({
    method: 'GET',
    path: '/api/table/tokens',
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
      
      const lookups = [{
        from: User,
        local: 'userId',
        foreign: '_id',
        as: 'user',
        one: false                
      }];          

      const tokens = await Token.pagedLookup(query,page,limit,lookups);

      return {
        draw: request.query.draw,
        recordsTotal: tokens.data.length,
        recordsFiltered: tokens.items.total,
        data: tokens.data        
      };      
    }
  });

  server.route({
    method: 'GET',
    path: '/api/tokens',
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

      const tokens = await Token.pagedFind(query, page, limit);

      return tokens;      
    }
  });


  server.route({
    method: 'POST',
    path: '/api/tokens',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: Token.payload
      }
    },
    handler: async function (request, h) {

      const token = await Token.create(request.payload.tokenName, request.auth.credentials.user._id.toString());

      return token;      
    }
  });


  server.route({
    method: 'PUT',
    path: '/api/tokens/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session']
      },
      validate: {
        payload: Token.payload
      }
    },
    handler: async function (request, h) {

      const id = request.params.id;
      const update = {
        $set: {
          tokenName: request.payload.tokenName,
          active: request.payload.active
        }
      };

      const token = await Token.findByIdAndUpdate(id, update);

      if (!token) {
        throw Boom.notFound('token not found.');
      }

      return token;
    }
  });


  server.route({
    method: 'DELETE',
    path: '/api/tokens/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root','admin']
      }
    },
    handler: async function (request, h) {

      const token = await Token.findByIdAndDelete(request.params.id);

      if (!token) {
        throw Boom.notFound('Document not found.');
      }

      return { message: 'Success.' };      
    }
  });  
};

module.exports = {
  name: 'tokens',
  dependencies: [
    'hapi-anchor-model',
    'auth',    
  ],
  register
};