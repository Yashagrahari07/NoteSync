const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');
const blacklistTokenModel = require('../models/blacklistToken.model');

const registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { fullname, email, password } = req.body;

        const existingUser = await userModel.findOne({ $or: [{ fullname }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Fullname or Email already exists' });
        }

        const hashedPassword = await userModel.hashPassword(password);

        const user = await userService.createUser({
            fullname,
            email,
            password: hashedPassword
        });

        const token = user.generateAuthToken();

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                fullname: user.username,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
};

const loginUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = user.generateAuthToken();

        const { password: _, ...userData } = user.toObject();

        res.cookie('token', token);

        res.status(200).json({ token, user: userData });

    } catch (err) {
        next(err);
    }
};

const getUserProfile = async (req, res, next) => {
    res.status(200).json(req.user);
}

const logoutUser = async (req, res, next) => {
    res.clearCookie('token');
    const token = req.cookies.token || req.headers.authorization.split(' ')[1];

    await blacklistTokenModel.create({ token });

    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    logoutUser
};