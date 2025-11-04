import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RegisterTemplate } from './Register.html.jsx';
import './Register.css';

const Register = ({ onToggle }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register, error } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    setLoading(true);
    const result = await register(formData.name, formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      navigate('/home');
    }
  };

  return (
    <RegisterTemplate
      formData={formData}
      loading={loading}
      error={error}
      onToggle={onToggle}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
    />
  );
};

export default Register;

