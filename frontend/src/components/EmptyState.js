import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { FiInbox, FiSearch, FiAlertCircle, FiBriefcase } from 'react-icons/fi';

/**
 * Empty State Component
 * Displays when there's no data to show
 */
const EmptyState = ({
  icon: CustomIcon,
  title = 'No data found',
  message = 'There\'s nothing here yet',
  actionText,
  onAction,
  iconType = 'default', // 'default', 'search', 'error', 'jobs'
}) => {
  const getDefaultIcon = () => {
    switch (iconType) {
      case 'search':
        return FiSearch;
      case 'error':
        return FiAlertCircle;
      case 'jobs':
        return FiBriefcase;
      default:
        return FiInbox;
    }
  };

  const Icon = CustomIcon || getDefaultIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 3,
          textAlign: 'center',
        }}
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Box
            sx={{
              mb: 3,
              p: 3,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'inline-flex',
            }}
          >
            <Icon size={64} style={{ color: '#9ca3af' }} />
          </Box>
        </motion.div>

        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: 3,
            maxWidth: 400,
          }}
        >
          {message}
        </Typography>

        {actionText && onAction && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              onClick={onAction}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              }}
            >
              {actionText}
            </Button>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export default EmptyState;
