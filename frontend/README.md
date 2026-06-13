# TalentBridge - Frontend

React frontend for the Employee Referral System with Material-UI.

## Features

- **Modern UI** with Material-UI components
- **Responsive Design** - Works on all devices
- **Context API** for state management
- **Protected Routes** - Secure user-specific pages
- **OAuth Integration** - Google & LinkedIn sign-in
- **Real-time Updates** - Live referral status
- **Advanced Filtering** - Search and filter jobs
- **Profile Management** - Customize your profile

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Update the API URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the App

```bash
# Development mode
npm start

# Production build
npm run build

# Run tests
npm test
```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable components
│   └── Navbar.js       # Navigation bar
├── pages/              # Page components
│   ├── Home.js         # Landing page
│   ├── Login.js        # Login page
│   ├── Register.js     # Registration page
│   ├── Jobs.js         # Job listings
│   ├── JobDetails.js   # Single job view
│   ├── PostJob.js      # Create job posting
│   ├── Referrals.js    # Referral requests (for referrers)
│   ├── MyReferrals.js  # User's referrals
│   ├── Profile.js      # User profile
│   └── Users.js        # Find referrers
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication context
├── services/           # API services
│   └── api.js          # API client
├── App.js              # Main app component
└── index.js            # Entry point
```

## Pages Overview

### Public Pages

#### Home (`/`)
- Landing page with features
- Statistics and CTAs
- Sign-up prompts

#### Login (`/login`)
- Email/password login
- Google OAuth
- LinkedIn OAuth

#### Register (`/register`)
- User registration form
- Organization selection
- Role selection (Employee/Fresher)

#### Jobs (`/jobs`)
- Browse all jobs
- Advanced filtering
- Search functionality

#### Job Details (`/jobs/:id`)
- Full job description
- Required skills
- Apply/Request referral

#### Users (`/users`)
- Find referrers
- Search by skills
- View profiles

### Protected Pages

#### Profile (`/profile`)
- Edit personal information
- Manage skills
- Update preferences
- View statistics

#### My Referrals (`/my-referrals`)
- Track requested referrals
- View provided referrals
- Status updates

#### Referral Requests (`/referrals`)
- View incoming requests
- Accept/reject referrals
- Manage responses
- *Only visible to users who can provide referrals*

#### Post Job (`/jobs/post`)
- Create job postings
- Add requirements
- Manage applications

## Components

### Navbar
- Responsive navigation
- User menu
- Authentication state

### Protected Routes
Routes that require authentication:
- `/profile`
- `/my-referrals`
- `/referrals`
- `/jobs/post`

## State Management

### AuthContext
Manages authentication state:
- `user` - Current user object
- `login(email, password)` - Login function
- `register(userData)` - Registration function
- `logout()` - Logout function
- `updateUser(user)` - Update user data

**Usage:**
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();
  // ...
}
```

## API Integration

### API Service (`services/api.js`)

**Jobs API:**
```javascript
import { jobsAPI } from '../services/api';

// Get all jobs
const jobs = await jobsAPI.getAll({ search: 'engineer' });

// Get single job
const job = await jobsAPI.getById(jobId);

// Create job
const newJob = await jobsAPI.create(jobData);
```

**Referrals API:**
```javascript
import { referralsAPI } from '../services/api';

// Request referral
await referralsAPI.createRequest({ job_id, message });

// Get my requests
const referrals = await referralsAPI.getMyRequests();

// Accept referral
await referralsAPI.accept(id, { response_message });
```

**Users API:**
```javascript
import { usersAPI } from '../services/api';

// Search users
const users = await usersAPI.search({ query: 'developer' });

// Update profile
await usersAPI.updateProfile(profileData);
```

## Styling

### Material-UI Theme
Customized theme in `index.js`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});
```

### Responsive Design
All components are responsive using Material-UI's grid system and breakpoints.

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Deployment

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### Static Hosting
Upload the `build/` folder to any static hosting service.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- Bundle size optimization
- Caching strategies

## Troubleshooting

### API Connection Issues
- Verify `REACT_APP_API_URL` is correct
- Check backend is running
- Verify CORS settings

### OAuth Not Working
- Check OAuth redirect URIs
- Verify credentials in backend
- Clear browser cookies

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Contributing

1. Follow the existing code structure
2. Use functional components with hooks
3. Follow Material-UI design patterns
4. Write tests for new features

## License

MIT
