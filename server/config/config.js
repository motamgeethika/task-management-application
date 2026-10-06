require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_for_task_master_app_2026_xyz',
  JWT_EXPIRES_IN: '7d',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
