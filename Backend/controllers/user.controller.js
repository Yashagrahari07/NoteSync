const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');

module.exports.registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password } = req.body;

        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or Email already exists' });
        }

        const hashedPassword = await userModel.hashPassword(password);

        const user = await userService.createUser({
            username,
            email,
            password: hashedPassword
        });

        const token = user.generateAuthToken();

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
};
