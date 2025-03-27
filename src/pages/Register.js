// src/pages/Register.js
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

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // メールで新規登録
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !passwordConfirm) {
      setError('すべての項目を入力してください');
      return;
    }
    
    if (password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/books');
    } catch (error) {
      console.error('登録エラー:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (error.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません');
      } else if (error.code === 'auth/weak-password') {
        setError('パスワードが弱すぎます');
      } else {
        setError('アカウント作成に失敗しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  // Googleで新規登録
  const handleGoogleRegister = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/books');
    } catch (error) {
      console.error('Google登録エラー:', error);
      setError('Google登録に失敗しました。もう一度お試しください');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          新規登録
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleRegister}>
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
                autoComplete="new-password"
                helperText="6文字以上で入力してください"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="パスワード（確認）"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
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
                {loading ? <CircularProgress size={24} /> : '登録'}
              </Button>
            </Grid>
          </Grid>
        </form>
        
        <Divider sx={{ my: 3 }}>または</Divider>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleRegister}
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          Googleで登録
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            既にアカウントをお持ちの場合は{' '}
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography component="span" variant="body2" color="primary">
                ログイン
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;