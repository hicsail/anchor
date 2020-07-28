'use strict';
const AuthAttempt = require('../../../server/models/auth-attempt');
const Backup = require('../../../server/models/backup');
const Feedback = require('../../../server/models/feedback');
const Invite = require('../../../server/models/invite');
const Session = require('../../../server/models/session');
const Token = require('../../../server/models/token');
const User = require('../../../server/models/user');

class Db {
  static async removeAllData() {

    return await Promise.all([      
      AuthAttempt.deleteMany({}),
      Backup.deleteMany({}),
      Feedback.deleteMany({}),
      Invite.deleteMany({}),            
      Session.deleteMany({}),
      Token.deleteMany({}),
      User.deleteMany({})
    ]);
  }
}

module.exports = Db;
