/**
 * Utility functions for job-related operations
 */

/**
 * Format experience level with year ranges
 * @param {string} level - Experience level (fresher, entry, mid, senior, lead)
 * @returns {string} Formatted experience level with years
 */
export const formatExperienceLevel = (level) => {
  const experienceLevels = {
    'fresher': 'Fresher (0 Yrs)',
    'entry': 'Entry Level (1-3 Yrs)',
    'mid': 'Mid Level (4-7 Yrs)',
    'senior': 'Senior (8-12 Yrs)',
    'lead': 'Lead (12+ Yrs)'
  };

  return experienceLevels[level?.toLowerCase()] || level;
};

/**
 * Get experience level options for dropdowns
 * @returns {Array} Array of experience level options
 */
export const getExperienceLevelOptions = () => [
  { value: 'fresher', label: 'Fresher (0 Yrs)' },
  { value: 'entry', label: 'Entry Level (1-3 Yrs)' },
  { value: 'mid', label: 'Mid Level (4-7 Yrs)' },
  { value: 'senior', label: 'Senior (8-12 Yrs)' },
  { value: 'lead', label: 'Lead (12+ Yrs)' }
];

/**
 * Format job type for display
 * @param {string} jobType - Job type (full-time, part-time, etc.)
 * @returns {string} Formatted job type
 */
export const formatJobType = (jobType) => {
  const jobTypes = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship',
    'freelance': 'Freelance'
  };

  return jobTypes[jobType?.toLowerCase()] || jobType;
};

/**
 * Format remote type for display
 * @param {string} remoteType - Remote type (on-site, remote, hybrid)
 * @returns {string} Formatted remote type
 */
export const formatRemoteType = (remoteType) => {
  const remoteTypes = {
    'on-site': 'On-site',
    'remote': 'Remote',
    'hybrid': 'Hybrid'
  };

  return remoteTypes[remoteType?.toLowerCase()] || remoteType;
};
