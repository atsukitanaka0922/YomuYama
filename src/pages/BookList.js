// src/pages/BookList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { 
  Search as SearchIcon,
  SortByAlpha as SortIcon,
  Add as AddIcon,
  Bookmark as BookmarkIcon,
  MenuBook as ReadingIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const { currentUser } = useAuth();

  // ステータスごとのアイコン
  const statusIcons = {
    unread: <BookmarkIcon color="error" />,
    reading: <ReadingIcon color="warning" />,
    completed: <CompletedIcon color="success" />,
  };

  // 本のリストを取得
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        if (currentUser) {
          const bookRef = collection(db, 'users', currentUser.uid, 'books');
          const q = query(bookRef, orderBy(sortBy, sortOrder));
          const querySnapshot = await getDocs(q);
          
          const bookList = [];
          querySnapshot.forEach((doc) => {
            bookList.push({ id: doc.id, ...doc.data() });
          });
          
          setBooks(bookList);
          setFilteredBooks(bookList);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [currentUser, sortBy, sortOrder]);

  // 検索とフィルター
  useEffect(() => {
    let result = [...books];
    
    // 検索
    if (searchTerm) {
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // ステータスでフィルター
    if (statusFilter !== 'all') {
      result = result.filter((book) => book.status === statusFilter);
    }
    
    // ソート
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title, 'ja')
          : b.title.localeCompare(a.title, 'ja');
      } else if (sortBy === 'author') {
        return sortOrder === 'asc'
          ? a.author.localeCompare(b.author, 'ja')
          : b.author.localeCompare(a.author, 'ja');
      } else if (sortBy === 'addedDate') {
        return sortOrder === 'asc'
          ? new Date(a.addedDate) - new Date(b.addedDate)
          : new Date(b.addedDate) - new Date(a.addedDate);
      }
      return 0;
    });
    
    setFilteredBooks(result);
  }, [books, searchTerm, statusFilter, sortBy, sortOrder]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          本の一覧
        </Typography>
        <Button
          component={Link}
          to="/books/add"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          本を追加
        </Button>
      </Box>

      {/* 検索・フィルター・ソート */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="検索"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
          }}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />

        <FormControl size="small" sx={{ minWidth: '120px' }}>
          <InputLabel>ステータス</InputLabel>
          <Select
            value={statusFilter}
            label="ステータス"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">すべて</MenuItem>
            <MenuItem value="unread">未読</MenuItem>
            <MenuItem value="reading">読書中</MenuItem>
            <MenuItem value="completed">完読</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: '120px' }}>
          <InputLabel>並び順</InputLabel>
          <Select
            value={sortBy}
            label="並び順"
            onChange={(e) => setSortBy(e.target.value)}
            startAdornment={<SortIcon fontSize="small" sx={{ mr: 1 }} />}
          >
            <MenuItem value="title">タイトル</MenuItem>
            <MenuItem value="author">著者</MenuItem>
            <MenuItem value="addedDate">追加日</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          sx={{ minWidth: '100px' }}
        >
          {sortOrder === 'asc' ? '昇順' : '降順'}
        </Button>
      </Box>

      {/* 本のリスト */}
      {filteredBooks.length === 0 ? (
        <Typography>本が見つかりません。</Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredBooks.map((book) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={book.coverImage || 'https://via.placeholder.com/140x200?text=No+Cover'}
                  alt={book.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {book.author}
                    </Typography>
                    <IconButton size="small">
                      {statusIcons[book.status]}
                    </IconButton>
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {book.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {book.categories?.map((category, index) => (
                      <Chip key={index} label={category} size="small" />
                    ))}
                  </Box>
                  <Button
                    component={Link}
                    to={`/books/${book.id}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    詳細
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default BookList;