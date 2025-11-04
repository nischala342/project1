import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const Profile = () => {
  const { user, loadUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profilePicture: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        profilePicture: user.profilePicture || null,
      });
      setImagePreview(user.profilePicture || null);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProfileData({
          ...profileData,
          profilePicture: reader.result,
        });
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.put(
        `${API_URL}/api/profile`,
        {
          name: profileData.name,
          profilePicture: profileData.profilePicture,
        }
      );

      setSuccess('Profile updated successfully!');
      await loadUser(); 
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.delete(`${API_URL}/api/profile/picture`);
      setImagePreview(null);
      setProfileData({
        ...profileData,
        profilePicture: null,
      });
      setSuccess('Profile picture deleted successfully!');
      await loadUser(); 
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete profile picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Profile Settings</h2>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-picture-section">
            <div className="picture-preview">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="profile-picture" />
              ) : (
                <div className="profile-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="picture-actions">
              <label className="file-upload-button">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {imagePreview ? 'Change Picture' : 'Upload Picture'}
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleDeletePicture}
                  className="delete-picture-button"
                  disabled={loading}
                >
                  Delete Picture
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="disabled-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="logout-section">
          <button 
            onClick={async () => {
              await logout();
              navigate('/');
            }} 
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
