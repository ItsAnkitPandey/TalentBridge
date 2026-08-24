const { sequelize } = require('../models');

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
