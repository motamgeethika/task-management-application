const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../data/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
    ];
    const userAvatar = avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newUser = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role ? role.trim() : 'Product Specialist',
      avatar: userAvatar,
      createdAt: new Date().toISOString()
    };

    const createdUser = await db.createUser(newUser);
    const token = generateToken(createdUser);

    await db.addActivity({
      type: 'user_joined',
      userId: createdUser.id,
      userName: createdUser.name,
      userAvatar: createdUser.avatar,
      details: 'Created an account and joined the workspace'
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: createdUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const userWithPassword = db.getUserByEmail(email, true);
    if (!userWithPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, userWithPassword.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const { password: _, ...safeUser } = userWithPassword;
    const token = generateToken(safeUser);

    return res.json({
      success: true,
      message: 'Welcome back, ' + safeUser.name + '!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};

exports.getMe = (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

exports.getDemoAccounts = (req, res) => {
  const users = db.getUsers();
  return res.json({
    success: true,
    demoAccounts: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar
    }))
  });
};

exports.loginDemo = (req, res) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Demo user not found.'
    });
  }

  const token = generateToken(user);
  return res.json({
    success: true,
    message: `Logged in as ${user.name} (${user.role})`,
    token,
    user
  });
};

exports.getUsers = (req, res) => {
  const users = db.getUsers();
  return res.json({
    success: true,
    users
  });
};
