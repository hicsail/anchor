'use strict';
const Config = require('../../config');

module.exports = Config.get('/role').map((role) => role.name);
