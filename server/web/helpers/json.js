'use strict';
const _ = require('lodash');

const jsonHelper = function (json, context) {

  if (_.isEmpty(context)) {
    return false;
  }

  return JSON.stringify(json);
};

module.exports = jsonHelper;

