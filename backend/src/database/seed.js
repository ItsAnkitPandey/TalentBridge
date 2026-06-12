const { User, Organization } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Create sample organizations
    const organizations = await Organization.bulkCreate([
      {
        name: 'TCS',
        slug: 'tcs',
        description: 'Tata Consultancy Services - Leading IT services company',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Mumbai, India',
        website: 'https://www.tcs.com',
        is_verified: true
      },
      {
        name: 'Wipro',
        slug: 'wipro',
        description: 'Wipro Limited - Global IT consulting and services',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Bangalore, India',
        website: 'https://www.wipro.com',
        is_verified: true
      },
      {
        name: 'Cognizant',
        slug: 'cognizant',
        description: 'Cognizant - Professional services company',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Teaneck, NJ, USA',
        website: 'https://www.cognizant.com',
        is_verified: true
      },
      {
        name: 'Infosys',
        slug: 'infosys',
        description: 'Infosys - Global leader in consulting and technology',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Bangalore, India',
        website: 'https://www.infosys.com',
        is_verified: true
      },
      {
        name: 'Accenture',
        slug: 'accenture',
        description: 'Accenture - Global professional services company',
        industry: 'Consulting',
        company_size: '1000+',
        headquarters: 'Dublin, Ireland',
        website: 'https://www.accenture.com',
        is_verified: true
      }
    ]);

    console.log(`Created ${organizations.length} organizations`);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      email: 'admin@referralsystem.com',
      password: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      user_type: 'admin',
      is_verified: true,
      can_provide_referrals: true
    });

    console.log('Created admin user (email: admin@referralsystem.com, password: admin123)');

    // Create sample employees
    const samplePassword = await bcrypt.hash('password123', 10);
    
    await User.bulkCreate([
      {
        email: 'john.doe@tcs.com',
        password: samplePassword,
        first_name: 'John',
        last_name: 'Doe',
        user_type: 'employee',
        organization_id: organizations[0].id,
        job_title: 'Senior Software Engineer',
        years_of_experience: 5,
        skills: ['JavaScript', 'React', 'Node.js', 'AWS'],
        location: 'Bangalore, India',
        is_verified: true,
        can_provide_referrals: true
      },
      {
        email: 'jane.smith@wipro.com',
        password: samplePassword,
        first_name: 'Jane',
        last_name: 'Smith',
        user_type: 'employee',
        organization_id: organizations[1].id,
        job_title: 'Tech Lead',
        years_of_experience: 8,
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        location: 'Hyderabad, India',
        is_verified: true,
        can_provide_referrals: true
      },
      {
        email: 'mike.johnson@gmail.com',
        password: samplePassword,
        first_name: 'Mike',
        last_name: 'Johnson',
        user_type: 'fresher',
        years_of_experience: 0,
        skills: ['Java', 'Spring Boot', 'MySQL'],
        location: 'Pune, India',
        is_verified: true,
        can_provide_referrals: false
      }
    ]);

    console.log('Created sample users');
    console.log('\nSeeding completed successfully!');
    console.log('\nSample credentials:');
    console.log('Admin: admin@referralsystem.com / admin123');
    console.log('Employee: john.doe@tcs.com / password123');
    console.log('Fresher: mike.johnson@gmail.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
