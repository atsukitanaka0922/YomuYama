// src/components/BookSearch.js
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { searchBooksByTitle, searchBooksByAuthor, fetchBookByISBN, ApiSource } from '../api/bookApiClient';

// タブパネル用のコンポーネント
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BookSearch = ({ open, onClose, onSelectBook }) => {
  const [tabValue, setTabValue] = useState(0);
  const [titleSearch, setTitleSearch] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [isbnSearch, setIsbnSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // デフォルトで発売順
  const [apiSource, setApiSource] = useState(ApiSource.BOTH); // API選択のための状態

  // タブ変更ハンドラ
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchResults([]);
    setError('');
  };

  // ソート順変更ハンドラ
  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // APIソース変更ハンドラ
  const handleApiSourceChange = (event) => {
    setApiSource(event.target.value);
  };

  // タイトル検索
  const handleTitleSearch = async () => {
    if (!titleSearch.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const results = await searchBooksByTitle(titleSearch, 20, sortOrder, apiSource);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('検索結果が見つかりませんでした');
      }
    } catch (error) {
      console.error('検索エラー:', error);
      setError('検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 著者検索
  const handleAuthorSearch = async () => {
    if (!authorSearch.trim()) {
      setError('著者名を入力してください');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const results = await searchBooksByAuthor(authorSearch, 20, sortOrder, apiSource);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('検索結果が見つかりませんでした');
      }
    } catch (error) {
      console.error('検索エラー:', error);
      setError('検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // ISBN検索
  const handleIsbnSearch = async () => {
    if (!isbnSearch.trim()) {
      setError('ISBNを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // 両方のAPIソースから検索（ISBNは一意なので両方から検索しても問題ない）
      const result = await fetchBookByISBN(isbnSearch, apiSource);
      
      if (result) {
        setSearchResults([result]);
      } else {
        setSearchResults([]);
        setError('指定されたISBNの本が見つかりませんでした');
      }
    } catch (error) {
      console.error('検索エラー:', error);
      setError('検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 本を選択するハンドラ
  const handleSelectBook = (book) => {
    onSelectBook(book);
    onClose();
  };

  // 検索キーワードをクリア
  const clearSearch = () => {
    if (tabValue === 0) {
      setTitleSearch('');
    } else if (tabValue === 1) {
      setAuthorSearch('');
    } else {
      setIsbnSearch('');
    }
    setSearchResults([]);
    setError('');
  };

  // Enterキーで検索
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (tabValue === 0) {
        handleTitleSearch();
      } else if (tabValue === 1) {
        handleAuthorSearch();
      } else {
        handleIsbnSearch();
      }
    }
  };

  // 発売日のフォーマット
  const formatPublishedDate = (dateStr) => {
    if (!dateStr) return '不明';
    
    // YYYY-MM-DD, YYYY-MM, YYYYの形式に対応
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[0]}年${parts[1]}月${parts[2]}日`;
    } else if (parts.length === 2) {
      return `${parts[0]}年${parts[1]}月`;
    } else {
      return `${parts[0]}年`;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>本を検索</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ mb: 2 }}
        >
          <Tab label="タイトルで検索" />
          <Tab label="著者で検索" />
          <Tab label="ISBNで検索" />
        </Tabs>

        {/* APIソース選択 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
            <InputLabel id="api-source-label">検索ソース</InputLabel>
            <Select
              labelId="api-source-label"
              value={apiSource}
              label="検索ソース"
              onChange={handleApiSourceChange}
            >
              <MenuItem value={ApiSource.BOTH}>両方</MenuItem>
              <MenuItem value={ApiSource.GOOGLE_BOOKS}>Google Books</MenuItem>
              <MenuItem value={ApiSource.RAKUTEN_BOOKS}>楽天ブックス</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-order-label">並び順</InputLabel>
            <Select
              labelId="sort-order-label"
              value={sortOrder}
              label="並び順"
              onChange={handleSortChange}
              disabled={tabValue === 2} // ISBN検索では並び順無効
              startAdornment={<SortIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="newest">発売日順（新しい順）</MenuItem>
              <MenuItem value="relevance">関連度順</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* タイトル検索パネル */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              label="本のタイトル"
              variant="outlined"
              fullWidth
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: titleSearch && (
                  <InputAdornment position="end">
                    <IconButton onClick={clearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleTitleSearch}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : <SearchIcon />}
            </Button>
          </Box>
        </TabPanel>

        {/* 著者検索パネル */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              label="著者名"
              variant="outlined"
              fullWidth
              value={authorSearch}
              onChange={(e) => setAuthorSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: authorSearch && (
                  <InputAdornment position="end">
                    <IconButton onClick={clearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAuthorSearch}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : <SearchIcon />}
            </Button>
          </Box>
        </TabPanel>

        {/* ISBN検索パネル */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              label="ISBN (10桁または13桁)"
              variant="outlined"
              fullWidth
              value={isbnSearch}
              onChange={(e) => setIsbnSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: isbnSearch && (
                  <InputAdornment position="end">
                    <IconButton onClick={clearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleIsbnSearch}
              disabled={loading}
              sx={{ ml: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : <SearchIcon />}
            </Button>
          </Box>
        </TabPanel>
        
        {/* エラーメッセージ */}
        {error && (
          <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {/* 検索結果表示 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          searchResults.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                検索結果 ({searchResults.length} 件)
              </Typography>
              <List>
                {searchResults.map((book, index) => (
                  <React.Fragment key={book.id || index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={3} md={2}>
                          <Card sx={{ height: '100%' }}>
                            <CardMedia
                              component="img"
                              image={book.coverImage || 'https://via.placeholder.com/128x192?text=No+Cover'}
                              alt={book.title}
                              sx={{ height: 150, objectFit: 'contain' }}
                            />
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={9} md={10}>
                          <CardContent sx={{ p: 0 }}>
                            <Typography variant="h6" gutterBottom>
                              {book.title}
                              {book.subtitle && ` - ${book.subtitle}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              著者: {book.authors?.join(', ') || '不明'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              出版社: {book.publisher || '不明'} 
                              {book.publishedDate && ` (${formatPublishedDate(book.publishedDate)})`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              ISBN: {book.isbn13 || book.isbn10 || '不明'}
                            </Typography>
                            {/* APIソースを表示 */}
                            <Chip 
                              size="small" 
                              label={book.apiSource === 'google' ? 'Google' : '楽天'} 
                              color={book.apiSource === 'google' ? 'primary' : 'secondary'}
                              sx={{ mt: 0.5, mb: 1, fontSize: '0.7rem' }}
                            />
                            {book.description && (
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {book.description}
                              </Typography>
                            )}
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleSelectBook(book)}
                              sx={{ mt: 2 }}
                            >
                              選択
                            </Button>
                          </CardContent>
                        </Grid>
                      </Grid>
                    </ListItem>
                    {index < searchResults.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookSearch;