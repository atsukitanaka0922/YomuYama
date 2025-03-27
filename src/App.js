// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// コンポーネント
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookList from './pages/BookList';
import AddBook from './pages/AddBook';
import BookDetails from './pages/BookDetails';
import ReleaseSchedule from './pages/ReleaseSchedule';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';

// 新しく追加したページ
import SeriesList from './pages/SeriesList';
import SeriesDetails from './pages/SeriesDetails';
import AddSeries from './pages/AddSeries';
import BulkAddBooks from './pages/BulkAddBooks';
import BookTowerPage from './pages/BookTowerPage';

// 認証コンテキスト
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Noto Sans JP',
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <div className="content-container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 本の管理ルート */}
                <Route path="/books" element={<PrivateRoute><BookList /></PrivateRoute>} />
                <Route path="/books/add" element={<PrivateRoute><AddBook /></PrivateRoute>} />
                <Route path="/books/:id" element={<PrivateRoute><BookDetails /></PrivateRoute>} />
                <Route path="/releases" element={<PrivateRoute><ReleaseSchedule /></PrivateRoute>} />
                
                {/* シリーズ管理ルート（新規追加） */}
                <Route path="/series" element={<PrivateRoute><SeriesList /></PrivateRoute>} />
                <Route path="/series/add" element={<PrivateRoute><AddSeries /></PrivateRoute>} />
                <Route path="/series/:id" element={<PrivateRoute><SeriesDetails /></PrivateRoute>} />
                
                {/* 一括登録ルート（新規追加） */}
                <Route path="/books/bulk-add" element={<PrivateRoute><BulkAddBooks /></PrivateRoute>} />
                
                {/* 読書タワールート（新規追加） */}
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