const sequelize = require('../config/database');
const Organization = require('./organization.model');
const User = require('./user.model');
const Job = require('./job.model');
const Referral = require('./referral.model');
const Connection = require('./connection.model');
const Application = require('./application.model');

// Define associations

// User - Organization
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'employees' });

// User - Job (Posted jobs)
User.hasMany(Job, { foreignKey: 'posted_by', as: 'postedJobs' });
Job.belongsTo(User, { foreignKey: 'posted_by', as: 'poster' });

// Organization - Job
Organization.hasMany(Job, { foreignKey: 'organization_id', as: 'jobs' });
Job.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// Referral associations
Referral.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
Referral.belongsTo(User, { foreignKey: 'referrer_id', as: 'referrer' });
Referral.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

User.hasMany(Referral, { foreignKey: 'requester_id', as: 'requestedReferrals' });
User.hasMany(Referral, { foreignKey: 'referrer_id', as: 'providedReferrals' });
Job.hasMany(Referral, { foreignKey: 'job_id', as: 'referrals' });

// Connection associations (User following)
Connection.belongsTo(User, { foreignKey: 'follower_id', as: 'follower' });
Connection.belongsTo(User, { foreignKey: 'following_id', as: 'following' });

User.hasMany(Connection, { foreignKey: 'follower_id', as: 'following' });
User.hasMany(Connection, { foreignKey: 'following_id', as: 'followers' });

// Application associations
Application.belongsTo(User, { foreignKey: 'user_id', as: 'applicant' });
Application.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });
Application.belongsTo(Referral, { foreignKey: 'referral_id', as: 'referral' });

User.hasMany(Application, { foreignKey: 'user_id', as: 'applications' });
Job.hasMany(Application, { foreignKey: 'job_id', as: 'applications' });

module.exports = {
  sequelize,
  User,
  Organization,
  Job,
  Referral,
  Connection,
  Application
};
