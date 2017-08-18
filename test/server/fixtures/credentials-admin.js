'use strict';
const User = require('../../../server/models/user');


const user = new User({
    _id: '535HOW35',
    username: 'ren',
    roles: {
        admin: true
    }
});


module.exports = {
    user,
    roles: user.roles,
    scope: Object.keys(user.roles)
};
