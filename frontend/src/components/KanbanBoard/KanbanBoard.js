import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import TaskDialog from '../TaskDialog';
import './KanbanBoard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const KanbanBoard = ({ projectId, userRole }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: '#94a3b8' },
    { id: 'in-progress', title: 'In Progress', color: '#3b82f6' },
    { id: 'in-review', title: 'In Review', color: '#f59e0b' },
    { id: 'done', title: 'Done', color: '#10b981' },
  ];

  const canCreate = ['admin', 'manager', 'contributor'].includes(userRole);
  const canManage = ['admin', 'manager'].includes(userRole);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/projects/${projectId}/tasks`);
      setTasks(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const handleCreateTask = async (taskData) => {
    try {
      await axios.post(`${API_URL}/api/projects/${projectId}/tasks`, taskData);
      setShowTaskDialog(false);
      fetchTasks();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      await axios.put(`${API_URL}/api/projects/${projectId}/tasks/${taskId}`, taskData);
      setShowTaskDialog(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleDragStart = (e, task) => {
    if (!canCreate) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (!canCreate) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    if (!canCreate || !draggedTask) return;
    
    e.preventDefault();
    
    if (draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const targetTasks = tasks.filter(t => t.status === targetStatus);
      const order = targetTasks.length;

      await axios.put(
        `${API_URL}/api/projects/${projectId}/tasks/${draggedTask._id}/move`,
        { status: targetStatus, order }
      );
      
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to move task');
    } finally {
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status).sort((a, b) => a.order - b.order);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#94a3b8',
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="kanban-board-container">
      <div className="kanban-header">
        <h3>Kanban Board</h3>
        {canCreate && (
          <button 
            onClick={() => {
              setSelectedTask(null);
              setShowTaskDialog(true);
            }}
            className="create-task-button"
          >
            Create Task
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <div className="kanban-columns">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div
                key={column.id}
                className="kanban-column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="column-header" style={{ borderTopColor: column.color }}>
                  <h4>{column.title}</h4>
                  <span className="task-count">{columnTasks.length}</span>
                </div>
                <div className="tasks-list">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      className={`task-card ${draggedTask?._id === task._id ? 'dragging' : ''}`}
                      draggable={canCreate}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDialog(true);
                      }}
                    >
                      <div className="task-header">
                        <span 
                          className="priority-dot"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        />
                        {canManage && (
                          <button
                            className="delete-task-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task._id);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <h5 className="task-title">{task.title}</h5>
                      {task.description && (
                        <p className="task-description-preview">
                          {task.description.replace(/<[^>]*>/g, '').substring(0, 50)}...
                        </p>
                      )}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="subtasks-info">
                          {task.subtasks.filter(st => st.completed).length} / {task.subtasks.length} subtasks
                        </div>
                      )}
                      {task.assignedTo && (
                        <div className="task-assignee">
                          {task.assignedTo.profilePicture ? (
                            <img 
                              src={task.assignedTo.profilePicture} 
                              alt={task.assignedTo.name}
                              className="assignee-avatar"
                            />
                          ) : (
                            <div className="assignee-avatar-placeholder">
                              {task.assignedTo.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="task-due-date">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showTaskDialog && (
        <TaskDialog
          task={selectedTask}
          projectId={projectId}
          userRole={userRole}
          onClose={() => {
            setShowTaskDialog(false);
            setSelectedTask(null);
          }}
          onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
