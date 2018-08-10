'use strict';
const Config = require('../config');
const Session = require('./models/session');
const User = require('./models/user');
const Token = require('./models/token');
const Boom = require('boom');
const Crypto = require('./crypto');

const permission = function (user) {

  const roles = user.roles;

  const permissions = {};
  for (const i in roles) {
    for (const [key,value] of  Object.entries(roles[i].permissions)){
      if (!permissions[key]) {
        permissions[key] = (key,value);
      }
      else {
        if (value === true) {
          permissions[key] = (key,value);
        }
      }
    }
  }
  return permissions;
};

const confirm = function (request,user) {


  const method = String(request.method).toUpperCase();
  const incompletePath = String(request.path).split('/')[1] + '-' +  String(request.path).split('/')[2];
  const key = method + '-' + incompletePath;
  const permissions = permission(user);

  if (permissions[key]) {
    return permissions[key];
  }

  return true;

};

const register = function (server, options) {

  server.auth.strategy('simple', 'basic', {
    validate: async function (request, sessionId, key, h) {

      const session = await Session.findByCredentials(sessionId, key);

      if (!session) {
        return { isValid: false };

      }

      const user = await User.findById(session.userId);

      if (!user) {
        return { isValid: false };
      }

      if (!user.isActive) {
        return { isValid: false };
      }

      if (!confirm(request,user)) {
        throw Boom.forbidden('Need permission');
      }



      const credentials = {
        session,
        user
      };

      return { credentials, isValid: true };
    }
  });

  server.auth.strategy('token','jwt', {
    key: Config.get('/cookieSecret'),
    verifyOptions: { algorithms: ['HS256'] },
    validate: async function (id,request) {

      const split = id.split(':');
      const tokenId = split[0];
      const password = split[1];

      const token = await Token.findById(tokenId);
      const user = await User.findById(token.userId);

      if (!user) {
        return { isValid: false };
      }

      if (!user.isActive) {
        return { isValid: false };
      }
      if (await Crypto.compare(password,token.key)){
        const credentials = {
          user,
          session: token
        };
        return { credentials, isValid: true };
      }
      return { isValid: false };
    }
  });


  server.auth.strategy('session', 'cookie', {
    password: Config.get('/cookieSecret'),
    cookie: 'anchor-auth',
    isSecure: false,
    redirectTo: '/login',
    appendNext: 'returnUrl',
    validateFunc: async function (request, data) {

      const session = await Session.findByCredentials(data.session._id, data.session.key);

      if (!session) {
        return { valid: false };
      }

      session.updateLastActive();

      const user = await User.findById(session.userId);

      if (!user) {
        return { valid: false };
      }

      if (!user.isActive) {
        return { valid: false };
      }

      const credentials = {
        session,
        user
      };

      return { credentials, valid: true };
    }
  });
};


module.exports = {
  name: 'auth',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model'
  ],
  register
};
