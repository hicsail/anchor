'use strict';
const Config = require('../../config');

module.exports = Config.get('/role').map((role) => role.name); //gets the possible roles a user can be
