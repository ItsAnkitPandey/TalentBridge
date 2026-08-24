const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Connection = sequelize.define('Connection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  follower_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  following_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
    defaultValue: 'accepted' // Direct follow, no approval needed
  }
}, {
  tableName: 'connections',
  timestamps: true,
  indexes: [
    { fields: ['follower_id'] },
    { fields: ['following_id'] },
    { unique: true, fields: ['follower_id', 'following_id'] }
  ]
});

module.exports = Connection;
