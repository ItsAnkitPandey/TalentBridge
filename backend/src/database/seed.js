const { User, Organization } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Create sample organizations - Comprehensive list of IT companies
    const organizations = await Organization.bulkCreate([
      // Big Tech (FAANG+)
      {
        name: 'Google',
        slug: 'google',
        description: 'Google LLC - Leading technology company specializing in Internet services',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Mountain View, CA, USA',
        website: 'https://www.google.com',
        is_verified: true
      },
      {
        name: 'Microsoft',
        slug: 'microsoft',
        description: 'Microsoft Corporation - Global leader in software, services, and solutions',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Redmond, WA, USA',
        website: 'https://www.microsoft.com',
        is_verified: true
      },
      {
        name: 'Amazon',
        slug: 'amazon',
        description: 'Amazon.com Inc - E-commerce and cloud computing leader',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Seattle, WA, USA',
        website: 'https://www.amazon.com',
        is_verified: true
      },
      {
        name: 'Apple',
        slug: 'apple',
        description: 'Apple Inc - Leading consumer electronics and software company',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Cupertino, CA, USA',
        website: 'https://www.apple.com',
        is_verified: true
      },
      {
        name: 'Meta',
        slug: 'meta',
        description: 'Meta Platforms Inc (Facebook) - Social media and technology company',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Menlo Park, CA, USA',
        website: 'https://www.meta.com',
        is_verified: true
      },
      {
        name: 'Netflix',
        slug: 'netflix',
        description: 'Netflix Inc - Streaming entertainment service',
        industry: 'Entertainment',
        company_size: '1000+',
        headquarters: 'Los Gatos, CA, USA',
        website: 'https://www.netflix.com',
        is_verified: true
      },
      
      // Indian IT Services
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
        name: 'HCL Technologies',
        slug: 'hcl',
        description: 'HCL Technologies - IT services and consulting',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Noida, India',
        website: 'https://www.hcltech.com',
        is_verified: true
      },
      {
        name: 'Tech Mahindra',
        slug: 'tech-mahindra',
        description: 'Tech Mahindra - Digital transformation and consulting',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Pune, India',
        website: 'https://www.techmahindra.com',
        is_verified: true
      },
      {
        name: 'LTI Mindtree',
        slug: 'lti-mindtree',
        description: 'LTIMindtree - Global technology consulting and services',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Mumbai, India',
        website: 'https://www.ltimindtree.com',
        is_verified: true
      },
      {
        name: 'Mphasis',
        slug: 'mphasis',
        description: 'Mphasis - IT services and solutions provider',
        industry: 'IT Services',
        company_size: '1000+',
        headquarters: 'Bangalore, India',
        website: 'https://www.mphasis.com',
        is_verified: true
      },
      
      // Global Consulting
      {
        name: 'Accenture',
        slug: 'accenture',
        description: 'Accenture - Global professional services company',
        industry: 'Consulting',
        company_size: '1000+',
        headquarters: 'Dublin, Ireland',
        website: 'https://www.accenture.com',
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
        name: 'Deloitte',
        slug: 'deloitte',
        description: 'Deloitte - Professional services network',
        industry: 'Consulting',
        company_size: '1000+',
        headquarters: 'London, UK',
        website: 'https://www.deloitte.com',
        is_verified: true
      },
      {
        name: 'PwC',
        slug: 'pwc',
        description: 'PricewaterhouseCoopers - Professional services firm',
        industry: 'Consulting',
        company_size: '1000+',
        headquarters: 'London, UK',
        website: 'https://www.pwc.com',
        is_verified: true
      },
      {
        name: 'EY',
        slug: 'ey',
        description: 'Ernst & Young - Professional services organization',
        industry: 'Consulting',
        company_size: '1000+',
        headquarters: 'London, UK',
        website: 'https://www.ey.com',
        is_verified: true
      },
      {
        name: 'Capgemini',
        slug: 'capgemini',
        description: 'Capgemini - Global consulting and technology services',
        industry: 'Consulting',
        company_size: '1000+',
        headquarters: 'Paris, France',
        website: 'https://www.capgemini.com',
        is_verified: true
      },
      {
        name: 'IBM',
        slug: 'ibm',
        description: 'IBM - International Business Machines Corporation',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Armonk, NY, USA',
        website: 'https://www.ibm.com',
        is_verified: true
      },
      
      // Enterprise Software
      {
        name: 'Oracle',
        slug: 'oracle',
        description: 'Oracle Corporation - Database software and cloud solutions',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'Austin, TX, USA',
        website: 'https://www.oracle.com',
        is_verified: true
      },
      {
        name: 'SAP',
        slug: 'sap',
        description: 'SAP SE - Enterprise software and solutions',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'Walldorf, Germany',
        website: 'https://www.sap.com',
        is_verified: true
      },
      {
        name: 'Salesforce',
        slug: 'salesforce',
        description: 'Salesforce - Cloud-based CRM platform',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'San Francisco, CA, USA',
        website: 'https://www.salesforce.com',
        is_verified: true
      },
      {
        name: 'Adobe',
        slug: 'adobe',
        description: 'Adobe Inc - Creative software and digital experiences',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'San Jose, CA, USA',
        website: 'https://www.adobe.com',
        is_verified: true
      },
      {
        name: 'ServiceNow',
        slug: 'servicenow',
        description: 'ServiceNow - Digital workflow solutions',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'Santa Clara, CA, USA',
        website: 'https://www.servicenow.com',
        is_verified: true
      },
      {
        name: 'Workday',
        slug: 'workday',
        description: 'Workday Inc - Enterprise cloud applications',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'Pleasanton, CA, USA',
        website: 'https://www.workday.com',
        is_verified: true
      },
      
      // Semiconductor & Hardware
      {
        name: 'Intel',
        slug: 'intel',
        description: 'Intel Corporation - Semiconductor chip manufacturer',
        industry: 'Hardware',
        company_size: '1000+',
        headquarters: 'Santa Clara, CA, USA',
        website: 'https://www.intel.com',
        is_verified: true
      },
      {
        name: 'NVIDIA',
        slug: 'nvidia',
        description: 'NVIDIA Corporation - Graphics and AI computing',
        industry: 'Hardware',
        company_size: '1000+',
        headquarters: 'Santa Clara, CA, USA',
        website: 'https://www.nvidia.com',
        is_verified: true
      },
      {
        name: 'AMD',
        slug: 'amd',
        description: 'Advanced Micro Devices - Semiconductor company',
        industry: 'Hardware',
        company_size: '1000+',
        headquarters: 'Santa Clara, CA, USA',
        website: 'https://www.amd.com',
        is_verified: true
      },
      {
        name: 'Qualcomm',
        slug: 'qualcomm',
        description: 'Qualcomm - Wireless technology and semiconductors',
        industry: 'Hardware',
        company_size: '1000+',
        headquarters: 'San Diego, CA, USA',
        website: 'https://www.qualcomm.com',
        is_verified: true
      },
      
      // E-commerce & Payments
      {
        name: 'Flipkart',
        slug: 'flipkart',
        description: 'Flipkart - E-commerce marketplace',
        industry: 'E-commerce',
        company_size: '1000+',
        headquarters: 'Bangalore, India',
        website: 'https://www.flipkart.com',
        is_verified: true
      },
      {
        name: 'PayTM',
        slug: 'paytm',
        description: 'Paytm - Digital payments and financial services',
        industry: 'Fintech',
        company_size: '1000+',
        headquarters: 'Noida, India',
        website: 'https://www.paytm.com',
        is_verified: true
      },
      {
        name: 'PhonePe',
        slug: 'phonepe',
        description: 'PhonePe - Digital payments platform',
        industry: 'Fintech',
        company_size: '1000+',
        headquarters: 'Bangalore, India',
        website: 'https://www.phonepe.com',
        is_verified: true
      },
      {
        name: 'Razorpay',
        slug: 'razorpay',
        description: 'Razorpay - Payment gateway solutions',
        industry: 'Fintech',
        company_size: '500-1000',
        headquarters: 'Bangalore, India',
        website: 'https://www.razorpay.com',
        is_verified: true
      },
      
      // Ride-sharing & Delivery
      {
        name: 'Uber',
        slug: 'uber',
        description: 'Uber Technologies - Ride-sharing and food delivery',
        industry: 'Transportation',
        company_size: '1000+',
        headquarters: 'San Francisco, CA, USA',
        website: 'https://www.uber.com',
        is_verified: true
      },
      {
        name: 'Ola',
        slug: 'ola',
        description: 'Ola Cabs - Ride-sharing platform',
        industry: 'Transportation',
        company_size: '1000+',
        headquarters: 'Bangalore, India',
        website: 'https://www.olacabs.com',
        is_verified: true
      },
      {
        name: 'Swiggy',
        slug: 'swiggy',
        description: 'Swiggy - Food delivery platform',
        industry: 'Food Delivery',
        company_size: '1000+',
        headquarters: 'Bangalore, India',
        website: 'https://www.swiggy.com',
        is_verified: true
      },
      {
        name: 'Zomato',
        slug: 'zomato',
        description: 'Zomato - Restaurant discovery and food delivery',
        industry: 'Food Delivery',
        company_size: '1000+',
        headquarters: 'Gurugram, India',
        website: 'https://www.zomato.com',
        is_verified: true
      },
      
      // Tech Companies
      {
        name: 'Cisco',
        slug: 'cisco',
        description: 'Cisco Systems - Networking hardware and software',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'San Jose, CA, USA',
        website: 'https://www.cisco.com',
        is_verified: true
      },
      {
        name: 'VMware',
        slug: 'vmware',
        description: 'VMware Inc - Cloud computing and virtualization',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Palo Alto, CA, USA',
        website: 'https://www.vmware.com',
        is_verified: true
      },
      {
        name: 'Dell Technologies',
        slug: 'dell',
        description: 'Dell Technologies - Computer technology and services',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Round Rock, TX, USA',
        website: 'https://www.dell.com',
        is_verified: true
      },
      {
        name: 'HP',
        slug: 'hp',
        description: 'HP Inc - Personal computing and printing',
        industry: 'Technology',
        company_size: '1000+',
        headquarters: 'Palo Alto, CA, USA',
        website: 'https://www.hp.com',
        is_verified: true
      },
      {
        name: 'Atlassian',
        slug: 'atlassian',
        description: 'Atlassian - Software development and collaboration tools',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'Sydney, Australia',
        website: 'https://www.atlassian.com',
        is_verified: true
      },
      {
        name: 'Slack',
        slug: 'slack',
        description: 'Slack Technologies - Business communication platform',
        industry: 'Software',
        company_size: '500-1000',
        headquarters: 'San Francisco, CA, USA',
        website: 'https://www.slack.com',
        is_verified: true
      },
      {
        name: 'Zoom',
        slug: 'zoom',
        description: 'Zoom Video Communications - Video conferencing platform',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'San Jose, CA, USA',
        website: 'https://www.zoom.us',
        is_verified: true
      },
      {
        name: 'Freshworks',
        slug: 'freshworks',
        description: 'Freshworks - Customer engagement software',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'San Mateo, CA, USA',
        website: 'https://www.freshworks.com',
        is_verified: true
      },
      {
        name: 'Zoho',
        slug: 'zoho',
        description: 'Zoho Corporation - Business software suite',
        industry: 'Software',
        company_size: '1000+',
        headquarters: 'Chennai, India',
        website: 'https://www.zoho.com',
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
