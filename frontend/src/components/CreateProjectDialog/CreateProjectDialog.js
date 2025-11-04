import React, { useState } from 'react';
import './CreateProjectDialog.css';

const CreateProjectDialog = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'key' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.key.trim()) {
      setError('Please fill in name and key');
      return;
    }

    if (formData.key.length > 10) {
      setError('Project key must be 10 characters or less');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      setFormData({ name: '', key: '', description: '' });
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Create New Project</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              required
              maxLength={100}
            />
          </div>
          <div className="form-group">
            <label>Project Key *</label>
            <input
              type="text"
              name="key"
              value={formData.key}
              onChange={handleChange}
              placeholder="PROJ (uppercase, letters & numbers only)"
              required
              maxLength={10}
              pattern="[A-Z0-9]+"
            />
            <small className="form-hint">Unique key (uppercase letters and numbers only, max 10 chars)</small>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description (optional)"
              rows="3"
              maxLength={500}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectDialog;
