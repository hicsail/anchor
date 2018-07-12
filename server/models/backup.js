'use strict';
const Joi = require('joi');
const Assert = require('assert');
const AnchorModel = require('../anchor/anchor-model');


class Backup extends AnchorModel {

  static async create(document){

    Assert.ok(document.filename, 'Missing filename');

    const backup = await this.insertOne(document);

    return backup[0];
  }
}


Backup.collectionName = 'backups';


Backup.schema = Joi.object({
  _id: Joi.object(),
  filename: Joi.string().required(),
  local: Joi.boolean().required(),
  s3: Joi.boolean().required(),
  createdAt: Joi.date(),
  updatedAt: Joi.date()
});

Backup.payload = Joi.object({
  filename: Joi.string().required(),
  local: Joi.boolean().required(),
  s3: Joi.boolean().required()
});


Backup.indexes = [
  { key: { filename: 1 } }
];


module.exports = Backup;
