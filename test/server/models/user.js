'use strict';
const Async = require('async');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');
const Proxyquire = require('proxyquire');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');
const stub = {
    Account: {},
    Admin: {},
    bcrypt: {}
};
const User = Proxyquire('../../../server/models/user', {
    './account': stub.Account,
    './admin': stub.Admin,
    bcrypt: stub.bcrypt
});

lab.experiment('User Class Methods', () => {

    lab.before((done) => {

        User.connect(mongoUri, mongoOptions, (err, db) => {

            done(err);
        });
    });


    lab.after((done) => {

        User.deleteMany({}, (err, count) => {

            User.disconnect();

            done(err);
        });
    });


    lab.test('it creates a password hash combination', (done) => {

        User.generatePasswordHash('bighouseblues', (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();
            Code.expect(result.password).to.be.a.string();
            Code.expect(result.hash).to.be.a.string();

            done();
        });
    });


    lab.test('it returns an error when password hash fails', (done) => {

        const realGenSalt = stub.bcrypt.genSalt;
        stub.bcrypt.genSalt = function (rounds, callback) {

            callback(Error('bcrypt failed'));
        };

        User.generatePasswordHash('bighouseblues', (err, result) => {

            Code.expect(err).to.be.an.object();
            Code.expect(result).to.not.exist();

            stub.bcrypt.genSalt = realGenSalt;

            done();
        });
    });


    lab.test('it returns a new instance when create succeeds', (done) => {

        User.create('ren', 'bighouseblues', 'ren@stimpy.show', (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.instanceOf(User);

            done();
        });
    });


    lab.test('it returns an error when create fails', (done) => {

        const realInsertOne = User.insertOne;
        User.insertOne = function () {

            const args = Array.prototype.slice.call(arguments);
            const callback = args.pop();

            callback(Error('insert failed'));
        };

        User.create('ren', 'bighouseblues', 'ren@stimpy.show', (err, result) => {

            Code.expect(err).to.be.an.object();
            Code.expect(result).to.not.exist();

            User.insertOne = realInsertOne;

            done();
        });
    });


    lab.test('it returns a result when finding by login', (done) => {

        Async.auto({
            user: function (cb) {

                User.create('stimpy', 'thebigshot', 'stimpy@ren.show', cb);
            },
            username: ['user', function (results, cb) {

                User.findByCredentials(results.user.username, results.user.password, cb);
            }],
            email: ['user', function (results, cb) {

                User.findByCredentials(results.user.email, results.user.password, cb);
            }]
        }, (err, results) => {

            Code.expect(err).to.not.exist();
            Code.expect(results.user).to.be.an.instanceOf(User);
            Code.expect(results.username).to.be.an.instanceOf(User);
            Code.expect(results.email).to.be.an.instanceOf(User);

            done();
        });
    });


    lab.test('it returns nothing for find by credentials when password match fails', (done) => {

        const realFindOne = User.findOne;
        User.findOne = function () {

            const args = Array.prototype.slice.call(arguments);
            const callback = args.pop();

            callback(null, { username: 'toastman', password: 'letmein' });
        };

        const realCompare = stub.bcrypt.compare;
        stub.bcrypt.compare = function (key, source, callback) {

            callback(null, false);
        };

        User.findByCredentials('toastman', 'doorislocked', (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.not.exist();

            User.findOne = realFindOne;
            stub.bcrypt.compare = realCompare;

            done();
        });
    });


    lab.test('it returns early when finding by login misses', (done) => {

        const realFindOne = User.findOne;
        User.findOne = function () {

            const args = Array.prototype.slice.call(arguments);
            const callback = args.pop();

            callback();
        };

        User.findByCredentials('stimpy', 'dog', (err, result) => {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.not.exist();

            User.findOne = realFindOne;

            done();
        });
    });


    lab.test('it returns an error when finding by login fails', (done) => {

        const realFindOne = User.findOne;
        User.findOne = function () {

            const args = Array.prototype.slice.call(arguments);
            const callback = args.pop();

            callback(Error('find one failed'));
        };

        User.findByCredentials('stimpy', 'dog', (err, result) => {

            Code.expect(err).to.be.an.object();
            Code.expect(result).to.not.exist();

            User.findOne = realFindOne;

            done();
        });
    });


    lab.test('it returns a result when finding by username', (done) => {

        Async.auto({
            user: function (cb) {

                User.create('horseman', 'eathay', 'horse@man.show', (err, result) => {

                    Code.expect(err).to.not.exist();
                    Code.expect(result).to.be.an.instanceOf(User);

                    cb(null, result);
                });
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const username = results.user.username;

            User.findByUsername(username, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.instanceOf(User);

                done();
            });
        });
    });
});
