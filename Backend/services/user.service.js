const userModel = require('../models/user.model');

module.exports.createUser = async ({ username, email, password }) => {
    if (!username || !email || !password) {
        throw new Error('All fields are required');
    }

    const user = await userModel.create({
        username,
        email,
        password
    });

    return user;
};
