'use strict';
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');


class Backup extends AnchorModel {

  static create(backupId, zip, s3, callback, time = (new Date())) {

    const document = {
      backupId,
      zip,
      s3,
      time
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}


Backup.collectionName = 'backups';


Backup.schema = Joi.object({
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
