'use strict';
const Boom = require('boom');
const Joi = require('joi');
const User = require('../models/user');
const AuthAttempt = require('../models/auth-attempt');

const register = function (server, options) {

  /*server.route({
    method: 'GET',
    path: '/api/table/auth-attempts',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        mode:'try'
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

      const query = {
        username: { $regex: request.query['search[value]'].toLowerCase() }
      };
      //no role
      if (accessLevel === 0) {
        query.username = request.auth.credentials.user.username;
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
        query.username = request.auth.credentials.user.username;
      }           
      const authAttempts = await AuthAttempt.pagedFind(query, page, limit);

      return ({
          draw: request.query.draw,
          recordsTotal: authAttempts.data.length,
          recordsFiltered: authAttempts.items.total,
          data: authAttempts.data          
      })     
    }
  });*/

  /*server.route({
    method: 'GET',
    path: '/api/auth-attempts',
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

      const authAttempts = AuthAttempt.pagedFind(query, fields, sort, limit, page);

      return authAttempts;      
    }
  });*/

  /*server.route({
    method: 'GET',
    path: '/api/auth-attempts/{id}',
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      }
    },
    handler: async function (request, h) {

      const authAttempt = await AuthAttempt.findById(request.params.id);

      if (!authAttempt) {
          throw Boom.notFound('Document not found.');
      }

      return authAttempt;      
    }
  });*/


  /*server.route({
    method: 'DELETE',
    path: '/api/auth-attempts/{id}',    
    options: {
      auth: {
        strategies: ['simple', 'session'],
        scope: ['root']
      }
    },
    handler: async function (request, h) {
      
      const authAttempt = await AuthAttempt.findByIdAndDelete(request.params.id);

      if (!authAttempt) {
          throw Boom.notFound('Document not found.');
      }

      return ({ message: 'Success.' });      
    }
  });*/  
};

module.exports = {
  name: 'auth-attempts',
  dependencies: [
    'auth',    
    'hapi-anchor-model'    
  ],
  register
};