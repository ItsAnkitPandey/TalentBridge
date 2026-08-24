import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import { FiX, FiAlertTriangle, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

/**
 * Confirm Dialog Component
 * Reusable confirmation dialog with different severity levels
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'info', // 'success', 'error', 'warning', 'info'
  loading = false,
}) => {
  const getIcon = () => {
    switch (severity) {
      case 'success':
        return <FiCheckCircle size={48} style={{ color: '#10b981' }} />;
      case 'error':
        return <FiAlertTriangle size={48} style={{ color: '#ef4444' }} />;
      case 'warning':
        return <FiAlertTriangle size={48} style={{ color: '#f59e0b' }} />;
      default:
        return <FiHelpCircle size={48} style={{ color: '#3b82f6' }} />;
    }
  };

  const getColor = () => {
    switch (severity) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.3 }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <DialogTitle sx={{ p: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              {title}
            </DialogTitle>
            <IconButton
              onClick={onClose}
              disabled={loading}
              sx={{ color: 'text.secondary' }}
            >
              <FiX />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ mt: 0.5 }}>{getIcon()}</Box>
              <DialogContentText sx={{ flex: 1, color: 'text.primary', fontSize: '0.95rem' }}>
                {message}
              </DialogContentText>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 0, mt: 3, gap: 1 }}>
            <Button
              onClick={onClose}
              disabled={loading}
              variant="outlined"
              sx={{ borderRadius: 2, px: 3 }}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              variant="contained"
              color={getColor()}
              sx={{
                borderRadius: 2,
                px: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {loading ? 'Processing...' : confirmText}
            </Button>
          </DialogActions>
        </Box>
      </motion.div>
    </Dialog>
  );
};

export default ConfirmDialog;
