'use strict';
const _ = require('lodash');


const roleHelper = function (user, role, context) {

  if (_.isEmpty(context)) {
    return false;
  }
  switch (role) {
  case 'root':
    if (user.roles.root) {
      return context.fn(this);
    }
    return context.inverse(this);

  case 'admin':
    if (user.roles.root) {
      return context.fn(this);
    }
    else if (user.roles.admin) {
      return context.fn(this);
    }
    return context.inverse(this);

  case 'researcher':
    if (user.roles.root) {
      return context.fn(this);
    }
    else if (user.roles.admin) {
      return context.fn(this);
    }
    else if (user.roles.researcher) {
      return context.fn(this);
    }
    return context.inverse(this);

  case 'clinician':
      if (user.roles.root) {
          return context.fn(this);
      }
      else if (user.roles.admin) {
          return context.fn(this);
      }
      else if (user.roles.researcher) {
          return context.fn(this);
      }
      else if (user.roles.clinician) {
          return context.fn(this);
      }
      return context.inverse(this);

  }

};

module.exports = roleHelper;
