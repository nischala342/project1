import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import RegisterUserDialog from '../RegisterUserDialog';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/roles`);
      setRoles(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    setUpdatingUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(
        `${API_URL}/api/roles/${newRoleId}/assign/${userId}`
      );
      
      setSuccess(`Role updated successfully for ${response.data.data.user.name}`);
      fetchUsers(); 
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRegisterUser = async (userData) => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, userData);
      setShowRegisterDialog(false);
      setSuccess('User registered successfully!');
      fetchUsers(); 
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to register user');
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r._id === roleId);
    return role ? role.name : 'No role';
  };

  const getRolePermissions = (roleId) => {
    const role = roles.find(r => r._id === roleId);
    return role ? role.permissions : [];
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>User Management</h2>
          <p className="admin-subtitle">Manage user roles and permissions</p>
        </div>
        <button 
          onClick={() => setShowRegisterDialog(true)} 
          className="register-user-button"
        >
          Register New User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="no-users">No users found</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Permissions</th>
                <th>Change Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem._id}>
                  <td>
                    <div className="user-info">
                      {userItem.profilePicture ? (
                        <img
                          src={userItem.profilePicture}
                          alt={userItem.name}
                          className="user-avatar"
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {userItem.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{userItem.name}</span>
                    </div>
                  </td>
                  <td>{userItem.email}</td>
                  <td>
                    <span className={`role-badge ${getRoleName(userItem.role?._id || userItem.role) === 'admin' ? 'admin-badge' : 'user-badge'}`}>
                      {getRoleName(userItem.role?._id || userItem.role)}
                    </span>
                  </td>
                  <td>
                    <div className="permissions-list">
                      {getRolePermissions(userItem.role?._id || userItem.role).map((perm, idx) => (
                        <span key={idx} className="permission-tag">
                          {perm}
                        </span>
                      ))}
                      {getRolePermissions(userItem.role?._id || userItem.role).length === 0 && (
                        <span className="no-permissions">No permissions</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      value={userItem.role?._id || userItem.role || ''}
                      onChange={(e) => handleRoleChange(userItem._id, e.target.value)}
                      disabled={updatingUserId === userItem._id || userItem._id === user?.id}
                      className="role-select"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </option>
                      ))}
                    </select>
                    {updatingUserId === userItem._id && (
                      <span className="updating-indicator">Updating...</span>
                    )}
                  </td>
                  <td>
                    {userItem._id === user?.id && (
                      <span className="current-user-badge">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRegisterDialog && (
        <RegisterUserDialog
          onClose={() => setShowRegisterDialog(false)}
          onSubmit={handleRegisterUser}
        />
      )}
    </div>
  );
};

export default Admin;
