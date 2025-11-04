import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginTemplate } from './Login.html.jsx';
import './Login.css';

const Login = ({ onToggle }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      setFormData({ email: '', password: '' });
      navigate('/home');
    }
  };

  return (
    <LoginTemplate
      formData={formData}
      loading={loading}
      error={error}
      onToggle={onToggle}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
    />
  );
};

export default Login;

