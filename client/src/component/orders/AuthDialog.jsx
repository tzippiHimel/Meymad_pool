import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import Login from '../user/Login';
import Register from '../user/Register';

const AuthDialog = ({ open, onClose, onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAuthSuccess = () => {
    onAuthSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" align="center">
          נדרשת הרשמה להשלמת ההזמנה
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab label="התחברות" />
            <Tab label="הרשמה" />
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? (
            <Login onLoginSuccess={handleAuthSuccess} />
          ) : (
            <Register onRegisterSuccess={handleAuthSuccess} />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          ביטול
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuthDialog; 