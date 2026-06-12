const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  job_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  referral_id: {
    type: DataTypes.UUID,
    allowNull: true, // Null if applied without referral
    references: {
      model: 'referrals',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('submitted', 'under-review', 'shortlisted', 'interviewed', 'rejected', 'accepted'),
    defaultValue: 'submitted'
  },
  resume_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cover_letter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'applications',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['job_id'] },
    { fields: ['referral_id'] },
    { unique: true, fields: ['user_id', 'job_id'] }
  ]
});

module.exports = Application;
