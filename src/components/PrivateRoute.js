// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // 認証されていない場合はログインページにリダイレクト
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // 認証されている場合は子コンポーネントを表示
  return children;
};

export default PrivateRoute;