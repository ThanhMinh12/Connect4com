require('dotenv').config();
const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax', // or 'none' if using HTTPS
    secure: false     // set to true in production with HTTPS
  }
}));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use('/auth', authRoutes);

app.get('/', (req, res) => res.send('Misaka is running 😊'));

app.listen(3000, () => console.log('http://localhost:3000'));
