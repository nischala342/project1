import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeaderTemplate } from './Header.html.jsx';
import './Header.css';

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role?.name === 'admin';

  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return <HeaderTemplate user={user} isActive={isActive} isAdmin={isAdmin} />;
};

export default Header;

