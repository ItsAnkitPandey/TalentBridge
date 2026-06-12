const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  organization_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  posted_by: {
    type: DataTypes.UUID,
    allowNull: true, // Null for auto-scraped jobs
    references: {
      model: 'users',
      key: 'id'
    }
  },
  job_type: {
    type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'freelance'),
    defaultValue: 'full-time'
  },
  experience_level: {
    type: DataTypes.ENUM('entry', 'mid', 'senior', 'lead', 'fresher'),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  remote_type: {
    type: DataTypes.ENUM('on-site', 'remote', 'hybrid'),
    defaultValue: 'on-site'
  },
  salary_min: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  salary_max: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  salary_currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  required_skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  preferred_skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  benefits: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  application_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  external_job_id: {
    type: DataTypes.STRING,
    allowNull: true // For scraped jobs
  },
  source: {
    type: DataTypes.ENUM('manual', 'scraped-linkedin', 'scraped-naukri', 'scraped-indeed', 'scraped-glassdoor', 'api'),
    defaultValue: 'manual'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  views_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  applications_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'jobs',
  timestamps: true,
  indexes: [
    { fields: ['organization_id'] },
    { fields: ['posted_by'] },
    { fields: ['title'] },
    { fields: ['location'] },
    { fields: ['experience_level'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Job;
