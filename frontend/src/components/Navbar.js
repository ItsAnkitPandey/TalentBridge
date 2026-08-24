import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AccountCircle, 
  People, 
  PersonAdd, 
  Menu as MenuIcon,
  Work,
  Assignment,
  PostAdd,
  AdminPanelSettings,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleMobileNavigate = (path) => {
    navigate(path);
    handleMobileMenuClose();
  };

  // Mobile Drawer Content
  const mobileMenuContent = (
    <Box sx={{ width: 280, pt: 2 }} role="presentation">
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          TalentBridge
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {user.first_name} {user.last_name}
          </Typography>
        )}
      </Box>
      <Divider />
      <List>
        <ListItem button onClick={() => handleMobileNavigate('/jobs')}>
          <ListItemIcon><Work color="primary" /></ListItemIcon>
          <ListItemText primary="Jobs" />
        </ListItem>
        <ListItem button onClick={() => handleMobileNavigate('/users')}>
          <ListItemIcon><People color="primary" /></ListItemIcon>
          <ListItemText primary="Find Referrers" />
        </ListItem>
        
        {user ? (
          <>
            {user.can_provide_referrals && (
              <ListItem button onClick={() => handleMobileNavigate('/referrals')}>
                <ListItemIcon><Assignment color="primary" /></ListItemIcon>
                <ListItemText primary="Referral Requests" />
              </ListItem>
            )}
            <ListItem button onClick={() => handleMobileNavigate('/my-referrals')}>
              <ListItemIcon><Assignment color="primary" /></ListItemIcon>
              <ListItemText primary="My Referrals" />
            </ListItem>
            <ListItem button onClick={() => handleMobileNavigate('/jobs/post')}>
              <ListItemIcon><PostAdd color="primary" /></ListItemIcon>
              <ListItemText primary="Post Job" />
            </ListItem>
            {user.user_type === 'admin' && (
              <ListItem button onClick={() => handleMobileNavigate('/admin')}>
                <ListItemIcon><AdminPanelSettings color="warning" /></ListItemIcon>
                <ListItemText primary="Admin Dashboard" />
              </ListItem>
            )}
            <Divider sx={{ my: 1 }} />
            <ListItem button onClick={() => handleMobileNavigate('/profile')}>
              <ListItemIcon><Person color="primary" /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem button onClick={() => handleMobileNavigate('/login')}>
              <ListItemIcon><LoginIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem button onClick={() => handleMobileNavigate('/register')}>
              <ListItemIcon><PersonAdd color="primary" /></ListItemIcon>
              <ListItemText primary="Register" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Toolbar sx={{ justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          {/* Mobile Menu Icon */}
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo & Title Container - Centered on Mobile */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: isMobile ? 0 : 1,
              position: isMobile ? 'absolute' : 'relative',
              left: isMobile ? '50%' : 'auto',
              transform: isMobile ? 'translateX(-50%)' : 'none',
            }}
          >
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Box
                component={Link}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  mr: 1
                }}
              >
                <img 
                  src="/favicon.svg" 
                  alt="TalentBridge Logo" 
                  style={{ 
                    width: isMobile ? '32px' : '40px', 
                    height: isMobile ? '32px' : '40px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }} 
                />
              </Box>
            </motion.div>

            {/* Title */}
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 700,
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              TalentBridge
            </Typography>
          </Box>

          {/* Spacer for mobile to balance layout */}
          {isMobile && <Box sx={{ width: 48 }} />}

          {/* Desktop Menu */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  color="inherit"
                  component={Link}
                  to="/jobs"
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Jobs
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  color="inherit"
                  component={Link}
                  to="/users"
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  <People sx={{ mr: 1 }} />
                  Find Referrers
                </Button>
              </motion.div>

              {user ? (
                <>
                  {user.can_provide_referrals && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        color="inherit"
                        component={Link}
                        to="/referrals"
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          transition: 'all 0.3s',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        Referral Requests
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/my-referrals"
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      My Referrals
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/jobs/post"
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Post Job
                    </Button>
                  </motion.div>
                  {user.user_type === 'admin' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        color="inherit"
                        component={Link}
                        to="/admin"
                        sx={{
                          borderRadius: 2,
                          px: 2,
                          bgcolor: 'rgba(255,215,0,0.2)',
                          transition: 'all 0.3s',
                          '&:hover': {
                            bgcolor: 'rgba(255,215,0,0.3)'
                          }
                        }}
                      >
                        Admin Dashboard
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton
                      size="large"
                      aria-label="account of current user"
                      aria-controls="menu-appbar"
                      aria-haspopup="true"
                      onClick={handleMenu}
                      color="inherit"
                      sx={{
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      <AccountCircle />
                    </IconButton>
                  </motion.div>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/login"
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Login
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/register"
                      startIcon={<PersonAdd />}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.2)'
                        }
                      }}
                    >
                      Register
                    </Button>
                  </motion.div>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
      >
        {mobileMenuContent}
      </Drawer>
    </>
  );
};

export default Navbar;
