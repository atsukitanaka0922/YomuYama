// src/components/BookTower.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Material-UI
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  BookmarkBorder as UnreadIcon,
  CheckCircleOutline as CompletedIcon,
  BarChart as StatisticsIcon,
  Height as HeightIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// アニメーション用
import { motion, AnimatePresence } from 'framer-motion';

const BookTower = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState({
    totalBooks: 0,
    unreadBooks: 0,
    readingBooks: 0,
    completedBooks: 0,
    unreadHeight: 0,
    completedHeight: 0,
    unreadPercentage: 0,
    completedPercentage: 0,
    totalPages: 0,
    completedPages: 0
  });
  
  // 平均的な本の厚さ (mm)
  const AVG_BOOK_THICKNESS = 20;

  // タブの切り替え
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // 本のリストを取得
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        if (!currentUser) return;
        
        const booksRef = collection(db, 'users', currentUser.uid, 'books');
        const q = query(booksRef);
        const querySnapshot = await getDocs(q);
        
        const bookList = [];
        querySnapshot.forEach((doc) => {
          bookList.push({ id: doc.id, ...doc.data() });
        });
        
        // 追加日順にソート
        bookList.sort((a, b) => {
          if (!a.addedDate) return 1;
          if (!b.addedDate) return -1;
          return new Date(b.addedDate) - new Date(a.addedDate);
        });
        
        setBooks(bookList);
        calculateStatistics(bookList);
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('本の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [currentUser]);
  
  // 統計情報の計算
  const calculateStatistics = (bookList) => {
    const totalBooks = bookList.length;
    const unreadBooks = bookList.filter(book => book.status === 'unread').length;
    const readingBooks = bookList.filter(book => book.status === 'reading').length;
    const completedBooks = bookList.filter(book => book.status === 'completed').length;
    
    // ページ数の集計
    let totalPages = 0;
    let completedPages = 0;
    
    bookList.forEach(book => {
      const pageCount = book.pageCount ? parseInt(book.pageCount, 10) : 0;
      if (pageCount > 0) {
        totalPages += pageCount;
        if (book.status === 'completed') {
          completedPages += pageCount;
        }
      }
    });
    
    // 積み上げた場合の高さ (cm)
    const unreadHeight = (unreadBooks * AVG_BOOK_THICKNESS) / 10;
    const completedHeight = (completedBooks * AVG_BOOK_THICKNESS) / 10;
    
    // 未読率と完読率
    const unreadPercentage = totalBooks > 0 ? (unreadBooks / totalBooks) * 100 : 0;
    const completedPercentage = totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0;
    
    setStatistics({
      totalBooks,
      unreadBooks,
      readingBooks,
      completedBooks,
      unreadHeight,
      completedHeight,
      unreadPercentage,
      completedPercentage,
      totalPages,
      completedPages
    });
  };
  
  // 本のアイテムコンポーネント
  const BookItem = ({ book, index, type }) => {
    const delay = index * 0.05;
    const color = type === 'unread' 
      ? theme.palette.error.main 
      : theme.palette.success.main;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay }}
        style={{ marginBottom: -15, zIndex: 1000 - index }}
        whileHover={{ scale: 1.05, zIndex: 2000 }}
      >
        <Tooltip title={`${book.title} - ${book.author || '著者不明'}`}>
          <Box
            sx={{
              height: 25,
              width: isMobile ? 120 : 180,
              bgcolor: color,
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '4px',
              boxShadow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              px: 1,
              fontSize: isMobile ? '0.7rem' : '0.8rem'
            }}
            onClick={() => navigate(`/books/${book.id}`)}
          >
            {book.title}
          </Box>
        </Tooltip>
      </motion.div>
    );
  };
  
  // 本のタワー表示
  const renderBookTower = (type) => {
    const filteredBooks = books.filter(book => 
      type === 'unread' ? book.status === 'unread' : book.status === 'completed'
    );
    
    const towerHeight = filteredBooks.length > 0 ? filteredBooks.length * 10 + 20 : 50;
    
    return (
      <Box sx={{ position: 'relative' }}>
        <Box 
          sx={{ 
            height: towerHeight, 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column-reverse',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: '20px',
              bgcolor: 'grey.300',
              borderRadius: '4px',
              zIndex: 0
            }}
          />
          
          <AnimatePresence>
            {filteredBooks.slice(0, 50).map((book, index) => (
              <BookItem 
                key={book.id} 
                book={book} 
                index={filteredBooks.length - index} 
                type={type}
              />
            ))}
          </AnimatePresence>
        </Box>
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color={type === 'unread' ? 'error' : 'success'}>
            {type === 'unread' ? '積読タワー' : '完読タワー'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeightIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography>
              {type === 'unread' 
                ? `${statistics.unreadHeight.toFixed(1)}cm (${statistics.unreadBooks}冊)` 
                : `${statistics.completedHeight.toFixed(1)}cm (${statistics.completedBooks}冊)`}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };
  
  // 統計データの表示
  const renderStatistics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              読書進捗状況
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">未読</Typography>
                <Typography variant="body2">
                  {statistics.unreadBooks}冊 ({statistics.unreadPercentage.toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={statistics.unreadPercentage} 
                color="error"
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">読書中</Typography>
                <Typography variant="body2">
                  {statistics.readingBooks}冊 ({(statistics.readingBooks / statistics.totalBooks * 100).toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(statistics.readingBooks / statistics.totalBooks * 100)}
                color="warning"
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">完読</Typography>
                <Typography variant="body2">
                  {statistics.completedBooks}冊 ({statistics.completedPercentage.toFixed(1)}%)
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={statistics.completedPercentage}
                color="success"
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              読書の高さで見る
            </Typography>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {(statistics.unreadHeight + statistics.completedHeight).toFixed(1)} cm
              </Typography>
              <Typography variant="body2" color="text.secondary">
                すべての本を積み上げた高さ
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography color="error">
                  {statistics.unreadHeight.toFixed(1)} cm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  積読の高さ
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography color="success">
                  {statistics.completedHeight.toFixed(1)} cm
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  完読の高さ
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                平均的な本の厚さを{AVG_BOOK_THICKNESS}mmと仮定
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              読んだページ数
            </Typography>
            {statistics.totalPages > 0 ? (
              <>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="primary">
                    {statistics.completedPages.toLocaleString()} / {statistics.totalPages.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    読了ページ数 / 全ページ数
                  </Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">読了率</Typography>
                    <Typography variant="body2">
                      {(statistics.completedPages / statistics.totalPages * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(statistics.completedPages / statistics.totalPages * 100)}
                    color="primary"
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography color="text.secondary">
                  ページ数情報がある本が登録されていません
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <MenuBookIcon sx={{ mr: 1, verticalAlign: 'top' }} />
          読書タワー
        </Typography>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ mb: 3 }}
        >
          <Tab icon={<UnreadIcon />} label="積読タワー" />
          <Tab icon={<CompletedIcon />} label="完読タワー" />
          <Tab icon={<StatisticsIcon />} label="統計情報" />
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        ) : (
          <>
            {activeTab === 0 && renderBookTower('unread')}
            {activeTab === 1 && renderBookTower('completed')}
            {activeTab === 2 && renderStatistics()}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default BookTower;