'use strict';
const Analytic = require('../../../server/models/analytic');
const AuthAttempt = require('../../../server/models/auth-attempt');
const Backup = require('../../../server/models/backup');
const Feedback = require('../../../server/models/feedback');
const Session = require('../../../server/models/session');
const User = require('../../../server/models/user');

class Db {
  static async removeAllData() {

    return await Promise.all([
      Analytic.deleteMany({}),
      AuthAttempt.deleteMany({}),
      Backup.deleteMany({}),
      Feedback.deleteMany({}),
      Session.deleteMany({}),
      User.deleteMany({})
    ]);
  }
}

module.exports = Db;
