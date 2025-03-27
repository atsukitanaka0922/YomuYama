// src/pages/BulkAddBooks.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { searchBooksByTitle, searchBooksByAuthor } from '../api/googleBooksApi';

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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardMedia,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Tooltip,
  ListItemAvatar,
  Avatar,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  BookmarkAdd as BookmarkAddIcon,
  Create as CreateIcon,
  Check as CheckIcon,
  Sort as SortIcon
} from '@mui/icons-material';

const BulkAddBooks = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allSeries, setAllSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [createNewSeries, setCreateNewSeries] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('unread');
  const [sortOrder, setSortOrder] = useState('newest'); // デフォルトで発売順

  // シリーズ一覧を取得
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        if (!currentUser) return;
        
        const seriesRef = collection(db, 'users', currentUser.uid, 'series');
        const q = query(seriesRef);
        const querySnapshot = await getDocs(q);
        
        const seriesList = [];
        querySnapshot.forEach((doc) => {
          seriesList.push({ id: doc.id, ...doc.data() });
        });
        
        setAllSeries(seriesList);
      } catch (error) {
        console.error('シリーズの取得エラー:', error);
      }
    };

    fetchSeries();
  }, [currentUser]);

  // ステップの定義
  const steps = ['本を検索', '詳細設定', '確認と保存'];

  // sortOrderの状態変更ハンドラを追加
  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value);
  };

  // 本の検索
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('検索キーワードを入力してください');
      return;
    }

    setSearchLoading(true);
    setError('');
    
    try {
      let results;
      
      if (searchType === 'title') {
        results = await searchBooksByTitle(searchTerm, 20, sortOrder);
      } else {
        results = await searchBooksByAuthor(searchTerm, 20, sortOrder);
      }
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('検索結果が見つかりませんでした');
      }
    } catch (error) {
      console.error('検索エラー:', error);
      setError('検索中にエラーが発生しました');
    } finally {
      setSearchLoading(false);
    }
  };

  // 本の選択/選択解除
  const toggleBookSelection = (book) => {
    setSelectedBooks(prev => {
      const isSelected = prev.some(b => b.id === book.id);
      
      if (isSelected) {
        return prev.filter(b => b.id !== book.id);
      } else {
        return [...prev, { 
          ...book,
          status: defaultStatus, // デフォルトのステータス
          notes: '', // 空のメモ
          categories: book.categories || [] // カテゴリーの初期化
        }];
      }
    });
  };

  // 選択した本のステータス変更
  const handleStatusChange = (bookId, newStatus) => {
    setSelectedBooks(prev => 
      prev.map(book => 
        book.id === bookId 
          ? { ...book, status: newStatus } 
          : book
      )
    );
  };

  // 選択した本のメモ変更
  const handleNotesChange = (bookId, notes) => {
    setSelectedBooks(prev => 
      prev.map(book => 
        book.id === bookId 
          ? { ...book, notes } 
          : book
      )
    );
  };

  // 全ての選択した本のステータス一括変更
  const handleBulkStatusChange = (newStatus) => {
    setSelectedBooks(prev => 
      prev.map(book => ({ ...book, status: newStatus }))
    );
    setDefaultStatus(newStatus);
  };

  // 選択した本を削除
  const handleRemoveBook = (bookId) => {
    setSelectedBooks(prev => prev.filter(book => book.id !== bookId));
  };

  // 次のステップへ
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // 前のステップへ
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // 本の一括登録
  const handleSubmit = async () => {
    if (selectedBooks.length === 0) {
      setError('登録する本を選択してください');
      return;
    }

    if (createNewSeries && !newSeriesTitle.trim()) {
      setError('新しいシリーズ名を入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessCount(0);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      let seriesId = selectedSeries;
      
      // 新しいシリーズを作成
      if (createNewSeries && newSeriesTitle) {
        const firstAuthor = selectedBooks[0]?.authors?.[0] || '';
        
        const seriesData = {
          title: newSeriesTitle,
          author: firstAuthor,
          description: '',
          coverImage: selectedBooks[0]?.coverImage || '',
          categories: [],
          books: [], // 本のIDは後で追加
          bookCount: selectedBooks.length,
          completeStatus: false,
          createdAt: serverTimestamp(),
          addedDate: today,
          lastModified: today
        };
        
        const seriesDocRef = await addDoc(collection(db, 'users', currentUser.uid, 'series'), seriesData);
        seriesId = seriesDocRef.id;
      }
      
      // 本をFirestoreに追加
      const bookIds = [];
      let count = 0;
      
      for (const book of selectedBooks) {
        const bookData = {
          title: book.title,
          author: book.authors?.join(', ') || '',
          isbn: book.isbn13 || book.isbn10 || '',
          publisher: book.publisher || '',
          publishedDate: book.publishedDate ? book.publishedDate.substring(0, 10) : '',
          status: book.status || 'unread',
          coverImage: book.coverImage || '',
          notes: book.notes || '',
          categories: book.categories || [],
          description: book.description || '',
          language: book.language || '',
          pageCount: book.pageCount?.toString() || '',
          addedDate: today,
          lastModified: today,
          createdAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'books'), bookData);
        bookIds.push(docRef.id);
        count++;
      }
      
      // 選択したシリーズに本を追加
      if (seriesId) {
        const seriesRef = doc(db, 'users', currentUser.uid, 'series', seriesId);
        const seriesSnap = await getDoc(seriesRef);
        
        if (seriesSnap.exists()) {
          const currentBooks = seriesSnap.data().books || [];
          
          await updateDoc(seriesRef, {
            books: [...currentBooks, ...bookIds],
            lastModified: today
          });
        }
      }
      
      setSuccessCount(count);
      setSuccess(true);
      
      // 成功メッセージを表示した後、リダイレクト
      setTimeout(() => {
        if (createNewSeries && seriesId) {
          navigate(`/series/${seriesId}`);
        } else {
          navigate('/books');
        }
      }, 2000);
      
    } catch (error) {
      console.error('本の一括追加エラー:', error);
      setError('本の登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索結果から既に選択済みの本かどうかを確認
  const isBookSelected = (bookId) => {
    return selectedBooks.some(book => book.id === bookId);
  };

  // Enterキーでの検索対応
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/books')}
        >
          本の一覧に戻る
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <BookmarkAddIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
          本をまとめて追加
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* ステップ1: 本を検索 */}
        {activeStep === 0 && (
          <>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="タイトルまたは著者名で検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    InputProps={{
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>検索タイプ</InputLabel>
                    <Select
                      value={searchType}
                      label="検索タイプ"
                      onChange={(e) => setSearchType(e.target.value)}
                    >
                      <MenuItem value="title">タイトル</MenuItem>
                      <MenuItem value="author">著者</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>並び順</InputLabel>
                    <Select
                      value={sortOrder}
                      label="並び順"
                      onChange={handleSortOrderChange}
                      startAdornment={<SortIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="newest">発売日順</MenuItem>
                      <MenuItem value="relevance">関連度順</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={searchLoading}
                    fullWidth
                  >
                    {searchLoading ? <CircularProgress size={24} /> : '検索'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            {/* 検索結果 */}
            <Box sx={{ mb: 3 }}>
              {searchLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : searchResults.length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      検索結果 ({searchResults.length}件)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      選択中: {selectedBooks.length}冊
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {searchResults.map((book) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            border: isBookSelected(book.id) ? '2px solid #1976d2' : 'none',
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="180"
                            image={book.coverImage || 'https://via.placeholder.com/180x250?text=No+Cover'}
                            alt={book.title}
                            sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div" noWrap>
                              {book.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {book.authors?.join(', ') || '著者不明'}
                            </Typography>
                            {book.publishedDate && (
                              <Typography variant="body2" color="text.secondary">
                                出版: {book.publishedDate}
                              </Typography>
                            )}
                          </CardContent>
                          <Box sx={{ p: 1, pt: 0 }}>
                            <Button
                              fullWidth
                              variant={isBookSelected(book.id) ? "contained" : "outlined"}
                              color={isBookSelected(book.id) ? "primary" : "inherit"}
                              onClick={() => toggleBookSelection(book)}
                              startIcon={isBookSelected(book.id) ? <CheckIcon /> : <AddIcon />}
                            >
                              {isBookSelected(book.id) ? '選択中' : '選択する'}
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? '検索結果が見つかりませんでした' : '本を検索してください'}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="text"
                disabled
              >
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={selectedBooks.length === 0}
              >
                次へ ({selectedBooks.length}冊選択中)
              </Button>
            </Box>
          </>
        )}

        {/* ステップ2: 詳細設定 */}
        {activeStep === 1 && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                選択した本の設定
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    一括設定
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>デフォルトのステータス</InputLabel>
                    <Select
                      value={defaultStatus}
                      label="デフォルトのステータス"
                      onChange={(e) => handleBulkStatusChange(e.target.value)}
                    >
                      <MenuItem value="unread">未読</MenuItem>
                      <MenuItem value="reading">読書中</MenuItem>
                      <MenuItem value="completed">完読</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>シリーズ設定</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={createNewSeries}
                          onChange={(e) => setCreateNewSeries(e.target.checked)}
                        />
                      }
                      label="新しいシリーズを作成"
                      sx={{ mb: 2, display: 'block' }}
                    />
                    
                    {createNewSeries ? (
                      <TextField
                        fullWidth
                        label="新しいシリーズ名"
                        value={newSeriesTitle}
                        onChange={(e) => setNewSeriesTitle(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                    ) : (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>シリーズに追加 (オプション)</InputLabel>
                        <Select
                          value={selectedSeries}
                          label="シリーズに追加 (オプション)"
                          onChange={(e) => setSelectedSeries(e.target.value)}
                        >
                          <MenuItem value="">選択しない</MenuItem>
                          {allSeries.map((series) => (
                            <MenuItem key={series.id} value={series.id}>
                              {series.title}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>
                個別設定 ({selectedBooks.length}冊)
              </Typography>
              
              <List sx={{ bgcolor: 'background.paper' }}>
                {selectedBooks.map((book, index) => (
                  <React.Fragment key={book.id}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={8}>
                            <Typography>{book.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {book.authors?.join(', ') || '著者不明'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                                <Select
                                  value={book.status}
                                  onChange={(e) => handleStatusChange(book.id, e.target.value)}
                                  variant="outlined"
                                  size="small"
                                >
                                  <MenuItem value="unread">未読</MenuItem>
                                  <MenuItem value="reading">読書中</MenuItem>
                                  <MenuItem value="completed">完読</MenuItem>
                                </Select>
                              </FormControl>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => handleRemoveBook(book.id)}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        </Grid>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          fullWidth
                          label="メモ"
                          multiline
                          rows={2}
                          value={book.notes || ''}
                          onChange={(e) => handleNotesChange(book.id, e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                      </AccordionDetails>
                    </Accordion>
                  </React.Fragment>
                ))}
              </List>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={selectedBooks.length === 0}
              >
                次へ
              </Button>
            </Box>
          </>
        )}

        {/* ステップ3: 確認と保存 */}
        {activeStep === 2 && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                登録内容の確認
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      登録する本
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {selectedBooks.length}冊
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      基本設定
                    </Typography>
                    <Typography variant="body1">
                      デフォルトステータス: {
                        {
                          'unread': '未読',
                          'reading': '読書中',
                          'completed': '完読'
                        }[defaultStatus]
                      }
                    </Typography>
                    
                    {createNewSeries ? (
                      <Typography variant="body1">
                        新しいシリーズ: {newSeriesTitle}
                      </Typography>
                    ) : selectedSeries ? (
                      <Typography variant="body1">
                        追加先シリーズ: {allSeries.find(s => s.id === selectedSeries)?.title || '不明'}
                      </Typography>
                    ) : (
                      <Typography variant="body1">
                        シリーズ: 追加しない
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  登録する本のリスト
                </Typography>
                
                <List sx={{ bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto' }}>
                  {selectedBooks.map((book, index) => (
                    <React.Fragment key={book.id}>
                      <ListItem>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={8}>
                            <Typography variant="body1">{book.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {book.authors?.join(', ') || '著者不明'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Chip
                              label={{
                                unread: '未読',
                                reading: '読書中',
                                completed: '完読'
                              }[book.status] || '未設定'}
                              size="small"
                              color={{
                                unread: 'error',
                                reading: 'warning',
                                completed: 'success'
                              }[book.status] || 'default'}
                            />
                          </Grid>
                        </Grid>
                      </ListItem>
                      {index < selectedBooks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading || selectedBooks.length === 0}
              >
                {loading ? <CircularProgress size={24} /> : '登録する'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
      
      {/* 成功メッセージ */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {successCount}冊の本を登録しました
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BulkAddBooks;