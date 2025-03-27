// src/pages/AddSeries.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';
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
  Chip,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const AddSeries = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooks, setSelectedBooks] = useState([]);

  // フォームの状態
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    coverImage: '',
    categoryInput: '',
    categories: [],
    bookCount: '',
    completeStatus: false
  });

  // 本一覧を取得
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        if (!currentUser) return;
        
        const booksRef = collection(db, 'users', currentUser.uid, 'books');
        const q = query(booksRef);
        const querySnapshot = await getDocs(q);
        
        const booksData = [];
        querySnapshot.forEach((doc) => {
          booksData.push({ id: doc.id, ...doc.data() });
        });
        
        setAllBooks(booksData);
        setFilteredBooks(booksData);
      } catch (error) {
        console.error('Error fetching books:', error);
        setError('本の取得中にエラーが発生しました');
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [currentUser]);

  // 入力フィールドの変更ハンドラ
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // カテゴリーの追加
  const handleAddCategory = () => {
    if (formData.categoryInput && !formData.categories.includes(formData.categoryInput)) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, prev.categoryInput],
        categoryInput: ''
      }));
    }
  };

  // カテゴリーの削除
  const handleDeleteCategory = (categoryToDelete) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category !== categoryToDelete)
    }));
  };

  // 本の選択/選択解除
  const toggleBookSelection = (bookId) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  // 本の検索
  const handleSearchBooks = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === '') {
      setFilteredBooks(allBooks);
    } else {
      const filtered = allBooks.filter(
        book =>
          book.title.toLowerCase().includes(value.toLowerCase()) ||
          book.author.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  };

  // シリーズを追加
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('シリーズタイトルは必須です');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const seriesData = {
        ...formData,
        books: selectedBooks,
        createdAt: serverTimestamp(),
        addedDate: today,
        lastModified: today
      };
      
      // categoryInputはFirestoreに保存しない
      delete seriesData.categoryInput;
      
      // Firestoreに追加
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'series'), seriesData);
      
      setSuccess(true);
      // 成功メッセージを表示した後、詳細ページにリダイレクト
      setTimeout(() => {
        navigate(`/series/${docRef.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error adding series:', error);
      setError('シリーズの追加中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // フォームをリセット
  const handleReset = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      coverImage: '',
      categoryInput: '',
      categories: [],
      bookCount: '',
      completeStatus: false
    });
    setSelectedBooks([]);
  };

  // 自動的に著者を設定（選択された本があれば、最も頻度の高い著者を使用）
  useEffect(() => {
    if (selectedBooks.length > 0 && !formData.author) {
      const authorCounts = {};
      selectedBooks.forEach(bookId => {
        const book = allBooks.find(b => b.id === bookId);
        if (book && book.author) {
          authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
        }
      });
      
      // 最も頻度の高い著者を見つける
      let mostFrequentAuthor = '';
      let maxCount = 0;
      Object.entries(authorCounts).forEach(([author, count]) => {
        if (count > maxCount) {
          mostFrequentAuthor = author;
          maxCount = count;
        }
      });
      
      if (mostFrequentAuthor) {
        setFormData(prev => ({
          ...prev,
          author: mostFrequentAuthor
        }));
      }
    }
  }, [selectedBooks, allBooks, formData.author]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/series')}
        >
          シリーズ一覧に戻る
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          新しいシリーズを追加
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                シリーズ情報
              </Typography>
              
              <TextField
                required
                fullWidth
                label="シリーズタイトル"
                name="title"
                value={formData.title}
                onChange={handleChange}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="著者"
                name="author"
                value={formData.author}
                onChange={handleChange}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="説明"
                name="description"
                value={formData.description}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3}
              />
              
              <TextField
                fullWidth
                label="表紙画像URL"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                margin="normal"
              />
              
              <TextField
                label="全巻数"
                name="bookCount"
                type="number"
                value={formData.bookCount}
                onChange={handleChange}
                margin="normal"
                inputProps={{ min: 1 }}
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  カテゴリー
                </Typography>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <TextField
                    fullWidth
                    label="カテゴリーを追加"
                    name="categoryInput"
                    value={formData.categoryInput}
                    onChange={handleChange}
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddCategory}
                  >
                    追加
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {formData.categories.map((category, index) => (
                    <Chip
                      key={index}
                      label={category}
                      onDelete={() => handleDeleteCategory(category)}
                    />
                  ))}
                </Box>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.completeStatus}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      completeStatus: e.target.checked
                    }))}
                  />
                }
                label="シリーズのコレクションを完了"
                sx={{ mt: 2, display: 'block' }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                シリーズに追加する本
              </Typography>
              
              <TextField
                fullWidth
                label="本を検索"
                value={searchTerm}
                onChange={handleSearchBooks}
                margin="normal"
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              
              {loadingBooks ? (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                </Box>
              ) : allBooks.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  追加できる本がありません。まず本を登録してください。
                </Alert>
              ) : (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    選択した本: {selectedBooks.length}冊
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List dense>
                      {filteredBooks.map((book) => (
                        <ListItem
                          key={book.id}
                          button
                          onClick={() => toggleBookSelection(book.id)}
                        >
                          <ListItemAvatar>
                            <Avatar
                              variant="rounded"
                              src={book.coverImage || 'https://via.placeholder.com/40x60?text=No+Cover'}
                              alt={book.title}
                              sx={{ width: 40, height: 60 }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={book.title}
                            secondary={book.author}
                          />
                          <Checkbox
                            edge="end"
                            checked={selectedBooks.includes(book.id)}
                            tabIndex={-1}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={handleReset}
                  sx={{ mr: 1 }}
                >
                  リセット
                </Button>
                <Button
                  onClick={() => navigate('/series')}
                  sx={{ mr: 1 }}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? '保存中...' : 'シリーズを保存'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* 成功メッセージ */}
      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          シリーズが正常に追加されました！
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AddSeries;