'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const Boom = require('boom');
const Mongodb = require('mongodb');

const argsFromArguments = function (argumentz) {

  const args = new Array(argumentz.length);

  for (let i = 0; i < args.length; ++i) {
    args[i] = argumentz[i];
  }

  return args;
};

const dbFromArgs = function (args) {

  let db = AnchorModel.dbs.default;

  if (args[0] instanceof Mongodb.Db) {
    db = args.shift();
  }

  return db;
};

class AnchorModel {

  /**
   * Create a new instance of your class
   * @constructor
   * @param {object} data - an object containing the fields and values of the model instance. Internally data is passed to the validate function, throwing an error if present or assigning the value (the validated value with any type conversions and other modifiers applied) to the object as properties.
   * @return {AnchorModel} returns an instance of your class
   */
  constructor(data) {

    const result = this.constructor.validate(data);
    Object.assign(this, result.value);
  }

  /**
   * Execute an aggregation framework pipeline against the collection.
   * @async
   * @static
   * @param {object[]} pipeline - an array containing all the aggregation framework commands.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.aggregate]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#aggregate} method.
   * @returns {AnchorModel[]}
   */
  static aggregate() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);

    return collection.aggregate.apply(collection, args).toArray();
  }

  /**
   * Returns the underlying [MongoDB.Collection]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html}
   * @static
   * @returns {Collection}
   */
  static collection() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);

    return db.collection(this.collectionName);
  }

  /**
   * Connects to a MongoDB server and returns the [MongoDB.Db]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Db.html}
   * @async
   * @static
   * @param {object} connection - connection object
   * @param {string} connection.uri - the uri of the database. [See uri string docs]{@link https://docs.mongodb.com/manual/reference/connection-string/}
   * @param {string} connection.db - the name of the database.
   * @param {object} [options] - an optional object passed to [MongoClient.connect]{@link https://docs.mongodb.com/manual/reference/method/connect/}.
   * @param {string} [name=default] - an optional string to identify the connection. Used to support multiple connections along with the with(name) method.
   * @returns {Promise}
   */
  static async connect(connection, options = {}, name = 'default') {

    const client = await Mongodb.MongoClient.connect(connection.uri, options);

    AnchorModel.clients[name] = client;
    AnchorModel.dbs[name] = client.db(connection.db);

    return AnchorModel.dbs[name];
  }

  /**
   * Returns the number of documents matching a query
   * @static
   * @param {object} query - a filter object used to select the documents to count.
   * @param {object} [options] - an optional object passed to the native [Collection.count]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#count} method.
   * @returns {Promise<Number>}
   */
  static count() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);

    return collection.count.apply(collection, args);
  }

  /**
   * Creates multiple indexes in the collection and returns the result
   * @async
   * @static
   * @param {object[]} indexSpecs - an array of objects containing index specifications to be created. [See the index specification]{@link http://docs.mongodb.org/manual/reference/command/createIndexes/}.
   * @param {object} [options] - an optional object passed to the native [Collection.createIndexes]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#createIndexes} method.
   * @returns {Promise}
   *
   * @example
   * // Indexes are defined as a static property on your models like:
   * Customer.indexes = [
   *   { key: { name: 1 } },
   *   { key: { email: -1 } }
   * ];
   */
  static createIndexes() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);

    return collection.createIndexes.apply(collection, args);
  }

  /**
   * Deletes multiple documents and returns the [Collection.deleteWriteOpResult]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#%7EdeleteWriteOpResult}
   * @async
   * @static
   * @param {object} filter - a filter object used to select the documents to delete.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.deleteMany]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#deleteMany} method.
   * @returns {Promise}
   */
  static async deleteMany() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();    
    const options = Hoek.applyToDefaults({}, args.pop() || {});  

    const constraintsMapping = this.constraints;    
    
    if (constraintsMapping[this.collectionName]) {

      //case when there doesn't exist child collections restricting the delete
      if (!constraintsMapping[this.collectionName]['restrictDelete']) {
        const docs = await this.findMany(filter, options);
        const result = await collection.deleteMany(filter, options);
        for (let doc of docs) {
          const id = doc._id.toString();       
          updateChildCollections(constraintsMapping[this.collectionName]['referencingInfo'], id); 
        }       
        return result;  
      }
      //case when there exist child collections restricting the delete
      else if (constraintsMapping[this.collectionName]['restrictDelete']){
        return 'Deletion not allowed due to violation of referential integrity';  
      }      
    }
    //case when there exists no child collections referencing the document
    else {
      return await collection.deleteMany(filter, options);      
    }   
  }

  /**
   * Deletes a document and returns the [Collection.deleteWriteOpResult]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#%7EdeleteWriteOpResult}
   * @async
   * @static
   * @param {object} filter - a filter object used to select the document to delete.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.deleteOne

   ]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#deleteOne} method.
   * @returns {Promise}
   */
  static async deleteOne() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();    
    const options = Hoek.applyToDefaults({}, args.pop() || {});

    //return collection.deleteOne.apply(collection, args);

    const constraintsMapping = this.constraints;    
    
    if (constraintsMapping[this.collectionName]) {

      //case when there doesn't exist child collections restricting the delete
      if (!constraintsMapping[this.collectionName]['restrictDelete']) {
        const doc = await this.findOne(filter, options);
        const id = doc._id.toString();  

        const result = await collection.deleteOne(filter, options);
        updateChildCollections(constraintsMapping[this.collectionName]['referencingInfo'], id);        
        return result;  
      }
      //case when there exist child collections restricting the delete
      else if (constraintsMapping[this.collectionName]['restrictDelete']){
        return 'Deletion not allowed due to violation of referential integrity';  
      }      
    }
    //case when there deleteOnedoesn't exist no child collections referencing the document
    else {
      return await collection.deleteOne(filter, options);      
    }   
  }

  /**
   * Closes a specific connection by name or all connections if no name is specified.
   * @static
   * @param {string} [name] - Closes a specific connection by name
   */
  static disconnect(name) {

    if (name === undefined) {
      Object.keys(AnchorModel.dbs).forEach((key) => {

        delete AnchorModel.dbs[key];

        AnchorModel.clients[key].close();
      });

      return;
    }

    if (!AnchorModel.dbs.hasOwnProperty(name)) {
      throw new Error(`Db connection '${name}' not found.`);
    }

    delete AnchorModel.dbs[name];

    AnchorModel.clients[name].close();
  }

  /**
   * Returns a list of distinct values for the given key across a collection
   * @async
   * @static
   * @param {string} key -  a string representing the field for which to return distinct values.
   * @param {object} query - an optional query object used to limit the documents distinct applies to.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.distinct]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#distinct} method.
   * @return {Promise<AnchorModel>}
   */
  static distinct() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);

    return collection.distinct.apply(collection, args);
  }

  /**
   * A helper method to create a fields object suitable to use with MongoDB queries
   * @static
   * @param {string} fields - a string with space separated field names. Fields may be prefixed with - to indicate exclusion instead of inclusion.
   * @return {object}
   */
  static fieldsAdapter(fields) {

    if (Object.prototype.toString.call(fields) === '[object String]') {
      const document = {};

      fields = fields.split(/\s+/);
      fields.forEach((field) => {

        if (field) {
          const include = field[0] === '-' ? false : true;
          if (!include) {
            field = field.slice(1);
          }
          document[field] = include;
        }
      });

      fields = document;
    }

    return fields;
  }

  /**
   * Finds documents and returns an array of model instances
   * @async
   * @static
   * @param {object} query - a query object used to select the documents.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @return {Promise<AnchorModel>}
   */
  static async find() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const result = await collection.find.apply(collection, args).toArray();

    return this.resultFactory(result);
  }

  /**
   * Finds a document by _id and returns a model instance.
   * @async
   * @static
   * @param {string} id - a string value of the _id to find. The id will be casted to the type of _idClass.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.findOne]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOne} method.
   * @return {Promise<AnchorModel>}
   */
  static async findById() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const id = args.shift();
    const filter = { _id: this._idClass(id) };

    args.unshift(filter);

    const result = await collection.findOne.apply(collection, args);

    return this.resultFactory(result);
  }

  /**
   * Finds a document by _id, deletes it and returns a model instance
   * @async
   * @static
   * @param {string} id - a string value of the _id to find. The id will be casted to the type of _idClass
   * @return {Promise<AnchorModel>}
   */
  static async findByIdAndDelete() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const id = args.shift();
    const filter = { _id: this._idClass(id) };
    const options = Hoek.applyToDefaults({}, args.pop() || {});

    const constraintsMapping = this.constraints;    
    
    if (constraintsMapping[this.collectionName]) {

      //case when there doesn't exist child collections restricting the delete
      if (!constraintsMapping[this.collectionName]['restrictDelete']) {
        const result = await collection.findOneAndDelete(filter, options);
        updateChildCollections(constraintsMapping[this.collectionName]['referencingInfo'], id);        
        return this.resultFactory(result);  
      }
      //case when there exist child collections restricting the delete
      else if (constraintsMapping[this.collectionName]['restrictDelete']){
        return 'Deletion not allowed due to violation of referential integrity';  
      }      
    }
    //case when there deleteOnedoesn't exist no child collections referencing the document
    else {
      const result = await collection.findOneAndDelete(filter, options);
      return this.resultFactory(result);
    }   
  }

  /**
   * Finds a document by _id, updates it and returns a model instance
   * @async
   * @static
   * @param {string} id - a string value of the _id to find. The id will be casted to the type of _idClass.
   * @param {object} update - an object containing the fields/values to be updated.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.findOneAndUpdate]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndUpdate} method.
   * @return {Promise<AnchorModel>}
   */
  static async findByIdAndUpdate() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const id = args.shift();
    const update = args.shift();
    const defaultOptions = {
      returnOriginal: false
    };
    if (this.timestamps) {
      if (update.$set) {
        update.$set.updatedAt = new Date();
      }
      else {
        update.updatedAt = new Date();
      }
    }
    const options = Hoek.applyToDefaults(defaultOptions, args.pop() || {});
    const filter = { _id: this._idClass(id) };
    const result = await collection.findOneAndUpdate(filter, update, options);

    return this.resultFactory(result);
  }

  /**
   * Finds a document by _id, updates it and returns a model instance
   * @async
   * @static
   * @param {object} filter -  a filter object used to select the document.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.findOne]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOne} method.
   * @return {Promise<AnchorModel>}
   */
  static async findOne() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const result = await collection.findOne.apply(collection, args);

    return this.resultFactory(result);
  }

  /**
   * Finds one document matching a filter, deletes it and returns a model instance
   * @async
   * @static
   * @param {object} filter - a filter object used to select the document to delete.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.findOneAndDelete]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndDelete} method.
   * @return {Promise<AnchorModel>}
   */
  static async findOneAndDelete() {  

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();    
    const options = Hoek.applyToDefaults({}, args.pop() || {});

    const constraintsMapping = this.constraints;    
    
    if (constraintsMapping[this.collectionName]) {

      //case when there doesn't exist child collections restricting the delete
      if (!constraintsMapping[this.collectionName]['restrictDelete']) {
        const result = await collection.findOneAndDelete(filter, options);
        const id = result._id.toString();
        updateChildCollections(constraintsMapping[this.collectionName]['referencingInfo'], id);        
        return this.resultFactory(result);  
      }
      //case when there exist child collections restricting the delete
      else if (constraintsMapping[this.collectionName]['restrictDelete']){
        return 'Deletion not allowed due to violation of referential integrity';  
      }      
    }
    //case when there deleteOnedoesn't exist no child collections referencing the document
    else {
      const result = await collection.findOneAndDelete(filter, options);
      return this.resultFactory(result);
    }   
  }

  /**
   * Finds one document matching a filter, deletes it and returns a model instance
   * @async
   * @static
   * @param {object} filter -  a filter object used to select the document to replace.
   * @param {object} replacement -  the document replacing the matching document.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.findOneAndReplace]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndReplace} method.
   * @return {Promise<AnchorModel>}
   */
  static async findOneAndReplace() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();
    const doc = args.shift();
    const defaultOptions = {
      returnOriginal: false
    };
    const options = Hoek.applyToDefaults(defaultOptions, args.pop() || {});

    args.push(filter);
    args.push(doc);
    args.push(options);

    const result = await collection.findOneAndReplace.apply(collection, args);

    return this.resultFactory(result);
  }

  /**
   * Finds one document matching a filter, deletes it and returns a model instance
   * @async
   * @static
   * @param {object} filter -  a filter object used to select the document to replace.
   * @param {object} update -  an object containing the fields/values to be updated.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.findOneAndUpdate]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndUpdate} method.
   * @return {Promise<AnchorModel>}
   */
  static async findOneAndUpdate() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();
    const doc = args.shift();
    const defaultOptions = {
      returnOriginal: false
    };
    if (this.timestamps) {
      doc.$set.updatedAt = new Date();
    }
    const options = Hoek.applyToDefaults(defaultOptions, args.pop() || {});

    args.push(filter);
    args.push(doc);
    args.push(options);

    const result = await collection.findOneAndUpdate.apply(collection, args);

    return this.resultFactory(result);
  }

  /**
   * Inserts multiple documents and returns and array of model instances
   * @async
   * @static
   * @param {object[]} docs -   an array of document objects to insert.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.insertMany]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#insertMany} method.
   * @return {Promise<AnchorModel>}
   */
  static async insertMany() {

    const args = argsFromArguments(arguments);
    if (this.timestamps) {
      for (const doc of args[0]) {
        if (!doc.createdAt) {
          doc.createdAt = new Date();
        }
        if (typeof doc._id === 'string') {
          doc._id = this._idClass(doc._id);
        }
      }
    }
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const result = await collection.insertMany.apply(collection, args);

    return this.resultFactory(result);
  }

  /**
   * Inserts a document and returns a model instance
   * @async
   * @static
   * @param {object} doc - a document object to insert.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.insertOne]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#insertOne} method.
   * @return {Promise<AnchorModel>}
   */
  static async insertOne() {

    const args = argsFromArguments(arguments);
    if (this.timestamps) {
      if (!args[0].createdAt){
        args[0].createdAt = new Date();
      }
    }
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const result = await collection.insertOne.apply(collection, args);

    return this.resultFactory(result);
  }

  /**
   * Finds documents and returns an array of model instances with references to multiple collections
   * @param {object} filter - a query object used to select the documents.
   * @param {object[]} lookups - an array of lookup objects.
   * @param {AnchorModel} [lookups[].from] - the collection object to reference.
   * @param {string} lookups[].foreign - the field name on the from's collection to join upon.
   * @param {string} lookups[].local - the field name on this collection to join upon.
   * @param {string} lookups[].as - the field name on where to put the associated from objects.
   * @param {object[]} [lookups[].lookups] - additional lookups to be added to the from's collection.
   * @param {object} [lookups[].options] - an optional object passed to MongoDB's native on the from's [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @param {boolean} [lookups[].one = false] - an optional flag passed set the results of the look up to be an object rather than an array
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @return {Promise<AnchorModel>}
   */
  static async lookup() {

    const args = argsFromArguments(arguments);
    const filter = args.shift();
    const lookups = args.pop();
    const options = args.shift();
    const lookupDefaults  = {
      from: this,
      options: {},
      operator: '$eq',
      lookups: [],
      one: false
    };

    const localDocuments = await this.find(filter,options);

    for (const doc of localDocuments) {
      for (let lookup of lookups) {

        lookup = Hoek.applyToDefaults(lookupDefaults,lookup);
        const foreignFilter = {};
        foreignFilter[lookup.foreign] = {};
        foreignFilter[lookup.foreign][lookup.operator] = doc[lookup.local];
        if (lookup.foreign === '_id') {
          if (Array.isArray(doc[lookup.local])) {
            foreignFilter[lookup.foreign][lookup.operator] = doc[lookup.local].map((v) => {

              return this.ObjectId(v);
            });
          }
          else {
            foreignFilter[lookup.foreign][lookup.operator] = this.ObjectId(doc[lookup.local]);
          }
        }
        const results = await lookup.from.lookup(foreignFilter, lookup.options, lookup.lookups);
        doc[lookup.as] = lookup.one ? results[0] : results;
      }
    }
    return localDocuments;
  }

  /**
   * Finds a document by _id and returns an array of model instances with references to multiple collections
   * @param {string} id - a query object used to select the documents.
   * @param {object[]} lookups - an array of lookup objects.
   * @param {AnchorModel} [lookups[].from] - the collection object to reference.
   * @param {string} lookups[].foreign - the field name on the from's collection to join upon.
   * @param {string} lookups[].local - the field name on this collection to join upon.
   * @param {string} lookups[].as - the field name on where to put the associated from objects.
   * @param {object[]} [lookups[].lookups] - additional lookups to be added to the from's collection.
   * @param {object} [lookups[].options] - an optional object passed to MongoDB's native on the from's [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @return {Promise<AnchorModel>}
   */
  static async lookupById() {

    const args = argsFromArguments(arguments);
    const id = args.shift();
    const lookups = args.pop() || [];
    const options = args.pop() || {};
    const filter = { _id: this._idClass(id) };

    const result = await this.lookup(filter,options, lookups);
    return result[0];
  }

  /**
   * Finds one document matching the query and returns an array of model instances with references to multiple collections
   * @param {object} query - a query object used to select the document.
   * @param {object[]} lookups - an array of lookup objects.
   * @param {AnchorModel} [lookups[].from] - the collection object to reference.
   * @param {string} lookups[].foreign - the field name on the from's collection to join upon.
   * @param {string} lookups[].local - the field name on this collection to join upon.
   * @param {string} lookups[].as - the field name on where to put the associated from objects.
   * @param {object[]} [lookups[].lookups] - additional lookups to be added to the from's collection.
   * @param {object} [lookups[].options] - an optional object passed to MongoDB's native on the from's [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @return {Promise<AnchorModel>}
   */
  static async lookupOne() {

    const args = argsFromArguments(arguments);
    const filter = args.shift();
    const lookups = args.pop() || [];
    const options = args.pop() || {};

    const result = await this.lookup(filter,options, lookups);
    return result[0];
  }

  /**
   * Finds documents and returns the results of a given size and page
   * @async
   * @static
   * @param {object} filter - a filter object used to select the documents.
   * @param {number} page - a number indicating the current page.
   * @param {number} limit - a number indicating how many results should be returned.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @return {Promise<AnchorModel>}
   */
  static async pagedFind() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const filter = args.shift();
    const page = args.shift();
    const limit = args.shift();
    const options = args.pop() || {};

    const output = {
      data: undefined,
      pages: {
        current: page,
        prev: 0,
        hasPrev: false,
        next: 0,
        hasNext: false,
        total: 0
      },
      items: {
        limit,
        begin: ((page * limit) - limit) + 1,
        end: page * limit,
        total: 0
      }
    };
    const findOptions = Object.assign({}, options, {
      limit,
      skip: (page - 1) * limit
    });
    const [count, results] = await Promise.all([
      this.count(db, filter),
      this.find(db, filter, findOptions)
    ]);

    output.data = results;
    output.items.total = count;
    output.pages.total = Math.ceil(output.items.total / limit);
    output.pages.next = output.pages.current + 1;
    output.pages.hasNext = output.pages.next <= output.pages.total;
    output.pages.prev = output.pages.current - 1;
    output.pages.hasPrev = output.pages.prev !== 0;

    if (output.items.begin > output.items.total) {
      output.items.begin = output.items.total;
    }

    if (output.items.end > output.items.total) {
      output.items.end = output.items.total;
    }

    return output;
  }

  /**
   * Finds documents and returns the results of a given size and page
   * @async
   * @static
   * @param {object} filter - a filter object used to select the documents.
   * @param {number} page - a number indicating the current page.
   * @param {number} limit - a number indicating how many results should be returned.
   * @param {object[]} lookups - an array of lookup objects.
   * @param {AnchorModel} [lookups[].from] - the collection object to reference.
   * @param {string} lookups[].foreign - the field name on the from's collection to join upon.
   * @param {string} lookups[].local - the field name on this collection to join upon.
   * @param {string} lookups[].as - the field name on where to put the associated from objects.
   * @param {object[]} [lookups[].lookups] - additional lookups to be added to the from's collection.
   * @param {object} [lookups[].options] - an optional object passed to MongoDB's native on the from's [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @param {boolean} [lookups[].one = false] - an optional flag passed set the results of the look up to be an object rather than an array
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.find]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find} method.
   * @return {Promise<AnchorModel>}
   */
  static async pagedLookup() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const filter = args.shift();
    const page = args.shift();
    const limit = args.shift();
    const lookups = args.pop() || [];
    const options = args.pop() || {};

    const output = {
      data: undefined,
      pages: {
        current: page,
        prev: 0,
        hasPrev: false,
        next: 0,
        hasNext: false,
        total: 0
      },
      items: {
        limit,
        begin: ((page * limit) - limit) + 1,
        end: page * limit,
        total: 0
      }
    };
    const findOptions = Object.assign({}, options, {
      limit,
      skip: (page - 1) * limit
    });
    const [count, results] = await Promise.all([
      this.count(db, filter),
      this.lookup(filter, findOptions, lookups)
    ]);

    output.data = results;
    output.items.total = count;
    output.pages.total = Math.ceil(output.items.total / limit);
    output.pages.next = output.pages.current + 1;
    output.pages.hasNext = output.pages.next <= output.pages.total;
    output.pages.prev = output.pages.current - 1;
    output.pages.hasPrev = output.pages.prev !== 0;

    if (output.items.begin > output.items.total) {
      output.items.begin = output.items.total;
    }

    if (output.items.end > output.items.total) {
      output.items.end = output.items.total;
    }

    return output;
  }

  /**
   * replaces a document and returns a [Collection.updateWriteOpResult]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#%7EupdateWriteOpResult}
   * @async
   * @static
   * @param {object} filter - a filter object used to select the document to replace.
   * @param {object} doc -  the document that replaces the matching document.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.replaceOne]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#replaceOne} method.
   * @return {Promise<AnchorModel>}
   */
  static async replaceOne() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();
    const doc = args.shift();
    const options = Hoek.applyToDefaults({}, args.pop() || {});

    args.push(filter);
    args.push(doc);
    args.push(options);

    const result = await collection.replaceOne.apply(collection, args);

    return this.resultFactory(result);
  }

  static resultFactory(result) {

    if (Object.prototype.toString.call(result) === '[object Array]') {
      result.forEach((item, index) => {

        result[index] = new this(item);
      });
    }

    if (Object.prototype.toString.call(result) === '[object Object]') {
      if (result.hasOwnProperty('value') && !result.hasOwnProperty('_id')) {
        if (result.value) {
          result = new this(result.value);
        }
        else {
          result = undefined;
        }
      }
      else if (result.hasOwnProperty('ops')) {
        result.ops.forEach((item, index) => {

          result.ops[index] = new this(item);
        });

        result = result.ops;
      }
      else if (result.hasOwnProperty('_id')) {
        result = new this(result);
      }
    }

    return result;
  }

  /**
   * A helper method to create a sort object suitable to use with MongoDB queries where:
   * @param {string} sorts - a string with space separated field names. Fields may be prefixed with - to indicate decending sort order.
   * @return {object}
   */
  static sortAdapter(sorts) {

    if (Object.prototype.toString.call(sorts) === '[object String]') {
      const document = {};

      sorts = sorts.split(/\s+/);
      sorts.forEach((sort) => {

        if (sort) {
          const order = sort[0] === '-' ? -1 : 1;
          if (order === -1) {
            sort = sort.slice(1);
          }
          document[sort] = order;
        }
      });

      sorts = document;
    }

    return sorts;
  }

  /**
   * Updates multiple documents and returns a [Collection.updateWriteOpResult]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#%7EupdateWriteOpResult}
   * @async
   * @static
   * @param {object} filter - a filter object used to select the documents to update.
   * @param {object} update -  the update operations object.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.updateMany]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#updateMany} method.
   * @return {Promise<AnchorModel>}
   */
  static async updateMany() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();
    const update = args.shift();
    const options = Hoek.applyToDefaults({}, args.pop() || {});
    if (this.timestamps) {
      update.$set.updatedAt = new Date();
    }
    args.push(filter);
    args.push(update);
    args.push(options);

    const result = await collection.updateMany.apply(collection, args);

    return this.resultFactory(result);
  }

  /**
   * Updates a document and returns a [Collection.updateWriteOpResult]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#%7EupdateWriteOpResult}
   * @async
   * @static
   * @param {object} filter - a filter object used to select the document to update.
   * @param {object} update -  the update operations object.
   * @param {object} [options] - an optional object passed to MongoDB's native [Collection.updateMany]{@link https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#updateMany} method.
   * @return {Promise<AnchorModel>}
   */
  static async updateOne() {

    const args = argsFromArguments(arguments);
    const db = dbFromArgs(args);
    const collection = db.collection(this.collectionName);
    const filter = args.shift();
    const update = args.shift();
    if (this.timestamps) {
      update.$set.updatedAt = new Date();
    }
    const options = Hoek.applyToDefaults({}, args.pop() || {});

    args.push(filter);
    args.push(update);
    args.push(options);

    const result = await collection.updateOne.apply(collection, args);

    return this.resultFactory(result);
  }

  static validate(input) {

    return Joi.validate(input, this.schema);
  }

  validate() {

    return Joi.validate(this, this.constructor.schema);
  }

  static with(name) {

    if (!AnchorModel.dbs.hasOwnProperty(name)) {
      throw new Error(`Db connection '${name}' not found.`);
    }

    const db = AnchorModel.dbs[name];
    const boundFunctionsId = `__MongoModelsDbBound${this.name}__`;

    if (!db.hasOwnProperty(boundFunctionsId)) {
      db[boundFunctionsId] = {
        aggregate: this.aggregate.bind(this, db),
        collection: this.collection.bind(this, db),
        count: this.count.bind(this, db),
        createIndexes: this.createIndexes.bind(this, db),
        deleteMany: this.deleteMany.bind(this, db),
        deleteOne: this.deleteOne.bind(this, db),
        distinct: this.distinct.bind(this, db),
        find: this.find.bind(this, db),
        findById: this.findById.bind(this, db),
        findByIdAndDelete: this.findByIdAndDelete.bind(this, db),
        findByIdAndUpdate: this.findByIdAndUpdate.bind(this, db),
        findOne: this.findOne.bind(this, db),
        findOneAndDelete: this.findOneAndDelete.bind(this, db),
        findOneAndReplace: this.findOneAndReplace.bind(this, db),
        findOneAndUpdate: this.findOneAndUpdate.bind(this, db),
        insertMany: this.insertMany.bind(this, db),
        insertOne: this.insertOne.bind(this, db),
        lookup: this.lookup.bind(this, db),
        lookupById: this.lookupById.bind(this, db),
        lookupOne: this.lookupOne.bind(this, db),
        pagedFind: this.pagedFind.bind(this, db),
        pagedLookup: this.pagedLookup.bind(this, db),
        replaceOne: this.replaceOne.bind(this, db),
        updateMany: this.updateMany.bind(this, db),
        updateOne: this.updateOne.bind(this, db)
      };
    }

    return db[boundFunctionsId];
  }
}

AnchorModel.routes = {
  auth: true,
  disabled: false,
  getAllTable: {
    auth: false,
    disabled: false,
    payload: null,
    handler: async (request,h) => {

      const sortOrder = request.query['order[0][dir]'] === 'asc' ? '' : '-';
      const sort = sortOrder + request.query['columns[' + Number(request.query['order[0][column]']) + '][data]'];
      const limit = Number(request.query.length);
      const page = Math.ceil(Number(request.query.start) / limit) + 1;

      const model = request.pre.model;
      const query = {};
      //const limit = request.query.limit;
      //const page = request.query.page;
      const options = {
        sort: sort
        //sort: model.sortAdapter(request.query.sort)
      };
      const results =  await model.pagedLookup(query, page, limit, options, model.lookups);      
      return {
        draw: request.query.draw,
        recordsTotal: results.data.length,
        recordsFiltered: results.items.total,
        data: results.data
      };
    },
    query: null
  },
  create: {
    auth: true,
    disabled: false,
    payload: null,
    handler: async (request,h) => {

      const model = request.pre.model;
      const payload = request.payload;

      if (request.auth.isAuthenticated){
        
        payload.userId = String(request.auth.credentials.user._id);
      }
      return await model.create(payload);
    },
    query: null
  },
  insertMany: {
    auth: false,
    disabled: true,
    payload: null,
    handler: async (request,h) => {

      const model = request.pre.model;
      const payload = request.payload;

      return await model.insertMany(payload);
    },
    query: null
  },
  getAll: {
    disabled: false,
    query: {
      sort: Joi.string().default('_id'),
      limit: Joi.number().default(20),
      page: Joi.number().default(1)
    },
    handler: async (request,h) => {

      const model = request.pre.model;
      const query = {};
      const limit = request.query.limit;
      const page = request.query.page;
      const options = {
        sort: model.sortAdapter(request.query.sort)
      };
      return await model.pagedLookup(query, page, limit, options, model.lookups);
    },
    auth: true
  },
  update: {
    disabled: false,
    payload: {},
    handler: async (request,h) => {

      const model = request.pre.model;
      const id = request.params.id;
      const update = {
        $set: request.payload
      };
      const check = await model.findByIdAndUpdate(id,update);
      if (!check) {
        throw Boom.notFound('Error updating');
      }
      return check;
    },
    query: null
  },
  delete: {
    disabled: false,
    payload: null,
    handler: async (request,h) => {

      const colWithRef = request.pre.constraints;
      const model = request.pre.model;
      const id = request.params.id;
      const check = await model.findByIdAndDelete(id);      
      if (!check) {
        throw Boom.notFound('Model with id not found');
      }
      else if (typeof check === 'string') {
        throw Boom.badRequest(check);  
      }
      return check;
    },
    query: null
  },
  getId: {
    disabled: false,
    handler: async (request,h) => {

      const model = request.pre.model;
      const id = request.params.id;
      const result = await model.lookupById(id,model.lookups);

      if (!result) {
        throw Boom.notFound('Model with id not found');
      }
      return result;
    },
    query: null
  },

  getMy: {
    disabled: false,
    query: {
      sort: Joi.string().default('_id'),
      limit: Joi.number().default(20),
      page: Joi.number().default(1)
    },
    handler: async (request,h) => {

      const model = request.pre.model;
      const limit = request.query.limit;
      const page = request.query.page;
      const options = {
        sort: model.sortAdapter(request.query.sort)
      };
      const userId = request.auth.credentials.user._id.toString();
      const query = {
        userId
      };
      return await model.pagedLookup(query,page,limit,options,model.lookups);
    }
  },
  tableView: {
    auth: true,
    disabled: false,
    apiDataSourcePath: '/api/table/{collectionName}',
    outputDataFields: null,
    validationSchema: Joi.object({
      label: Joi.string().required(),
      from: Joi.string(),
      invisible: Joi.boolean().default(false)
    }),    
    fieldAccessRestriction: null
  },
  editView: {
    auth: true,
    disabled: false
  },
  createView: {
    auth: true,
    disabled: false,
    createSchema: null
  }
};

AnchorModel.routeMap = {  
  getAllTable: {
    method: 'GET',
    path: '/api/table/{collectionName}'
  },
  create: {
    method: 'POST',
    path: '/api/{collectionName}'
  },
  getAll: {
    method: 'GET',
    path: '/api/{collectionName}'
  },
  getId: {
    method: 'GET',
    path: '/api/{collectionName}/{id}'
  },
  update: {
    method: 'PUT',
    path: '/api/{collectionName}/{id}'
  },
  delete: {
    method: 'DELETE',
    path: '/api/{collectionName}/{id}'
  },
  getMy: {
    method: 'GET',
    path: '/api/{collectionName}/my'
  },
  insertMany: {
    method: 'POST',
    path: '/api/{collectionName}/insertMany'
  },
  tableView: {
    method: 'GET',
    path: '/{collectionName}'
  },
  editView: {
    method: 'GET',
    path: '/edit/{collectionName}/{id}'
  },
  createView: {
    method: 'GET',
    path: '/create/{collectionName}'
  }
};
AnchorModel.timestamps = true;

AnchorModel._idClass = Mongodb.ObjectID;
AnchorModel.ObjectId = AnchorModel.ObjectID = Mongodb.ObjectID;
AnchorModel.clients = {};
AnchorModel.dbs = {};

module.exports = AnchorModel;

const updateChildCollections = async function(constraintsInfo, parentKey) {
  for (let constraintInfo of constraintsInfo) {

    const childKey = constraintInfo['foreignKey'];
    const childTable = constraintInfo['childTable'];
    const query = {};
    query[childKey] = parentKey;

    if (constraintInfo['onDelete'] === 'CASCADE') {          
      await childTable.deleteMany(query);
    }
    else if (constraintInfo['onDelete'] === 'SET-NULL') {          
      const update = {};
      update[childKey] = null;
      await childTable.updateMany(query, {$set: update});
    }        
  }
}