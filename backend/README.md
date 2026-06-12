# Employee Referral System - Backend

Backend API for the Employee Referral System built with Node.js, Express, and PostgreSQL.

## Features

- **RESTful API** with Express.js
- **PostgreSQL** database with Sequelize ORM
- **JWT & OAuth Authentication** (Google, LinkedIn)
- **Automated Job Scraping** with Puppeteer & Cheerio
- **Cron Jobs** for scheduled tasks
- **Request Validation** with Express Validator
- **Logging** with Winston
- **Security** with bcrypt password hashing

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_referral_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret
```

## Database Setup

```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/linkedin` - LinkedIn OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Jobs
- `GET /api/jobs` - Get all jobs (supports filtering)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create new job (Auth required)
- `PUT /api/jobs/:id` - Update job (Auth required)
- `DELETE /api/jobs/:id` - Delete job (Auth required)

### Referrals
- `POST /api/referrals/request` - Request referral (Auth required)
- `GET /api/referrals/requests` - Get referral requests (Auth required)
- `GET /api/referrals/my-requests` - Get my requests (Auth required)
- `GET /api/referrals/provided` - Get provided referrals (Auth required)
- `PUT /api/referrals/:id/accept` - Accept referral (Auth required)
- `PUT /api/referrals/:id/reject` - Reject referral (Auth required)

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile (Auth required)

### Connections
- `POST /api/connections/follow/:userId` - Follow user (Auth required)
- `DELETE /api/connections/unfollow/:userId` - Unfollow user (Auth required)
- `GET /api/connections/followers/:userId` - Get followers
- `GET /api/connections/following/:userId` - Get following

### Organizations
- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization details
- `POST /api/organizations` - Create organization (Admin only)
- `PUT /api/organizations/:id` - Update organization (Admin only)

## Job Scraper

The job scraper runs automatically every day at 6:00 AM. To run manually:

```bash
npm run scrape-jobs
```

### Supported Sources
- LinkedIn (requires API access)
- Naukri.com
- Indeed
- Glassdoor (requires API access)

### Adding New Scrapers

1. Add scraper function in `src/jobs/scraper.js`
2. Add organization keywords
3. Test the scraper

```javascript
async scrapeNewSource(keyword) {
  // Your scraping logic
  return jobs;
}
```

## Database Models

### User
- Authentication and profile information
- Skills, experience, and location
- Referral statistics

### Organization
- Company information
- Industry and size
- Career page URLs

### Job
- Job details and requirements
- Salary information
- Skills required
- Application tracking

### Referral
- Request and response tracking
- Status management
- Referrer notes

### Connection
- User following system
- Network building

### Application
- Job applications
- Status tracking
- Resume management

## Middleware

### Authentication (`auth.middleware.js`)
- `protect` - Verify JWT token
- `admin` - Check admin privileges
- `canProvideReferrals` - Check referral permission

### Validation (`validation.middleware.js`)
- `validateRegister` - Registration validation
- `validateLogin` - Login validation
- `validateJob` - Job creation validation
- `validateReferralRequest` - Referral request validation

## Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## Testing

```bash
npm test
```

## Deployment

### Environment Variables
Set all production environment variables on your hosting platform.

### Database Migration
```bash
npm run migrate
```

### Start Server
```bash
npm start
```

## Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Input validation on all endpoints
- CORS configured for frontend origin
- SQL injection prevention with Sequelize ORM

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### OAuth Errors
- Verify OAuth credentials
- Check redirect URIs
- Ensure consent screen is configured

### Scraping Issues
- Some sites require authentication
- Rate limiting may apply
- Consider using official APIs

## License

MIT
