// src/pages/ReleaseSchedule.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Material-UI
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TableSortLabel,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  CalendarToday as CalendarIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

const ReleaseSchedule = () => {
  const { currentUser } = useAuth();
  const [upcomingReleases, setUpcomingReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderBy, setOrderBy] = useState('releaseDate');
  const [orderDirection, setOrderDirection] = useState('asc');

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        if (currentUser) {
          const booksRef = collection(db, 'users', currentUser.uid, 'books');
          const q = query(booksRef, where('releaseSchedule.nextVolume', '!=', ''));
          const querySnapshot = await getDocs(q);
          
          const releases = [];
          querySnapshot.forEach((doc) => {
            const book = { id: doc.id, ...doc.data() };
            
            // 新刊情報がある場合のみ追加
            if (book.releaseSchedule && book.releaseSchedule.nextVolume) {
              releases.push({
                id: book.id,
                bookTitle: book.title,
                nextVolume: book.releaseSchedule.nextVolume,
                releaseDate: book.releaseSchedule.expectedReleaseDate || '',
                notificationEnabled: book.releaseSchedule.notificationEnabled || false,
                coverImage: book.coverImage,
                author: book.author
              });
            }
          });
          
          setUpcomingReleases(releases);
        }
      } catch (error) {
        console.error('新刊情報の取得エラー:', error);
        setError('新刊情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [currentUser]);

  // ソート処理
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // ソート関数
  const sortedReleases = [...upcomingReleases].sort((a, b) => {
    const aValue = a[orderBy] || '';
    const bValue = b[orderBy] || '';
    
    if (orderBy === 'releaseDate') {
      // 日付でソート
      const dateA = aValue ? new Date(aValue) : new Date(8640000000000000);
      const dateB = bValue ? new Date(bValue) : new Date(8640000000000000);
      
      return orderDirection === 'asc'
        ? dateA - dateB
        : dateB - dateA;
    } else {
      // 文字列でソート
      return orderDirection === 'asc'
        ? aValue.localeCompare(bValue, 'ja')
        : bValue.localeCompare(aValue, 'ja');
    }
  });

  // 日付のフォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '未設定';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // 発売日までの残り日数を計算
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    
    try {
      const releaseDate = new Date(dateString);
      const today = new Date();
      
      // 時間部分をリセットして日付だけで比較
      releaseDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = releaseDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (e) {
      return null;
    }
  };

  // 残り日数に基づいたステータスチップのプロパティを取得
  const getStatusChipProps = (daysRemaining) => {
    if (daysRemaining === null) {
      return { label: '日付未設定', color: 'default' };
    } else if (daysRemaining < 0) {
      return { label: '発売済み', color: 'default' };
    } else if (daysRemaining === 0) {
      return { label: '本日発売', color: 'success' };
    } else if (daysRemaining <= 7) {
      return { label: `あと${daysRemaining}日`, color: 'warning' };
    } else if (daysRemaining <= 30) {
      return { label: `あと${daysRemaining}日`, color: 'info' };
    } else {
      return { label: `あと${daysRemaining}日`, color: 'primary' };
    }
  };

  // 本日と今後7日以内に発売される本
  const comingSoonReleases = sortedReleases.filter((release) => {
    const days = getDaysRemaining(release.releaseDate);
    return days !== null && days >= 0 && days <= 7;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        新刊スケジュール
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          {/* 近日発売の本 */}
          {comingSoonReleases.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>近日発売</Typography>
              <Grid container spacing={2}>
                {comingSoonReleases.map((release) => {
                  const daysRemaining = getDaysRemaining(release.releaseDate);
                  const statusProps = getStatusChipProps(daysRemaining);
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={release.id}>
                      <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Chip
                              label={statusProps.label}
                              color={statusProps.color}
                              size="small"
                            />
                            {release.notificationEnabled ? (
                              <NotificationsIcon color="primary" fontSize="small" />
                            ) : (
                              <NotificationsOffIcon color="disabled" fontSize="small" />
                            )}
                          </Box>
                          
                          <Typography variant="h6" gutterBottom>
                            {release.nextVolume}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {release.bookTitle} の続刊
                          </Typography>
                          
                          <Typography variant="body2">
                            著者: {release.author}
                          </Typography>
                          
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {formatDate(release.releaseDate)}
                          </Typography>
                          
                          <Box sx={{ mt: 2 }}>
                            <Button
                              component={Link}
                              to={`/books/${release.id}`}
                              variant="outlined"
                              size="small"
                              endIcon={<LaunchIcon />}
                              fullWidth
                            >
                              詳細を見る
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
          
          {/* すべての新刊リスト */}
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'bookTitle'}
                      direction={orderBy === 'bookTitle' ? orderDirection : 'asc'}
                      onClick={() => handleRequestSort('bookTitle')}
                    >
                      元の本
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'nextVolume'}
                      direction={orderBy === 'nextVolume' ? orderDirection : 'asc'}
                      onClick={() => handleRequestSort('nextVolume')}
                    >
                      新刊タイトル
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'releaseDate'}
                      direction={orderBy === 'releaseDate' ? orderDirection : 'asc'}
                      onClick={() => handleRequestSort('releaseDate')}
                    >
                      発売予定日
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>通知</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedReleases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      登録された新刊情報はありません
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedReleases.map((release) => {
                    const daysRemaining = getDaysRemaining(release.releaseDate);
                    const statusProps = getStatusChipProps(daysRemaining);
                    
                    return (
                      <TableRow key={release.id}>
                        <TableCell>{release.bookTitle}</TableCell>
                        <TableCell>{release.nextVolume}</TableCell>
                        <TableCell>{formatDate(release.releaseDate)}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusProps.label}
                            color={statusProps.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={release.notificationEnabled ? '通知オン' : '通知オフ'}>
                            <IconButton size="small">
                              {release.notificationEnabled ? (
                                <NotificationsIcon color="primary" />
                              ) : (
                                <NotificationsOffIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Button
                            component={Link}
                            to={`/books/${release.id}`}
                            size="small"
                            variant="outlined"
                          >
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default ReleaseSchedule;