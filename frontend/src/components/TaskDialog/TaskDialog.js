import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './TaskDialog.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const TaskDialog = ({ task, projectId, userRole, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    tags: '',
    subtasks: [],
  });
  const [subtaskInput, setSubtaskInput] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canAssign = ['admin', 'manager'].includes(userRole);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/${projectId}/members`);
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        tags: task.tags ? task.tags.join(', ') : '',
        subtasks: task.subtasks || [],
      });
    }
    fetchMembers();
  }, [task, projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDescriptionChange = (value) => {
    setFormData({
      ...formData,
      description: value,
    });
  };

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setFormData({
        ...formData,
        subtasks: [...formData.subtasks, { title: subtaskInput.trim(), completed: false }],
      });
      setSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter((_, i) => i !== index),
    });
  };

  const handleToggleSubtask = (index) => {
    const updatedSubtasks = [...formData.subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    setFormData({
      ...formData,
      subtasks: updatedSubtasks,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const taskData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        assignedTo: formData.assignedTo || null,
        dueDate: formData.dueDate || null,
      };

      if (task) {
        await onSubmit(task._id, taskData);
      } else {
        await onSubmit(taskData);
      }
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content task-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{task ? 'Edit Task' : 'Create Task'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {canAssign && (
            <div className="form-group">
              <label>Assign To</label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user._id} value={member.user._id}>
                    {member.user.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Description</label>
            <div className="rich-text-editor">
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Enter task description..."
              />
            </div>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., bug, feature, urgent"
            />
          </div>

          <div className="form-group">
            <label>Subtasks</label>
            <div className="subtasks-section">
              <div className="subtask-input">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add subtask and press Enter"
                />
                <button type="button" onClick={handleAddSubtask} className="add-subtask-button">
                  Add
                </button>
              </div>
              <div className="subtasks-list">
                {formData.subtasks.map((subtask, index) => (
                  <div key={index} className="subtask-item">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(index)}
                    />
                    <span className={subtask.completed ? 'completed' : ''}>
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(index)}
                      className="remove-subtask-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDialog;
