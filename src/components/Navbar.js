// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Material-UI
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Book as BookIcon,
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Collections as CollectionsIcon,
  AddToPhotos as BulkAddIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // ドロワーの開閉
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // プロフィールメニューの開閉
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  // ログアウト
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
    handleProfileMenuClose();
  };

  // ナビゲーションアイテム（更新：シリーズと一括追加を追加）
  const navItems = [
    { text: 'ホーム', icon: <HomeIcon />, path: '/' },
    { text: '本の一覧', icon: <BookIcon />, path: '/books', auth: true },
    { text: 'シリーズ', icon: <CollectionsIcon />, path: '/series', auth: true },
    { text: '新刊スケジュール', icon: <CalendarIcon />, path: '/releases', auth: true },
    { text: '読書タワー', icon: <BarChartIcon />, path: '/book-tower', auth: true }, // 追加
    { text: '本を追加', icon: <AddIcon />, path: '/books/add', auth: true },
    { text: 'まとめて追加', icon: <BulkAddIcon />, path: '/books/bulk-add', auth: true },
  ];

  // 現在のパスがアクティブか判定
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // ドロワーの内容
  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      {currentUser && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={currentUser.photoURL || ''}
            alt={currentUser.displayName || currentUser.email}
            sx={{ mr: 2 }}
          />
          <Typography variant="subtitle1" noWrap>
            {currentUser.displayName || currentUser.email}
          </Typography>
        </Box>
      )}
      <Divider />
      <List>
        {navItems.map((item) => (
          (!item.auth || (item.auth && currentUser)) && (
            <ListItem 
              button 
              key={item.text} 
              component={Link} 
              to={item.path}
              selected={isActive(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          )
        ))}
      </List>
      <Divider />
      <List>
        {currentUser ? (
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="ログアウト" />
          </ListItem>
        ) : (
          <ListItem button component={Link} to="/login">
            <ListItemIcon><LoginIcon /></ListItemIcon>
            <ListItemText primary="ログイン" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <BookIcon sx={{ mr: 1 }} />
            YomuYama
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {navItems.map((item) => (
                (!item.auth || (item.auth && currentUser)) && (
                  <Button
                    key={item.text}
                    component={Link}
                    to={item.path}
                    color="inherit"
                    sx={{
                      mx: 1,
                      bgcolor: isActive(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    }}
                    startIcon={item.icon}
                  >
                    {item.text}
                  </Button>
                )
              ))}
            </Box>
          )}
          
          {currentUser ? (
            <>
              <Tooltip title="アカウント">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                  aria-controls={menuOpen ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? 'true' : undefined}
                >
                  <Avatar 
                    src={currentUser.photoURL || ''}
                    alt={currentUser.displayName || currentUser.email}
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>
              </Tooltip>
              <Menu
                id="account-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleProfileMenuClose}>
                  <Avatar 
                    src={currentUser.photoURL || ''}
                    alt={currentUser.displayName || currentUser.email}
                    sx={{ mr: 2, width: 24, height: 24 }}
                  />
                  プロフィール
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  ログアウト
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              component={Link}
              to="/login"
              startIcon={<LoginIcon />}
            >
              ログイン
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navbar;