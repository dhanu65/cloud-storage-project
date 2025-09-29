const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/users/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  console.log('--- Register endpoint hit ---');
  console.log('Request body:', req.body);

  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    
    console.log('Found user during register:', user);

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({ username, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  console.log('--- Login endpoint hit ---');
  console.log('Request body:', req.body);

  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });

    console.log('Found user during login:', user);

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;