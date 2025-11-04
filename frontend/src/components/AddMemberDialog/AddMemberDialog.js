import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddMemberDialog.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const AddMemberDialog = ({ projectId, existingMembers, onClose, onAdd }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    role: 'contributor',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data.data || []);
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_URL}/api/projects/${projectId}/members`, {
        userId: formData.userId,
        role: formData.role,
      });
      onAdd();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const existingMemberIds = existingMembers.map(m => m.user._id || m.user);
  const availableUsers = users.filter(u => !existingMemberIds.includes(u._id));

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Add Member to Project</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label>Select User *</label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
            >
              <option value="">Choose a user...</option>
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="form-hint">All users are already members of this project</p>
            )}
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="viewer">Viewer - Read only</option>
              <option value="contributor">Contributor - Create & update tasks</option>
              <option value="manager">Manager - Assign tasks, manage deadlines</option>
              <option value="admin">Admin - Full access</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}
          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || availableUsers.length === 0} 
              className="submit-button"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberDialog;
