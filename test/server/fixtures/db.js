'use strict';
const Analytic = require('../../../server/models/analytic');
const AuthAttempt = require('../../../server/models/auth-attempt');
const Backup = require('../../../server/models/backup');
const Feedback = require('../../../server/models/feedback');
const Invite = require('../../../server/models/invite');
const Notification = require('../../../server/models/notification');
const Role = require('../../../server/models/role');
const Session = require('../../../server/models/session');
const Token = require('../../../server/models/token');
const User = require('../../../server/models/user');


class Db {
  static async removeAllData() {

    return await Promise.all([
      Analytic.deleteMany({}),
      AuthAttempt.deleteMany({}),
      Backup.deleteMany({}),
      Feedback.deleteMany({}),
      Invite.deleteMany({}),
      Notification.deleteMany({}),
      Role.deleteMany({}),
      Session.deleteMany({}),
      Token.deleteMany({}),
      User.deleteMany({})
    ]);
  }
}


module.exports = Db;
