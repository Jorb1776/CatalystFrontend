// src/pages/UserSettings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUri: string;
}

interface UserStatusResponse {
  id: number;
  username: string;
  role: string;
  twoFactorEnabled: boolean;
  defaultLocation?: string;
}

export default function UserSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  // Preferences State
  const [defaultLocation, setDefaultLocation] = useState('All');

  useEffect(() => {
    loadUserStatus();
  }, []);

  const loadUserStatus = async () => {
    try {
      const res = await axios.get<UserStatusResponse>('/api/users/me');
      setTwoFactorEnabled(res.data.twoFactorEnabled || false);
      setDefaultLocation(res.data.defaultLocation || 'All');
    } catch (err) {
      console.error('Failed to load user status', err);
    }
  };

  const handleLocationChange = async (newLocation: string) => {
    try {
      setLoading(true);
      await axios.put('/api/users/me/preferences', { defaultLocation: newLocation });
      setDefaultLocation(newLocation);
      // Also update session storage so it takes effect immediately
      sessionStorage.setItem('selectedLocation', newLocation);
      toast.success('Default location updated');
    } catch (err) {
      toast.error('Failed to update location preference');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      const res = await axios.post<TwoFactorSetupResponse>('/api/auth/2fa/setup');
      setTwoFactorSetupData(res.data);
      toast.success('2FA setup initiated. Scan the QR code with your authenticator app.');
    } catch (err) {
      toast.error('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast.error('Verification code must be 6 digits');
      return;
    }

    console.log('Attempting to enable 2FA with code:', verificationCode);

    try {
      setLoading(true);
      const res = await axios.post('/api/auth/2fa/enable', {
        code: verificationCode
      });
      console.log('2FA enable response:', res.data);
      toast.success('2FA enabled successfully');
      setTwoFactorEnabled(true);
      setTwoFactorSetupData(null);
      setVerificationCode('');
    } catch (err: any) {
      console.error('2FA enable error:', err.response?.data);
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/auth/2fa/disable', {
        password: disablePassword
      });
      toast.success('2FA disabled');
      setTwoFactorEnabled(false);
      setDisablePassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 4 }}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>

      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mt: 3, mb: 4, color: '#0f0' }}>
        Account Settings
      </Typography>

      {/* Password Change Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: '#1a1a1a', color: '#fff' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#0f0' }}>
          Change Password
        </Typography>
        <Divider sx={{ mb: 3, borderColor: '#333' }} />

        <form onSubmit={handlePasswordChange}>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{ style: { color: '#fff' } }}
            InputLabelProps={{ style: { color: '#aaa' } }}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{ style: { color: '#fff' } }}
            InputLabelProps={{ style: { color: '#aaa' } }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
            InputProps={{ style: { color: '#fff' } }}
            InputLabelProps={{ style: { color: '#aaa' } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ fontWeight: 'bold' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </form>
      </Paper>

      {/* Location Preference Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: '#1a1a1a', color: '#fff' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#0f0' }}>
          Default Location
        </Typography>
        <Divider sx={{ mb: 3, borderColor: '#333' }} />

        <Typography variant="body1" sx={{ mb: 3, color: '#aaa' }}>
          Choose which location to load by default when you log in. This setting determines which work orders are shown on the floor dashboard.
        </Typography>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: '#aaa' }}>Default Location</InputLabel>
          <Select
            value={defaultLocation}
            label="Default Location"
            onChange={(e) => handleLocationChange(e.target.value)}
            disabled={loading}
            sx={{
              color: '#fff',
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0f0' },
              '.MuiSvgIcon-root': { color: '#0f0' }
            }}
          >
            <MenuItem value="All">All Locations</MenuItem>
            <MenuItem value="IN">Indiana (IN)</MenuItem>
            <MenuItem value="TN">Tennessee (TN)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Two-Factor Authentication Section */}
      <Paper elevation={3} sx={{ p: 4, bgcolor: '#1a1a1a', color: '#fff' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#0f0' }}>
          Two-Factor Authentication (2FA)
        </Typography>
        <Divider sx={{ mb: 3, borderColor: '#333' }} />

        {twoFactorEnabled ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Two-factor authentication is currently <strong>ENABLED</strong> for your account.
            </Alert>

            <Typography variant="body1" sx={{ mb: 3, color: '#aaa' }}>
              Your account is protected with two-factor authentication. To disable it, enter your password below.
            </Typography>

            <form onSubmit={handleDisable2FA}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{ style: { color: '#fff' } }}
                InputLabelProps={{ style: { color: '#aaa' } }}
              />
              <Button
                type="submit"
                variant="outlined"
                color="error"
                disabled={loading}
                sx={{ fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Disable 2FA'}
              </Button>
            </form>
          </Box>
        ) : (
          <Box>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Two-factor authentication is currently <strong>DISABLED</strong>. Enable it to add an extra layer of security.
            </Alert>

            {!twoFactorSetupData ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 3, color: '#aaa' }}>
                  Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSetup2FA}
                  disabled={loading}
                  sx={{ fontWeight: 'bold' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Setup 2FA'}
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0f0' }}>
                  Step 1: Scan QR Code
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#aaa' }}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </Typography>

                <Box sx={{
                  bgcolor: '#fff',
                  p: 3,
                  borderRadius: 2,
                  display: 'inline-block',
                  mb: 3
                }}>
                  <QRCodeSVG value={twoFactorSetupData.qrCodeUri} size={200} />
                </Box>

                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0f0' }}>
                  Step 2: Manual Entry (Optional)
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: '#aaa' }}>
                  If you can't scan the QR code, enter this code manually:
                </Typography>
                <Paper sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: '#2a2a2a',
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  color: '#0f0',
                  textAlign: 'center'
                }}>
                  {twoFactorSetupData.secret}
                </Paper>

                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0f0' }}>
                  Step 3: Verify
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#aaa' }}>
                  Enter the 6-digit code from your authenticator app to enable 2FA
                </Typography>

                <form onSubmit={handleEnable2FA}>
                  <TextField
                    fullWidth
                    label="6-Digit Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputProps={{ maxLength: 6 }}
                    sx={{ mb: 3 }}
                    InputProps={{ style: { color: '#fff', fontSize: '1.5rem', letterSpacing: '0.5rem' } }}
                    InputLabelProps={{ style: { color: '#aaa' } }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      disabled={loading || verificationCode.length !== 6}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Enable 2FA'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setTwoFactorSetupData(null);
                        setVerificationCode('');
                      }}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </form>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

const styles = {
  backBtn: {
    background: 'transparent',
    color: '#0f0',
    border: '1px solid #0f0',
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '15px'
  }
};
