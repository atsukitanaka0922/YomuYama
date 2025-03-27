// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material-UI
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // メールでログイン
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/books');
    } catch (error) {
      console.error('ログインエラー:', error);
      
      if (error.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError('ログインに失敗しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  // Googleでログイン
  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/books');
    } catch (error) {
      console.error('Googleログインエラー:', error);
      setError('Googleログインに失敗しました。もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          ログイン
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleEmailLogin}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'ログイン'}
              </Button>
            </Grid>
          </Grid>
        </form>
        
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              パスワードをお忘れですか？
            </Typography>
          </Link>
        </Box>
        
        <Divider sx={{ my: 3 }}>または</Divider>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          Googleでログイン
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            アカウントをお持ちでない場合は{' '}
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography component="span" variant="body2" color="primary">
                新規登録
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;