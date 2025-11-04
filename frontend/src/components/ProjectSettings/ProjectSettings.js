import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectSettings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ProjectSettings = ({ project, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(`${API_URL}/api/projects/${project._id}`, {
        name: formData.name,
        description: formData.description,
      });

      setSuccess('Project settings updated successfully!');
      if (onUpdate) {
        onUpdate(response.data.data);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update project settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== project.name) {
      setError('Project name does not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/api/projects/${project._id}`);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete project');
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="project-settings-container">
      <div className="settings-section">
        <h3>General Settings</h3>
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter project name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description"
              rows="4"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Project Key</label>
            <input
              type="text"
              value={project.key || ''}
              disabled
              className="disabled-input"
            />
            <p className="form-hint">Project key cannot be changed after creation</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button type="submit" disabled={loading} className="save-button">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section danger-zone">
        <h3>Danger Zone</h3>
        <div className="danger-content">
          <div className="danger-info">
            <h4>Delete Project</h4>
            <p>Once you delete a project, there is no going back. This will permanently delete the project and all associated tasks, members, and data.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="delete-button"
            disabled={loading}
          >
            Delete Project
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="dialog-overlay" onClick={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmText('');
        }}>
          <div className="dialog-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Project</h3>
            <p>Are you sure you want to delete <strong>{project.name}</strong>?</p>
            <p className="warning-text">This action cannot be undone. All tasks, members, and data will be permanently deleted.</p>
            <div className="form-group">
              <label htmlFor="confirm-text">
                Type <strong>{project.name}</strong> to confirm:
              </label>
              <input
                type="text"
                id="confirm-text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={project.name}
                className="confirm-input"
              />
            </div>
            <div className="dialog-actions">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="cancel-button"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="confirm-delete-button"
                disabled={loading || deleteConfirmText !== project.name}
              >
                {loading ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSettings;
