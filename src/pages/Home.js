// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material-UI
import {
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  useTheme
} from '@mui/material';
import {
  LibraryBooks as LibraryIcon,
  NotificationsActive as NotificationsIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Login as LoginIcon,
  AppRegistration as RegisterIcon
} from '@mui/icons-material';

const Home = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();

  // 機能カード
  const features = [
    {
      title: '本を簡単に管理',
      description: '手持ちの本を登録し、読書の進捗状況を管理できます。',
      icon: <LibraryIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main
    },
    {
      title: '新刊の通知',
      description: '次巻の発売日を設定して、リリース日が近づくと通知を受け取れます。',
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main
    },
    {
      title: '検索とフィルター',
      description: 'タイトル、著者、カテゴリーなどで素早く本を検索できます。',
      icon: <SearchIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.info.main
    },
    {
      title: '柔軟なソート機能',
      description: 'あいうえお順、追加日、読書状態など様々な方法で並び替えが可能です。',
      icon: <SortIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main
    }
  ];

  return (
    <>
      {/* ヒーローセクション */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                YomuYama
              </Typography>
              <Typography variant="h5" paragraph>
                読まない本の山から読み切った本の山へ...
              </Typography>
              {currentUser ? (
                <Button
                  component={Link}
                  to="/books"
                  variant="contained"
                  color="secondary"
                  size="large"
                  sx={{ mt: 2 }}
                >
                  本の一覧を見る
                </Button>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    color="secondary"
                    size="large"
                    sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
                    startIcon={<LoginIcon />}
                  >
                    ログイン
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="outlined"
                    color="inherit"
                    size="large"
                    startIcon={<RegisterIcon />}
                  >
                    新規登録
                  </Button>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  minHeight: 400
                }}
              >
                <Box
                  component="img"
                  src="/images/book-library.jpg"
                  alt="本棚のイメージ"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    // 画像が読み込めない場合はフォールバック
                    e.target.src = 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 機能紹介 */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          主な機能
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          paragraph
          sx={{ mb: 6 }}
        >
          「YomuYama」は読書好きのために作られた、シンプルで使いやすいアプリです。
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    p: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: 'grey.100'
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'white',
                      borderRadius: '50%',
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: feature.color,
                      boxShadow: 1
                    }}
                  >
                    {feature.icon}
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3" align="center">
                    {feature.title}
                  </Typography>
                  <Typography align="center">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA セクション */}
      <Box
        sx={{
          bgcolor: 'grey.100',
          py: 6,
          mb: 4
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" align="center" gutterBottom>
            本の山を積み始めましょう
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" paragraph>
            無料でどこからでもアクセスできます。PCでもスマホでも使える便利なツールです。
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            {currentUser ? (
              <Button
                component={Link}
                to="/books/add"
                variant="contained"
                color="primary"
                size="large"
              >
                本を追加する
              </Button>
            ) : (
              <Button
                component={Link}
                to="/register"
                variant="contained"
                color="primary"
                size="large"
              >
                無料で始める
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* フッター */}
      <Box component="footer" sx={{ bgcolor: 'grey.200', py: 3 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} YomuYama
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default Home;