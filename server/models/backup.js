'use strict';
const Joi = require('joi');
const MongoModels = require('mongo-models');


class Backup extends MongoModels {

  static create(backupId, zip, s3, callback) {

    const document = {
      backupId,
      zip,
      s3,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}


Backup.collection = 'backups';


Backup.schema = Joi.object().keys({
  _id: Joi.object(),
  backupId: Joi.string().required(),
  zip: Joi.boolean().required(),
  s3: Joi.boolean().required(),
  time: Joi.date().required()
});


Backup.indexes = [
  { key: { backupId: 1 } },
  { key: { time: 1 } }
];


module.exports = Backup;
