require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy - IMPORTANT for Render
app.set('trust proxy', 1);

// CORS - MUST come before session
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration - CRITICAL settings
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Trust first proxy
  cookie: {
    secure: true, // HTTPS only
    sameSite: 'none', // Allow cross-origin
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/progress', require('./routes/progress'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Quiz App Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});