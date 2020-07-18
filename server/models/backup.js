'use strict';
const Assert = require('assert');
const Joi = require('joi');
const AnchorModel = require('../anchor/anchor-model');
const Hoek = require('hoek');

class Backup extends AnchorModel {

  static async create(backupId, zip, s3, time = (new Date())) {

    //Assert.ok(backupId, 'Missing backupId argument.');    
    //Assert.ok(zip, 'Missing zip argument.');
    //Assert.ok(s3, 'Missing s3 argument.');

    const document = {
      backupId,
      zip,
      s3,
      time
    };

    const docs = await this.insertOne(document);
    
    return docs[0];   
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

Backup.routes = Hoek.applyToDefaults(AnchorModel.routes, {  
  create: {
    disabled: true
  },
  update: {
    disabled: true
  },
  delete: {
    disabled: true
  }   
});

Backup.indexes = [
  { key: { backupId: 1 } },
  { key: { time: 1 } }
];

Backup.lookups = [];

module.exports = Backup;
