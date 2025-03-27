// src/pages/SeriesList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  where
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Material-UI
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Divider,
  LinearProgress,
  Paper,
  CardActionArea,
  CardActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Book as BookIcon,
  CollectionsBookmark as SeriesIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

const SeriesList = () => {
  const [series, setSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // シリーズのリストを取得
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        if (currentUser) {
          const seriesRef = collection(db, 'users', currentUser.uid, 'series');
          const q = query(seriesRef, orderBy('title'));
          const querySnapshot = await getDocs(q);
          
          const seriesList = [];
          querySnapshot.forEach((doc) => {
            seriesList.push({ id: doc.id, ...doc.data() });
          });
          
          setSeries(seriesList);
          setFilteredSeries(seriesList);
        }
      } catch (error) {
        console.error('Error fetching series:', error);
        setError('シリーズの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [currentUser]);

  // 検索機能
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSeries(series);
    } else {
      const filtered = series.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.categories?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredSeries(filtered);
    }
  }, [series, searchTerm]);

  // 進捗率を計算
  const calculateProgress = (seriesItem) => {
    if (!seriesItem.bookCount || seriesItem.bookCount === 0) return 0;
    return (seriesItem.books?.length || 0) / seriesItem.bookCount * 100;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>読み込み中...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <SeriesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          シリーズ一覧
        </Typography>
        <Button
          component={Link}
          to="/series/add"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          シリーズを追加
        </Button>
      </Box>

      {/* 検索 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          label="検索"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          placeholder="タイトル、著者、カテゴリーで検索"
        />
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {/* シリーズリスト */}
      {filteredSeries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            シリーズが見つかりません
          </Typography>
          <Typography color="text.secondary">
            {searchTerm ? '検索条件に一致するシリーズがありません' : 'シリーズをまだ追加していません'}
          </Typography>
          <Button
            component={Link}
            to="/series/add"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
          >
            シリーズを追加
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSeries.map((seriesItem) => (
            <Grid item xs={12} sm={6} md={4} key={seriesItem.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea component={Link} to={`/series/${seriesItem.id}`}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={seriesItem.coverImage || 'https://via.placeholder.com/400x200?text=No+Cover'}
                    alt={seriesItem.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {seriesItem.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {seriesItem.author}
                    </Typography>
                    
                    {/* 収集進捗 */}
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          収集進捗
                        </Typography>
                        <Typography variant="body2">
                          {seriesItem.books?.length || 0} / {seriesItem.bookCount || '?'}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateProgress(seriesItem)} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    {/* カテゴリー */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {seriesItem.categories?.slice(0, 3).map((category, index) => (
                        <Chip
                          key={index}
                          label={category}
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {seriesItem.categories?.length > 3 && (
                        <Chip
                          label={`+${seriesItem.categories.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    component={Link} 
                    to={`/series/${seriesItem.id}`}
                  >
                    詳細を見る
                  </Button>
                  {seriesItem.completeStatus ? (
                    <Chip 
                      label="コンプリート" 
                      size="small" 
                      color="success" 
                      sx={{ ml: 'auto' }} 
                    />
                  ) : (
                    <Chip 
                      label="収集中" 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 'auto' }} 
                    />
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default SeriesList;