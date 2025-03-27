// src/pages/BookDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { fetchBookByISBN } from '../api/googleBooksApi';

// Material-UI
import {
  Container,
  Paper,
  Grid,
  Typography,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  Divider,
  Card,
  CardMedia,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Bookmark as BookmarkIcon,
  MenuBook as ReadingIcon,
  CheckCircle as CompletedIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  InfoOutlined as InfoIcon,
  Language as LanguageIcon
} from '@mui/icons-material';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [loadingAdditionalInfo, setLoadingAdditionalInfo] = useState(false);

  // 本の情報を取得
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const bookRef = doc(db, 'users', currentUser.uid, 'books', id);
        const docSnap = await getDoc(bookRef);
        
        if (docSnap.exists()) {
          const bookData = { id: docSnap.id, ...docSnap.data() };
          setBook(bookData);
          setStatus(bookData.status);
          
          // ISBNがある場合は追加情報を取得
          if (bookData.isbn) {
            fetchAdditionalInfo(bookData.isbn);
          }
        } else {
          setError('本が見つかりませんでした');
        }
      } catch (error) {
        console.error('本の取得エラー:', error);
        setError('本の情報取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchBook();
    }
  }, [id, currentUser]);

  // Google Books APIから追加情報を取得
  const fetchAdditionalInfo = async (isbn) => {
    setLoadingAdditionalInfo(true);
    
    try {
      const bookInfo = await fetchBookByISBN(isbn);
      if (bookInfo) {
        setAdditionalInfo(bookInfo);
      }
    } catch (error) {
      console.error('追加情報の取得エラー:', error);
      // エラーが発生しても表示には影響させない
    } finally {
      setLoadingAdditionalInfo(false);
    }
  };
  // ステータス変更
  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;
    setStatus(newStatus);
    
    try {
      const bookRef = doc(db, 'users', currentUser.uid, 'books', id);
      await updateDoc(bookRef, {
        status: newStatus,
        lastModified: new Date().toISOString().split('T')[0],
      });
      
      setSuccessMessage('読書状態が更新されました');
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      setError('ステータスの更新中にエラーが発生しました');
    }
  };

  // 通知設定の切り替え
  const toggleNotification = async () => {
    try {
      const bookRef = doc(db, 'users', currentUser.uid, 'books', id);
      const newNotificationState = !book.releaseSchedule?.notificationEnabled;
      
      await updateDoc(bookRef, {
        'releaseSchedule.notificationEnabled': newNotificationState,
        lastModified: new Date().toISOString().split('T')[0],
      });
      
      setBook({
        ...book,
        releaseSchedule: {
          ...book.releaseSchedule,
          notificationEnabled: newNotificationState,
        },
      });
      
      setSuccessMessage(
        newNotificationState ? '通知が有効になりました' : '通知が無効になりました'
      );
    } catch (error) {
      console.error('通知設定の変更エラー:', error);
      setError('通知設定の変更中にエラーが発生しました');
    }
  };

  // 本の削除
  const handleDelete = async () => {
    try {
      const bookRef = doc(db, 'users', currentUser.uid, 'books', id);
      await deleteDoc(bookRef);
      setOpenDialog(false);
      setSuccessMessage('本が削除されました');
      
      // 成功メッセージを表示した後、リストページにリダイレクト
      setTimeout(() => {
        navigate('/books');
      }, 1500);
    } catch (error) {
      console.error('本の削除エラー:', error);
      setError('本の削除中にエラーが発生しました');
      setOpenDialog(false);
    }
  };

  // 読み込み中
  if (loading) {
    return (
      <Container>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Container>
    );
  }

  // エラー発生時
  if (error && !book) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/books')}
          sx={{ mt: 2 }}
        >
          本の一覧に戻る
        </Button>
      </Container>
    );
  }

  // ステータスごとのアイコン
  const statusIcons = {
    unread: <BookmarkIcon />,
    reading: <ReadingIcon />,
    completed: <CompletedIcon />,
  };

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
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {book && (
        <>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/books')}
            sx={{ mb: 2 }}
          >
            本の一覧に戻る
          </Button>
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* 左側: 表紙と基本情報 */}
              <Grid item xs={12} md={4}>
                <Card elevation={2}>
                  <CardMedia
                    component="img"
                    image={book.coverImage || additionalInfo?.coverImage || 'https://via.placeholder.com/300x450?text=No+Cover'}
                    alt={book.title}
                    sx={{ height: 'auto', maxHeight: '450px', objectFit: 'contain' }}
                  />
                </Card>
                
                <Box sx={{ mt: 3 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>読書状態</InputLabel>
                    <Select
                      value={status}
                      label="読書状態"
                      onChange={handleStatusChange}
                      startAdornment={statusIcons[status]}
                    >
                      <MenuItem value="unread">未読</MenuItem>
                      <MenuItem value="reading">読書中</MenuItem>
                      <MenuItem value="completed">完読</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {book.pageCount && book.status === 'reading' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        読書の進捗
                      </Typography>
                      {/* 進捗バーなどを追加できます */}
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      fullWidth
                      onClick={() => navigate(`/books/edit/${id}`)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      fullWidth
                      onClick={() => setOpenDialog(true)}
                    >
                      削除
                    </Button>
                  </Box>
                </Box>
              </Grid>
              
              {/* 右側: 詳細情報 */}
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {book.title}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {book.author}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 2 }}>
                    {book.categories?.map((category, index) => (
                      <Chip key={index} label={category} />
                    ))}
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">出版社</Typography>
                    <Typography variant="body1" gutterBottom>
                      {book.publisher || additionalInfo?.publisher || '未設定'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">出版日</Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(book.publishedDate || additionalInfo?.publishedDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">ISBN</Typography>
                    <Typography variant="body1" gutterBottom>
                      {book.isbn || additionalInfo?.isbn13 || additionalInfo?.isbn10 || '未設定'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">追加日</Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(book.addedDate)}
                    </Typography>
                  </Grid>
                  {(book.pageCount || additionalInfo?.pageCount) && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">ページ数</Typography>
                      <Typography variant="body1" gutterBottom>
                        {book.pageCount || additionalInfo?.pageCount} ページ
                      </Typography>
                    </Grid>
                  )}
                  {(book.language || additionalInfo?.language) && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">言語</Typography>
                      <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {book.language || additionalInfo?.language}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                
                {/* 説明（Google Books APIから） */}
                {(book.description || additionalInfo?.description) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2">説明</Typography>
                    <Typography variant="body2" paragraph>
                      {book.description || additionalInfo?.description}
                    </Typography>
                  </>
                )}
                
                {/* 評価（Google Books APIから） */}
                {additionalInfo?.averageRating > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ mr: 1 }}>
                        評価
                        </Typography>
                      <Typography variant="body2">
                        {additionalInfo.averageRating} / 5 
                        <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                          ({additionalInfo.ratingsCount} レビュー)
                        </Typography>
                      </Typography>
                    </Box>
                  </>
                )}
                
                {/* ユーザーメモ */}
                {book.notes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2">メモ</Typography>
                    <Typography variant="body1" paragraph>
                      {book.notes}
                    </Typography>
                  </>
                )}
                
                {/* 新刊情報 */}
                {book.releaseSchedule?.nextVolume && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">次巻情報</Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={
                            book.releaseSchedule.notificationEnabled ? (
                              <NotificationsIcon />
                            ) : (
                              <NotificationsOffIcon />
                            )
                          }
                          onClick={toggleNotification}
                        >
                          {book.releaseSchedule.notificationEnabled ? '通知オン' : '通知オフ'}
                        </Button>
                      </Box>
                      <Typography variant="subtitle1" gutterBottom>
                        {book.releaseSchedule.nextVolume}
                      </Typography>
                      <Typography variant="body2">
                        予定発売日: {formatDate(book.releaseSchedule.expectedReleaseDate)}
                      </Typography>
                    </Box>
                  </>
                )}
                
                {/* Google Books リンク */}
                {additionalInfo?.infoLink && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        href={additionalInfo.infoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<InfoIcon />}
                      >
                        Google Booksで詳細を見る
                      </Button>
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
            
            {/* 削除確認ダイアログ */}
            <Dialog
              open={openDialog}
              onClose={() => setOpenDialog(false)}
            >
              <DialogTitle>本の削除</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  「{book.title}」を削除してもよろしいですか？この操作は元に戻せません。
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>キャンセル</Button>
                <Button onClick={handleDelete} color="error" autoFocus>
                  削除
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </>
      )}
      
      {/* 通知メッセージ */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookDetails;