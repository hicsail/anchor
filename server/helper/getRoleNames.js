'use strict';
const Config = require('../../config');

module.exports = Config.get('/roles').map((role) => role.name);