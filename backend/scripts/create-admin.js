const { User } = require('../src/models');
const sequelize = require('../src/config/database');

async function createOrUpdateAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    const email = 'ankitpandey.272003@gmail.com';
    const password = 'Tikna@321';
    
    // Note: Don't hash password here - User model hooks will handle it
    // to avoid double-hashing

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      // Update existing user to admin
      user.password = password;  // Plain password - model will hash it
      user.user_type = 'admin';
      user.is_active = true;
      user.is_verified = true;
      await user.save();
      
      console.log('✅ User updated to admin successfully!');
      console.log({
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        user_type: user.user_type,
        is_verified: user.is_verified
      });
    } else {
      // Create new admin user
      user = await User.create({
        email,
        password: password,  // Plain password - model will hash it
        first_name: 'Ankit',
        last_name: 'Pandey',
        user_type: 'admin',
        is_active: true,
        is_verified: true,
        auth_provider: 'local'
      });
      
      console.log('✅ Admin user created successfully!');
      console.log({
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        user_type: user.user_type
      });
    }

    console.log('\n🎉 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createOrUpdateAdmin();
