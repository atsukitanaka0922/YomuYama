// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { SentimentVeryDissatisfied as SadIcon, Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 4 }}>
          <SadIcon sx={{ fontSize: 100, color: 'text.secondary' }} />
        </Box>
        <Typography variant="h2" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          ページが見つかりません
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          お探しのページは存在しないか、移動した可能性があります。
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          startIcon={<HomeIcon />}
          size="large"
          sx={{ mt: 2 }}
        >
          ホームに戻る
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound;