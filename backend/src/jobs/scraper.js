const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { Job, Organization } = require('../models');
const logger = require('../utils/logger');

class JobScraper {
  constructor() {
    this.sources = [
      { name: 'LinkedIn', scraper: this.scrapeLinkedIn },
      { name: 'Naukri', scraper: this.scrapeNaukri },
      { name: 'Indeed', scraper: this.scrapeIndeed },
      { name: 'Glassdoor', scraper: this.scrapeGlassdoor }
    ];
  }

  /**
   * Main scraper function - scrapes all sources
   */
  async scrapeAllJobs() {
    logger.info('Starting job scraping from all sources...');
    
    const organizations = [
      { name: 'TCS', keywords: ['tcs', 'tata consultancy'] },
      { name: 'Wipro', keywords: ['wipro'] },
      { name: 'Cognizant', keywords: ['cognizant'] },
      { name: 'Infosys', keywords: ['infosys'] },
      { name: 'Accenture', keywords: ['accenture'] },
      { name: 'HCL', keywords: ['hcl technologies'] }
    ];

    for (const org of organizations) {
      try {
        logger.info(`Scraping jobs for ${org.name}...`);
        await this.scrapeOrganizationJobs(org);
      } catch (error) {
        logger.error(`Error scraping ${org.name}:`, error.message);
      }
    }

    logger.info('Job scraping completed');
  }

  /**
   * Scrape jobs for a specific organization
   */
  async scrapeOrganizationJobs(orgData) {
    // Get or create organization
    const [organization] = await Organization.findOrCreate({
      where: { name: orgData.name },
      defaults: {
        name: orgData.name,
        slug: orgData.name.toLowerCase().replace(/\s+/g, '-'),
        is_verified: true
      }
    });

    // Try each source
    const allJobs = [];
    
    try {
      const linkedInJobs = await this.scrapeLinkedIn(orgData.keywords[0]);
      allJobs.push(...linkedInJobs);
    } catch (error) {
      logger.error(`LinkedIn scraping failed for ${orgData.name}:`, error.message);
    }

    try {
      const naukriJobs = await this.scrapeNaukri(orgData.keywords[0]);
      allJobs.push(...naukriJobs);
    } catch (error) {
      logger.error(`Naukri scraping failed for ${orgData.name}:`, error.message);
    }

    // Save jobs to database
    for (const jobData of allJobs) {
      try {
        await this.saveJob(jobData, organization.id);
      } catch (error) {
        logger.error(`Error saving job:`, error.message);
      }
    }

    logger.info(`Scraped ${allJobs.length} jobs for ${orgData.name}`);
  }

  /**
   * Scrape jobs from LinkedIn
   * NOTE: LinkedIn has strict anti-scraping measures. 
   * Consider using LinkedIn's official API instead.
   */
  async scrapeLinkedIn(keyword) {
    logger.info(`Scraping LinkedIn for: ${keyword}`);
    
    // This is a placeholder implementation
    // In production, use LinkedIn's official API or authorized job boards
    const jobs = [];

    try {
      const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=India`;
      
      // For demonstration purposes - in production, use proper API
      // This requires authentication and proper headers
      logger.warn('LinkedIn scraping requires official API access');
      
      // Example structure of returned job data
      const exampleJobs = [
        {
          title: 'Software Engineer',
          description: 'Sample job description',
          location: 'Bangalore, India',
          experience_level: 'mid',
          job_type: 'full-time',
          remote_type: 'hybrid',
          required_skills: ['JavaScript', 'React', 'Node.js'],
          source: 'scraped-linkedin'
        }
      ];

      return exampleJobs;
    } catch (error) {
      logger.error('LinkedIn scraping error:', error.message);
      return [];
    }
  }

  /**
   * Scrape jobs from Naukri.com
   */
  async scrapeNaukri(keyword) {
    logger.info(`Scraping Naukri for: ${keyword}`);
    
    const jobs = [];

    try {
      // Note: Web scraping should comply with website's terms of service
      // Consider using official APIs where available
      
      const url = `https://www.naukri.com/${encodeURIComponent(keyword)}-jobs`;
      
      // For demonstration - use Puppeteer for dynamic content
      const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Add timeout and error handling
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for job listings to load
        await page.waitForSelector('.jobTuple', { timeout: 10000 });
        
        // Extract job data
        const scrapedJobs = await page.evaluate(() => {
          const jobElements = document.querySelectorAll('.jobTuple');
          const jobs = [];
          
          jobElements.forEach((element, index) => {
            if (index < 10) { // Limit to 10 jobs
              try {
                const title = element.querySelector('.title')?.textContent?.trim() || '';
                const company = element.querySelector('.companyInfo')?.textContent?.trim() || '';
                const location = element.querySelector('.location')?.textContent?.trim() || '';
                const experience = element.querySelector('.experience')?.textContent?.trim() || '';
                const description = element.querySelector('.job-description')?.textContent?.trim() || '';
                
                if (title) {
                  jobs.push({
                    title,
                    company,
                    location,
                    experience,
                    description: description || `Job opening for ${title}`
                  });
                }
              } catch (err) {
                console.error('Error parsing job:', err);
              }
            }
          });
          
          return jobs;
        });
        
        // Transform to our format
        scrapedJobs.forEach(job => {
          jobs.push({
            title: job.title,
            description: job.description,
            location: job.location || 'India',
            experience_level: this.mapExperienceLevel(job.experience),
            job_type: 'full-time',
            remote_type: 'on-site',
            required_skills: this.extractSkills(job.title + ' ' + job.description),
            source: 'scraped-naukri'
          });
        });
        
      } catch (pageError) {
        logger.error('Page loading error:', pageError.message);
      }
      
      await browser.close();
      
      logger.info(`Found ${jobs.length} jobs from Naukri`);
      return jobs;
      
    } catch (error) {
      logger.error('Naukri scraping error:', error.message);
      return [];
    }
  }

  /**
   * Scrape jobs from Indeed
   */
  async scrapeIndeed(keyword) {
    logger.info(`Scraping Indeed for: ${keyword}`);
    
    const jobs = [];

    try {
      const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=India`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      $('.job_seen_beacon').each((index, element) => {
        if (index < 10) { // Limit to 10 jobs
          try {
            const title = $(element).find('.jobTitle').text().trim();
            const company = $(element).find('.companyName').text().trim();
            const location = $(element).find('.companyLocation').text().trim();
            const description = $(element).find('.job-snippet').text().trim();
            
            if (title) {
              jobs.push({
                title,
                description: description || `Job opening for ${title} at ${company}`,
                location: location || 'India',
                experience_level: 'mid',
                job_type: 'full-time',
                remote_type: 'on-site',
                required_skills: this.extractSkills(title + ' ' + description),
                source: 'scraped-indeed'
              });
            }
          } catch (err) {
            logger.error('Error parsing Indeed job:', err.message);
          }
        }
      });

      logger.info(`Found ${jobs.length} jobs from Indeed`);
      return jobs;
      
    } catch (error) {
      logger.error('Indeed scraping error:', error.message);
      return [];
    }
  }

  /**
   * Scrape jobs from Glassdoor
   */
  async scrapeGlassdoor(keyword) {
    logger.info(`Scraping Glassdoor for: ${keyword}`);
    
    // Glassdoor requires authentication and has strict anti-scraping
    // Consider using their official API or partnerships
    logger.warn('Glassdoor scraping requires official API access');
    
    return [];
  }

  /**
   * Save job to database (avoid duplicates)
   */
  async saveJob(jobData, organizationId) {
    try {
      // Check for duplicates
      const existingJob = await Job.findOne({
        where: {
          title: jobData.title,
          organization_id: organizationId,
          location: jobData.location,
          is_active: true
        }
      });

      if (existingJob) {
        logger.debug(`Job already exists: ${jobData.title}`);
        return existingJob;
      }

      // Create new job
      const job = await Job.create({
        ...jobData,
        organization_id: organizationId,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      logger.info(`Saved job: ${job.title}`);
      return job;
      
    } catch (error) {
      logger.error('Error saving job:', error.message);
      throw error;
    }
  }

  /**
   * Map experience text to our enum values
   */
  mapExperienceLevel(experienceText) {
    if (!experienceText) return 'mid';
    
    const text = experienceText.toLowerCase();
    
    if (text.includes('fresher') || text.includes('0-1') || text.includes('0 - 1')) {
      return 'fresher';
    } else if (text.includes('entry') || text.match(/0[-\s]*[23]/)) {
      return 'entry';
    } else if (text.includes('senior') || text.match(/[78][-\s]*1[02]/)) {
      return 'senior';
    } else if (text.includes('lead') || text.includes('principal')) {
      return 'lead';
    } else {
      return 'mid';
    }
  }

  /**
   * Extract skills from text using simple keyword matching
   */
  extractSkills(text) {
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
      'Angular', 'Vue', 'SQL', 'MongoDB', 'AWS', 'Azure', 'Docker',
      'Kubernetes', 'Git', 'REST API', 'GraphQL', 'Machine Learning',
      'Data Science', 'DevOps', 'CI/CD', 'Agile', 'Scrum'
    ];

    const skills = [];
    const lowerText = text.toLowerCase();

    skillKeywords.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return skills.slice(0, 10); // Limit to 10 skills
  }
}

module.exports = new JobScraper();
