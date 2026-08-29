const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Referral = sequelize.define('Referral', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requester_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  referrer_id: {
    type: DataTypes.UUID,
    allowNull: true, // Null until someone accepts the request
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
  status: {
    type: DataTypes.ENUM('requested', 'accepted', 'submitted_to_hr', 'interviewing', 'rejected', 'completed', 'cancelled'),
    defaultValue: 'requested'
  },
  internal_referral_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  proof_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  proof_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resume_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  referrer_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  response_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at'
  }
}, {
  tableName: 'referrals',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['requester_id'] },
    { fields: ['referrer_id'] },
    { fields: ['job_id'] },
    { fields: ['status'] }
  ]
});

module.exports = Referral;
