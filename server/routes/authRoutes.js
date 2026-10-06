const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getMe);
router.get('/demo-accounts', authController.getDemoAccounts);
router.post('/demo-login', authController.loginDemo);
router.get('/users', authController.getUsers);

module.exports = router;
