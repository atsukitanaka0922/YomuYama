// src/App.js
/**
 * アプリケーションのメインコンポーネント
 * ルーティングやテーマ設定、認証プロバイダーを管理します
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 共通コンポーネント
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// ページコンポーネント
import Home from './pages/Home';
import BookList from './pages/BookList';
import AddBook from './pages/AddBook';
import BookDetails from './pages/BookDetails';
import ReleaseSchedule from './pages/ReleaseSchedule';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// シリーズ管理ページ
import SeriesList from './pages/SeriesList';
import SeriesDetails from './pages/SeriesDetails';
import AddSeries from './pages/AddSeries';

// 一括登録と統計機能
import BulkAddBooks from './pages/BulkAddBooks';
import BookTowerPage from './pages/BookTowerPage';

// 認証コンテキスト
import { AuthProvider } from './contexts/AuthContext';

/**
 * アプリケーション全体のテーマ設定
 * ここで色やフォントなどのスタイルを定義します
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // メインカラー
    },
    secondary: {
      main: '#f50057', // アクセントカラー
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Noto Sans JP', // 日本語フォント
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        :root {
          --book-app-primary: #1976d2;
          --book-app-secondary: #f50057;
        }
      `,
    },
  },
});

/**
 * アプリケーションのメインコンポーネント
 * ルーティングの設定とテーマの適用を行います
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* リセットCSS */}
      <AuthProvider> {/* 認証コンテキストプロバイダー */}
        <Router>
          <div className="app-container">
            <Navbar /> {/* ナビゲーションバー */}
            <div className="content-container">
              <Routes>
                {/* 公開ページ */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* 本の管理機能（要認証） */}
                <Route path="/books" element={<PrivateRoute><BookList /></PrivateRoute>} />
                <Route path="/books/add" element={<PrivateRoute><AddBook /></PrivateRoute>} />
                <Route path="/books/:id" element={<PrivateRoute><BookDetails /></PrivateRoute>} />
                <Route path="/releases" element={<PrivateRoute><ReleaseSchedule /></PrivateRoute>} />
                
                {/* シリーズ管理機能（要認証） */}
                <Route path="/series" element={<PrivateRoute><SeriesList /></PrivateRoute>} />
                <Route path="/series/add" element={<PrivateRoute><AddSeries /></PrivateRoute>} />
                <Route path="/series/:id" element={<PrivateRoute><SeriesDetails /></PrivateRoute>} />
                
                {/* 拡張機能（要認証） */}
                <Route path="/books/bulk-add" element={<PrivateRoute><BulkAddBooks /></PrivateRoute>} />
                <Route path="/book-tower" element={<PrivateRoute><BookTowerPage /></PrivateRoute>} />
                
                {/* 404ページ */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;