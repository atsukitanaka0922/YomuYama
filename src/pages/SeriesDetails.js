// src/pages/SeriesDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  arrayRemove,
  arrayUnion
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Material-UI
import {
  Container,
  Paper,
  Grid,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Tooltip,
  Checkbox,
  Menu,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Book as BookIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as UncheckBoxIcon,
  Collections as CollectionsIcon,
  DragIndicator as DragIndicatorIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Language as LanguageIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Sort as SortIcon
} from '@mui/icons-material';

const SeriesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [series, setSeries] = useState(null);
  const [seriesBooks, setSeriesBooks] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openAddBookDialog, setOpenAddBookDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSeries, setEditedSeries] = useState(null);
  const [sortMethod, setSortMethod] = useState('volume'); // デフォルトは巻数順
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const sortMenuOpen = Boolean(sortMenuAnchor);

  // シリーズ情報を取得
  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        if (!currentUser) return;
        
        const seriesRef = doc(db, 'users', currentUser.uid, 'series', id);
        const docSnap = await getDoc(seriesRef);
        
        if (docSnap.exists()) {
          const seriesData = { id: docSnap.id, ...docSnap.data() };
          setSeries(seriesData);
          setEditedSeries(seriesData);
          
          // シリーズに含まれる本の情報を取得
          await fetchSeriesBooks(seriesData.books || []);
        } else {
          setError('シリーズが見つかりませんでした');
        }
      } catch (error) {
        console.error('Error fetching series:', error);
        setError('シリーズの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesData();
  }, [id, currentUser]);

  // シリーズに含まれる本の情報を取得
  const fetchSeriesBooks = async (bookIds) => {
    setLoadingBooks(true);
    try {
      if (!currentUser || !bookIds.length) {
        setSeriesBooks([]);
        setLoadingBooks(false);
        return;
      }

      const booksData = [];
      for (const bookId of bookIds) {
        const bookRef = doc(db, 'users', currentUser.uid, 'books', bookId);
        const bookSnap = await getDoc(bookRef);
        if (bookSnap.exists()) {
          // 本の所持状態を取得（新しいデータ構造の場合）
          const owned = series?.bookStatus?.[bookId]?.owned ?? true; // デフォルトで所持している
          booksData.push({ 
            id: bookSnap.id, 
            ...bookSnap.data(),
            owned: owned
          });
        }
      }
      
      // 本を指定された順序でソート
      sortBooks(booksData, sortMethod);
      
      setSeriesBooks(booksData);
      
      // シリーズに含まれていない本を取得（追加ダイアログ用）
      await fetchAvailableBooks(bookIds);
    } catch (error) {
      console.error('Error fetching series books:', error);
      setError('本の情報取得中にエラーが発生しました');
    } finally {
      setLoadingBooks(false);
    }
  };

  // タイトルから巻数を抽出する関数
  const extractVolumeNumber = (title) => {
    // "巻" や "Volume" などの前の数字を抽出
    const match = title.match(/(\d+)(?:\s*(?:巻|部|話|章|vol\.?|volume|episode|chapter))/i);
    if (match) return parseInt(match[1], 10);
    
    // 末尾の数字を抽出（例: "鬼滅の刃 1"）
    const endMatch = title.match(/\s+(\d+)$/);
    if (endMatch) return parseInt(endMatch[1], 10);
    
    // 数字が見つからない場合は大きな値を返す（ソート時に後ろに配置）
    return 9999;
  };

  // 本のソート関数
  const sortBooks = (books, method) => {
    switch (method) {
      case 'volume':
        // 巻数でソート
        books.sort((a, b) => {
          const volA = extractVolumeNumber(a.title);
          const volB = extractVolumeNumber(b.title);
          return volA - volB;
        });
        break;
      case 'title':
        // タイトルでソート
        books.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
        break;
      case 'publishedDate':
        // 出版日でソート
        books.sort((a, b) => {
          const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
          const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'publishedDate-desc':
        // 出版日の降順でソート
        books.sort((a, b) => {
          const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
          const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
          return dateB - dateA;
        });
        break;
      case 'addedDate':
        // 追加日でソート
        books.sort((a, b) => {
          const dateA = a.addedDate ? new Date(a.addedDate) : new Date(0);
          const dateB = b.addedDate ? new Date(b.addedDate) : new Date(0);
          return dateA - dateB;
        });
        break;
      case 'status':
        // 読書状態でソート (未読 -> 読書中 -> 完読)
        books.sort((a, b) => {
          const statusOrder = { unread: 0, reading: 1, completed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });
        break;
      default:
        // デフォルトは巻数でソート
        books.sort((a, b) => {
          const volA = extractVolumeNumber(a.title);
          const volB = extractVolumeNumber(b.title);
          return volA - volB;
        });
    }
  };

  // ソート方法を変更したときのハンドラー
  const handleSortChange = (method) => {
    setSortMethod(method);
    const sortedBooks = [...seriesBooks];
    sortBooks(sortedBooks, method);
    setSeriesBooks(sortedBooks);
    setSortMenuAnchor(null);
  };

  // シリーズに追加可能な本を取得
  const fetchAvailableBooks = async (excludeIds) => {
    try {
      const booksRef = collection(db, 'users', currentUser.uid, 'books');
      const q = query(booksRef);
      const querySnapshot = await getDocs(q);
      
      const availableBooksData = [];
      querySnapshot.forEach((doc) => {
        // すでにシリーズに含まれていない本のみを対象にする
        if (!excludeIds.includes(doc.id)) {
          availableBooksData.push({ id: doc.id, ...doc.data() });
        }
      });
      
      setAvailableBooks(availableBooksData);
    } catch (error) {
      console.error('Error fetching available books:', error);
    }
  };

  // シリーズの更新
  const handleUpdateSeries = async () => {
    try {
      if (!editedSeries.title) {
        setError('タイトルは必須です');
        return;
      }
      
      const seriesRef = doc(db, 'users', currentUser.uid, 'series', id);
      await updateDoc(seriesRef, {
        ...editedSeries,
        lastModified: new Date().toISOString().split('T')[0],
      });
      
      setSeries(editedSeries);
      setIsEditMode(false);
      setSuccessMessage('シリーズが更新されました');
    } catch (error) {
      console.error('Error updating series:', error);
      setError('シリーズの更新中にエラーが発生しました');
    }
  };

  // シリーズの削除
  const handleDeleteSeries = async () => {
    try {
      // シリーズを削除しても、個々の本は削除せず残しておく
      const seriesRef = doc(db, 'users', currentUser.uid, 'series', id);
      await deleteDoc(seriesRef);
      
      setSuccessMessage('シリーズが削除されました');
      setTimeout(() => {
        navigate('/series');
      }, 1500);
    } catch (error) {
      console.error('Error deleting series:', error);
      setError('シリーズの削除中にエラーが発生しました');
    } finally {
      setOpenDeleteDialog(false);
    }
  };

  // シリーズから本を削除
  const handleRemoveBookFromSeries = async (bookId) => {
    try {
      const seriesRef = doc(db, 'users', currentUser.uid, 'series', id);
      
      // 本のIDをbooks配列から削除
      await updateDoc(seriesRef, {
        books: arrayRemove(bookId),
        lastModified: new Date().toISOString().split('T')[0],
      });
      
      // bookStatusからも該当の本を削除
      if (series.bookStatus && series.bookStatus[bookId]) {
        // Firestoreのオブジェクトから特定のフィールドを削除するにはFieldValueを使う必要があるが
        // ネストされたオブジェクトの場合は全体を更新する必要がある
        const updatedBookStatus = { ...series.bookStatus };
        delete updatedBookStatus[bookId];
        
        await updateDoc(seriesRef, {
          bookStatus: updatedBookStatus
        });
      }
      
      // ステートを更新
      const updatedSeries = { 
        ...series, 
        books: series.books.filter(id => id !== bookId)
      };
      
      if (updatedSeries.bookStatus) {
        const newBookStatus = { ...updatedSeries.bookStatus };
        delete newBookStatus[bookId];
        updatedSeries.bookStatus = newBookStatus;
      }
      
      setSeries(updatedSeries);
      setEditedSeries(updatedSeries);
      
      // 本のリストを更新
      setSeriesBooks(seriesBooks.filter(book => book.id !== bookId));
      
      // 利用可能な本のリストに追加
      const bookToAdd = seriesBooks.find(book => book.id === bookId);
      if (bookToAdd) {
        setAvailableBooks([...availableBooks, bookToAdd]);
      }
      
      setSuccessMessage('本がシリーズから削除されました');
    } catch (error) {
      console.error('Error removing book from series:', error);
      setError('本の削除中にエラーが発生しました');
    }
  };

  // シリーズに本を追加
  const handleAddBooksToSeries = async (selectedBookIds, allOwned = true) => {
    if (!selectedBookIds.length) return;
    
    try {
      const seriesRef = doc(db, 'users', currentUser.uid, 'series', id);
      
      // 所持状態を設定（デフォルトはallOwnedパラメータによって決まる）
      const bookStatus = { ...(series.bookStatus || {}) };
      
      // 新しい本の情報を追加
      selectedBookIds.forEach(bookId => {
        bookStatus[bookId] = { owned: allOwned };
      });
      
      // IDだけの配列も維持（下位互換性のため）
      const updatedBookIds = [...(series.books || []), ...selectedBookIds];
      
      // 更新データの準備
      const updateData = {
        books: updatedBookIds,
        bookStatus: bookStatus,
        lastModified: new Date().toISOString().split('T')[0],
      };
      
      // コンプリート状態を自動的に更新
      // 全巻数が設定されていて、所持している本がその数に達していればコンプリートを自動設定
      if (series.bookCount && series.bookCount > 0) {
        const ownedBooksCount = Object.values(bookStatus).filter(status => status.owned).length;
        if (ownedBooksCount >= series.bookCount) {
          updateData.completeStatus = true;
        }
      }
      
      await updateDoc(seriesRef, updateData);
      
      // ステートを更新
      const updatedSeries = { 
        ...series, 
        books: updatedBookIds,
        bookStatus: bookStatus
      };
      
      // コンプリート状態も更新
      if (updateData.completeStatus !== undefined) {
        updatedSeries.completeStatus = updateData.completeStatus;
      }
      
      setSeries(updatedSeries);
      setEditedSeries(updatedSeries);
      
      // 本のリストを更新するため再取得
      await fetchSeriesBooks(updatedBookIds);
      
      // 通知メッセージを更新
      let message = '本がシリーズに追加されました';
      if (updateData.completeStatus) {
        message += '。シリーズがコンプリートになりました！';
      }
      
      setSuccessMessage(message);
    } catch (error) {
      console.error('Error adding books to series:', error);
      setError('本の追加中にエラーが発生しました');
    } finally {
      setOpenAddBookDialog(false);
    }
  };

  // 完了状態の切り替え
  const toggleCompleteStatus = async () => {
    try {
      const newStatus = !series.completeStatus;
      const seriesRef = doc(db, 'users', currentUser.uid, 'series', id);
      
      // シリーズのコンプリート状態を更新
      await updateDoc(seriesRef, {
        completeStatus: newStatus,
        lastModified: new Date().toISOString().split('T')[0],
      });
      
      // コンプリート状態が変更された場合、すべての本の所持状態も一括で変更
      const bookStatus = { ...(series.bookStatus || {}) };
      
      // すべての本の所持状態をコンプリート状態に合わせて更新
      let changed = false;
      series.books.forEach(bookId => {
        if (!bookStatus[bookId]) {
          bookStatus[bookId] = { owned: newStatus };
          changed = true;
        } else if (bookStatus[bookId].owned !== newStatus) {
          bookStatus[bookId].owned = newStatus;
          changed = true;
        }
      });
      
      // 所持状態が変更された場合のみ更新
      if (changed) {
        await updateDoc(seriesRef, { bookStatus });
        
        // 本のリストの所持状態も更新
        setSeriesBooks(prev => 
          prev.map(book => ({ ...book, owned: newStatus }))
        );
      }
      
      // ステートを更新
      const updatedSeries = { 
        ...series, 
        completeStatus: newStatus,
        bookStatus
      };
      setSeries(updatedSeries);
      setEditedSeries(updatedSeries);
      
      setSuccessMessage(newStatus ? 'シリーズをコンプリートしました' : 'シリーズを未完了に戻しました');
    } catch (error) {
      console.error('Error updating complete status:', error);
      setError('状態の更新中にエラーが発生しました');
    }
  };

  // 編集用フォームの値変更ハンドラ
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedSeries(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // カテゴリー追加
  const handleAddCategory = (category) => {
    if (!category || (editedSeries.categories && editedSeries.categories.includes(category))) return;
    
    setEditedSeries(prev => ({
      ...prev,
      categories: [...(prev.categories || []), category]
    }));
  };

  // カテゴリー削除
  const handleRemoveCategory = (category) => {
    setEditedSeries(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  // 進捗率を計算
  const calculateProgress = () => {
    if (!series || !series.bookCount || series.bookCount === 0) return 0;
    
    // 所持している本の数を計算
    let ownedBooksCount = 0;
    
    // 新しいデータ構造（bookStatus オブジェクト）がある場合はそれを使用
    if (series.bookStatus) {
      ownedBooksCount = Object.values(series.bookStatus).filter(status => status.owned).length;
    } else {
      // 下位互換性のため、古いデータ構造ではすべての本を所持していると仮定
      ownedBooksCount = series.books?.length || 0;
    }
    
    return (ownedBooksCount / series.bookCount) * 100;
  };

  // 本の所持状態を切り替える
  const toggleBookOwned = async (bookId, currentOwned) => {
    try {
      const newOwned = !currentOwned;
      const seriesRef = doc(db, 'users', currentUser.uid, 'series', id);
      
      // 現在の所持状態を取得
      const bookStatus = { ...(series.bookStatus || {}) };
      
      // 該当の本の所持状態を更新
      bookStatus[bookId] = { 
        ...(bookStatus[bookId] || {}),
        owned: newOwned 
      };

      // 更新データを準備
      const updateData = {
        bookStatus: bookStatus,
        lastModified: new Date().toISOString().split('T')[0],
      };
      
      // 全巻数が設定されている場合、コンプリート状態を自動的に更新
      if (series.bookCount && series.bookCount > 0) {
        const ownedBooksCount = Object.values(bookStatus).filter(status => status.owned).length;
        
        // 全ての本が所持されているかチェック
        if (ownedBooksCount >= series.bookCount) {
          updateData.completeStatus = true;
        } 
        // 一冊でも未所持の本があればコンプリート解除
        else if (series.completeStatus) {
          updateData.completeStatus = false;
        }
      }
      
      // Firestore更新
      await updateDoc(seriesRef, updateData);
      
      // ローカル状態も更新
      const updatedSeries = {
        ...series,
        bookStatus: bookStatus
      };
      
      // コンプリート状態も更新
      if (updateData.completeStatus !== undefined) {
        updatedSeries.completeStatus = updateData.completeStatus;
      }
      
      setSeries(updatedSeries);
      
      // 本のリストも更新
      setSeriesBooks(prev => 
        prev.map(book => 
          book.id === bookId 
            ? { ...book, owned: newOwned } 
            : book
        )
      );
      
      let message = newOwned ? '本を所持済みにしました' : '本を未所持にしました';
      
      // コンプリート状態が変わった場合は通知を追加
      if (updateData.completeStatus !== undefined && updateData.completeStatus !== series.completeStatus) {
        message += updateData.completeStatus 
          ? '。シリーズがコンプリートになりました！' 
          : '。シリーズが未完了になりました';
      }
      
      setSuccessMessage(message);
    } catch (error) {
      console.error('本の所持状態更新エラー:', error);
      setError('本の所持状態の更新中にエラーが発生しました');
    }
  };

  // 編集モードのキャンセル
  const handleCancelEdit = () => {
    setEditedSeries(series);
    setIsEditMode(false);
  };

  // 読み込み中
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>読み込み中...</Typography>
      </Container>
    );
  }

  // エラー発生時
  if (error && !series) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/series')}
          sx={{ mt: 2 }}
        >
          シリーズ一覧に戻る
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {series && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/series')}
            >
              シリーズ一覧に戻る
            </Button>
            
            <Box>
              {!isEditMode && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditMode(true)}
                    sx={{ mr: 1 }}
                  >
                    編集
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setOpenDeleteDialog(true)}
                  >
                    削除
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            {isEditMode ? (
              // 編集モード
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="表紙画像URL"
                    name="coverImage"
                    value={editedSeries.coverImage || ''}
                    onChange={handleEditChange}
                    margin="normal"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="250"
                        image={editedSeries.coverImage || 'https://via.placeholder.com/400x250?text=No+Cover'}
                        alt={editedSeries.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    </Card>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    required
                    label="シリーズタイトル"
                    name="title"
                    value={editedSeries.title || ''}
                    onChange={handleEditChange}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="著者"
                    name="author"
                    value={editedSeries.author || ''}
                    onChange={handleEditChange}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="説明"
                    name="description"
                    value={editedSeries.description || ''}
                    onChange={handleEditChange}
                    margin="normal"
                    multiline
                    rows={3}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      全巻数
                    </Typography>
                    <TextField
                      type="number"
                      name="bookCount"
                      value={editedSeries.bookCount || ''}
                      onChange={handleEditChange}
                      inputProps={{ min: 1 }}
                      sx={{ width: 100 }}
                    />
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      カテゴリー
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {editedSeries.categories?.map((category, index) => (
                        <Chip
                          key={index}
                          label={category}
                          onDelete={() => handleRemoveCategory(category)}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <TextField
                        label="カテゴリーを追加"
                        size="small"
                        sx={{ mr: 1 }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          const input = e.currentTarget.previousSibling.querySelector('input');
                          handleAddCategory(input.value);
                          input.value = '';
                        }}
                      >
                        追加
                      </Button>
                    </Box>
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editedSeries.completeStatus || false}
                        onChange={(e) => setEditedSeries(prev => ({
                          ...prev,
                          completeStatus: e.target.checked
                        }))}
                      />
                    }
                    label="シリーズのコレクションを完了"
                    sx={{ mt: 2 }}
                  />
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      sx={{ mr: 1 }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleUpdateSeries}
                    >
                      保存
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              // 表示モード
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card elevation={2}>
                    <CardMedia
                      component="img"
                      height="250"
                      image={series.coverImage || 'https://via.placeholder.com/400x250?text=No+Cover'}
                      alt={series.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  </Card>
                  
                  {/* 収集状態 */}
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">収集状態</Typography>
                      <Chip
                        label={series.completeStatus ? 'コンプリート' : '収集中'}
                        color={series.completeStatus ? 'success' : 'primary'}
                        size="small"
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={series.completeStatus ? <CheckBoxIcon /> : <UncheckBoxIcon />}
                      onClick={toggleCompleteStatus}
                    >
                      {series.completeStatus ? 'コンプリート済み' : 'コンプリートにする'}
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {series.title}
                  </Typography>
                  
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {series.author}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 2 }}>
                    {series.categories?.map((category, index) => (
                      <Chip key={index} label={category} />
                    ))}
                  </Box>
                  
                  {series.description && (
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body1">
                        {series.description}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* 収集進捗 */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">収集進捗</Typography>
                      <Typography variant="body2">
                        {
                          series.bookStatus 
                            ? Object.values(series.bookStatus).filter(status => status.owned).length 
                            : (series.books?.length || 0)
                        } / {series.bookCount || '?'} 巻
                        {series.bookCount && ` (${Math.round(calculateProgress())}%)`}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress()}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* シリーズ内の本一覧 */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                <BookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                シリーズ内の本
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  startIcon={<SortIcon />}
                  onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                  sx={{ mr: 1 }}
                >
                  並び替え
                </Button>
                <Menu
                  anchorEl={sortMenuAnchor}
                  open={sortMenuOpen}
                  onClose={() => setSortMenuAnchor(null)}
                >
                  <MenuItem 
                    onClick={() => handleSortChange('volume')}
                    selected={sortMethod === 'volume'}
                  >
                    巻数順
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('title')}
                    selected={sortMethod === 'title'}
                  >
                    タイトル順
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('publishedDate')}
                    selected={sortMethod === 'publishedDate'}
                  >
                    発売日順（古い順）
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('publishedDate-desc')}
                    selected={sortMethod === 'publishedDate-desc'}
                  >
                    発売日順（新しい順）
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('addedDate')}
                    selected={sortMethod === 'addedDate'}
                  >
                    追加日順
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleSortChange('status')}
                    selected={sortMethod === 'status'}
                  >
                    読書状態順
                  </MenuItem>
                </Menu>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddBookDialog(true)}
                >
                  本を追加
                </Button>
              </Box>
            </Box>
            
            {loadingBooks ? (
              <LinearProgress />
            ) : seriesBooks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" gutterBottom>
                  このシリーズにはまだ本が登録されていません
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddBookDialog(true)}
                  sx={{ mt: 1 }}
                >
                  本を追加
                </Button>
              </Box>
            ) : (
              <List>
                {seriesBooks.map((book, index) => (
                  <React.Fragment key={book.id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant={book.owned ? "outlined" : "contained"}
                            color={book.owned ? "success" : "primary"}
                            size="small"
                            onClick={() => toggleBookOwned(book.id, book.owned)}
                            sx={{ minWidth: '90px' }}
                          >
                            {book.owned ? '所持済み' : '未所持'}
                          </Button>
                          <Button
                            color="error"
                            size="small"
                            onClick={() => handleRemoveBookFromSeries(book.id)}
                          >
                            削除
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          src={book.coverImage || 'https://via.placeholder.com/40x60?text=No+Cover'}
                          alt={book.title}
                          sx={{ width: 60, height: 80 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            component={Link}
                            to={`/books/${book.id}`}
                            sx={{ 
                              textDecoration: 'none',
                              color: 'inherit',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {book.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {book.author}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
                                sx={{ mr: 1 }}
                              />
                              {book.publishedDate && (
                                <Typography variant="caption" color="text.secondary">
                                  {book.publishedDate}
                                </Typography>
                              )}
                            </Box>
                          </>
                        }
                        sx={{ ml: 2 }}
                      />
                    </ListItem>
                    {index < seriesBooks.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>

          {/* 削除確認ダイアログ */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
          >
            <DialogTitle>シリーズの削除</DialogTitle>
            <DialogContent>
              <DialogContentText>
                「{series.title}」シリーズを削除してもよろしいですか？
                <br />
                <br />
                ※シリーズを削除しても、登録されている本自体は削除されません。
              </DialogContentText>
              </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>キャンセル</Button>
              <Button onClick={handleDeleteSeries} color="error">
                削除
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* 本追加ダイアログ */}
          <Dialog
            open={openAddBookDialog}
            onClose={() => setOpenAddBookDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>シリーズに本を追加</DialogTitle>
            <DialogContent>
              {availableBooks.length === 0 ? (
                <DialogContentText>
                  追加可能な本がありません。まず新しい本を登録してください。
                </DialogContentText>
              ) : (
                <AddBooksToSeries
                  books={availableBooks}
                  onAdd={handleAddBooksToSeries}
                  onCancel={() => setOpenAddBookDialog(false)}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAddBookDialog(false)}>
                キャンセル
              </Button>
              {availableBooks.length === 0 && (
                <Button
                  component={Link}
                  to="/books/add"
                  color="primary"
                  variant="contained"
                  onClick={() => setOpenAddBookDialog(false)}
                >
                  新しい本を登録
                </Button>
              )}
            </DialogActions>
          </Dialog>
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

// シリーズに本を追加するサブコンポーネント
const AddBooksToSeries = ({ books, onAdd, onCancel }) => {
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBooks, setFilteredBooks] = useState(books);
  const [allOwned, setAllOwned] = useState(true); // デフォルトで所持済みに設定
  const [displayCount, setDisplayCount] = useState(20); // デフォルトの表示数
  
  // 検索フィルター
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(
        book =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [books, searchTerm]);
  
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
  
  // 表示数を増やす
  const loadMore = () => {
    setDisplayCount(prev => prev + 20);
  };
  
  return (
    <Box>
      <TextField
        fullWidth
        label="本を検索"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        margin="normal"
        InputProps={{
          startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
        <Typography variant="subtitle2">
          追加する本を選択 ({selectedBooks.length} 選択中)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel id="display-count-label">表示数</InputLabel>
            <Select
              labelId="display-count-label"
              value={displayCount}
              label="表示数"
              onChange={(e) => setDisplayCount(e.target.value)}
            >
              <MenuItem value={20}>20冊</MenuItem>
              <MenuItem value={50}>50冊</MenuItem>
              <MenuItem value={100}>100冊</MenuItem>
              <MenuItem value={1000}>すべて</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={allOwned}
                onChange={(e) => setAllOwned(e.target.checked)}
                color="primary"
              />
            }
            label="所持済みとして追加"
          />
        </Box>
      </Box>
      
      <List sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
        {filteredBooks.length === 0 ? (
          <ListItem>
            <ListItemText primary="条件に一致する本はありません" />
          </ListItem>
        ) : (
          filteredBooks.slice(0, displayCount).map((book) => (
            <React.Fragment key={book.id}>
              <ListItem
                button
                onClick={() => toggleBookSelection(book.id)}
                selected={selectedBooks.includes(book.id)}
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
                  sx={{ ml: 1 }}
                />
                <Checkbox
                  edge="end"
                  checked={selectedBooks.includes(book.id)}
                  tabIndex={-1}
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))
        )}
      </List>
      
      {filteredBooks.length > displayCount && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button onClick={loadMore}>さらに表示</Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={() => onAdd(selectedBooks, allOwned)}
          disabled={selectedBooks.length === 0}
        >
          選択した本を追加
        </Button>
      </Box>
    </Box>
  );
};

export default SeriesDetails;