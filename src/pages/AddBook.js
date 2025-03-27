// src/pages/AddBook.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import BookSearch from '../components/BookSearch';

// Material-UI
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Clear as ClearIcon, 
  Search as SearchIcon 
} from '@mui/icons-material';

const AddBook = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);

  // フォームの状態
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishedDate: '',
    status: 'unread',
    coverImage: '',
    notes: '',
    categoryInput: '',
    categories: [],
    pageCount: '',
    language: '',
    description: '',
    releaseSchedule: {
      nextVolume: '',
      expectedReleaseDate: '',
      notificationEnabled: false,
    }
  });

  // 入力フィールドの変更ハンドラ
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // カテゴリーの追加
  const handleAddCategory = () => {
    if (formData.categoryInput && !formData.categories.includes(formData.categoryInput)) {
      setFormData({
        ...formData,
        categories: [...formData.categories, formData.categoryInput],
        categoryInput: '',
      });
    }
  };

  // カテゴリーの削除
  const handleDeleteCategory = (categoryToDelete) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter(category => category !== categoryToDelete),
    });
  };

  // 検索ダイアログを開く
  const handleOpenSearchDialog = () => {
    setOpenSearchDialog(true);
  };

  // 検索ダイアログを閉じる
  const handleCloseSearchDialog = () => {
    setOpenSearchDialog(false);
  };

  // 選択された本の情報をフォームに設定
  const handleSelectBook = (book) => {
    setFormData({
      ...formData,
      title: book.title,
      author: book.authors?.join(', ') || '',
      isbn: book.isbn13 || book.isbn10 || '',
      publisher: book.publisher || '',
      publishedDate: book.publishedDate ? book.publishedDate.substring(0, 10) : '',
      coverImage: book.coverImage || '',
      categories: book.categories || [],
      pageCount: book.pageCount?.toString() || '',
      language: book.language || '',
      description: book.description || '',
    });
  };

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author) {
      setError('タイトルと著者は必須です');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookData = {
        ...formData,
        addedDate: today,
        lastModified: today,
        releaseSchedule: {
          ...formData.releaseSchedule,
          notificationEnabled: Boolean(formData.releaseSchedule.notificationEnabled),
        },
        createdAt: serverTimestamp(),
      };
      
      // categoryInputはFirestoreに保存しない
      delete bookData.categoryInput;
      
      // Firestoreに追加
      await addDoc(collection(db, 'users', currentUser.uid, 'books'), bookData);
      
      setSuccess(true);
      // 成功メッセージを表示した後、リストページにリダイレクト
      setTimeout(() => {
        navigate('/books');
      }, 2000);
      
    } catch (error) {
      console.error('本の追加エラー:', error);
      setError('本の追加中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // フォームをリセット
  const handleReset = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      publishedDate: '',
      status: 'unread',
      coverImage: '',
      notes: '',
      categoryInput: '',
      categories: [],
      pageCount: '',
      language: '',
      description: '',
      releaseSchedule: {
        nextVolume: '',
        expectedReleaseDate: '',
        notificationEnabled: false,
      }
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          本を追加
        </Typography>
        
        {/* 検索ボタン */}
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleOpenSearchDialog}
          sx={{ mb: 3 }}
        >
          本を検索
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="タイトル"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="著者"
                name="author"
                value={formData.author}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ISBN"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="出版社"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="出版日"
                name="publishedDate"
                type="date"
                value={formData.publishedDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>読書状態</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="読書状態"
                  onChange={handleChange}
                >
                  <MenuItem value="unread">未読</MenuItem>
                  <MenuItem value="reading">読書中</MenuItem>
                  <MenuItem value="completed">完読</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="表紙画像URL"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
              />
            </Grid>
            
            {/* ページ数と言語 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ページ数"
                name="pageCount"
                type="number"
                value={formData.pageCount}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="言語"
                name="language"
                value={formData.language}
                onChange={handleChange}
              />
            </Grid>
            
            {/* カテゴリー */}
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2">カテゴリー</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="カテゴリーを追加"
                  value={formData.categoryInput}
                  name="categoryInput"
                  onChange={handleChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddCategory}
                  startIcon={<AddIcon />}
                >
                  追加
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.categories.map((category, index) => (
                  <Chip
                    key={index}
                    label={category}
                    onDelete={() => handleDeleteCategory(category)}
                  />
                ))}
              </Box>
            </Grid>
            
            {/* 説明 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="説明"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            
            {/* メモ */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="メモ"
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>
            
            {/* 新刊スケジュール情報 */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                新刊スケジュール
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="次巻タイトル"
                name="releaseSchedule.nextVolume"
                value={formData.releaseSchedule.nextVolume}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="発売予定日"
                name="releaseSchedule.expectedReleaseDate"
                type="date"
                value={formData.releaseSchedule.expectedReleaseDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>通知</InputLabel>
                <Select
                  name="releaseSchedule.notificationEnabled"
                  value={formData.releaseSchedule.notificationEnabled}
                  label="通知"
                  onChange={handleChange}
                >
                  <MenuItem value={true}>有効</MenuItem>
                  <MenuItem value={false}>無効</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ flexGrow: 1 }}
                >
                  {loading ? '保存中...' : '保存'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                >
                  リセット
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/books')}
                >
                  キャンセル
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
        
        {/* 検索ダイアログ */}
        <BookSearch
          open={openSearchDialog}
          onClose={handleCloseSearchDialog}
          onSelectBook={handleSelectBook}
        />
        
        {/* 成功メッセージ */}
        <Snackbar
          open={success}
          autoHideDuration={2000}
          onClose={() => setSuccess(false)}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            本が正常に追加されました！
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default AddBook;