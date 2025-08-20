const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectToDb = require('./config/db');
const userRoutes = require('./routes/user.routes');
const noteRoutes = require('./routes/note.routes');
const notificationRoutes = require('./routes/notification.routes');
const userPreferencesRoutes = require('./routes/userPreferences.routes');

const app = express();

// Connect to MongoDB
connectToDb();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("NoteSync API");
});

app.use('/users', userRoutes);
app.use('/notes', noteRoutes);
app.use('/notifications', notificationRoutes);
app.use('/user-preferences', userPreferencesRoutes);

module.exports = app;
