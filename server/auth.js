'use strict';
const Boom = require('boom');
const Crypto = require('./crypto');
const Config = require('../config');
const Role = require('./models/role');
const Session = require('./models/session');
const Token = require('./models/token');
const User = require('./models/user');

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

      if (`${user._id}` !== '000000000000000000000000') {
        if (!await confirmPermission(request,user)) {
          throw Boom.forbidden('Need permission');
        }
      }

      await session.updateLastActive();

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

      let token = await Token.findById(tokenId);
      const user = await User.findById(token.userId);
      if (!user) {
        return { isValid: false };
      }

      if (!user.isActive) {
        return { isValid: false };
      }

      if (!await confirmPermission(request,user)) {
        throw Boom.forbidden('Need permission');
      }

      if (await Crypto.compare(password,token.key)){

        token = await Token.findByIdAndUpdate(token._id,  {
          $set: {
            lastActive: new Date()
          }
        });

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

      const user = await User.findById(session.userId);

      if (!user) {
        return { valid: false };
      }

      if (!user.isActive) {
        return { valid: false };
      }

      if (`${user._id}` !== '000000000000000000000000') {
        if (!await confirmPermission(request,user)) {
          throw Boom.forbidden('Need permission');
        }
      }

      await session.updateLastActive();

      const credentials = {
        session,
        user
      };

      return { credentials, valid: true };
    }
  });
};

const usersPermissions = async function (user) {

  const roles = user.roles;

  const permissions = {};
  for (const roleId of roles) {
    const role = await Role.lookupById(roleId,Role.lookups);
    if (role) {
      for (const key in role.permissions){
        if (!permissions[key]) {
          permissions[key] = role.permissions[key];
        }
        else {
          if (role.permissions[key] === true) {
            permissions[key] = role.permissions[key];
          }
        }
      }
    }
  }
  return permissions;
};

const confirmPermission = async function (request,user) {

  const method = String(request.method).toUpperCase();
  const incompletePath = String(request.path).split('/').join('-');
  const key = method + incompletePath;
  const permissions = await usersPermissions(user);

  if (permissions[key] !== undefined) {
    return permissions[key];
  }

  return true;
};

module.exports = {
  name: 'auth',
  dependencies: [
    'hapi-auth-basic',
    'hapi-auth-cookie',
    'hapi-auth-jwt2',
    'hapi-anchor-model'
  ],
  register,
  usersPermissions,
  confirmPermission
};
