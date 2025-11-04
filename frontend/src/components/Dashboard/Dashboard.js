import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectProgress, setProjectProgress] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchOverview = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/overview`);
      setOverview(response.data.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch overview');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects`);
      setProjects(response.data.data || []);
      if (response.data.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/my-tasks`);
      setMyTasks(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch my tasks:', error);
    }
  };

  const fetchProjectProgress = async (projectId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/projects/${projectId}/progress`);
      setProjectProgress(response.data.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch project progress');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFeed = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/projects/${projectId}/activity`);
      setActivityFeed(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchProjects();
    fetchMyTasks();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectProgress(selectedProject);
      fetchActivityFeed(selectedProject);
    }
  }, [selectedProject]);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString();
  };

  const getActionIcon = (action) => {
    const icons = {
      task_created: '➕',
      task_updated: '✏️',
      task_deleted: '🗑️',
      task_assigned: '👤',
      task_status_changed: '🔄',
      task_moved: '➡️',
      member_added: '➕',
      member_removed: '➖',
      member_role_changed: '🔀',
      project_created: '📁',
      project_updated: '📝',
      subtask_completed: '✅',
      subtask_created: '📋',
    };
    return icons[action] || '📌';
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard & Analytics</h2>
        <p className="dashboard-subtitle">Overview of your tasks and projects</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Project Progress
        </button>
        <button
          className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          My Tasks
        </button>
        <button
          className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity Feed
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {activeTab === 'overview' && overview && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Tasks</h3>
                <p className="stat-number">{overview.totalAssignedTasks}</p>
              </div>
              <div className="stat-card">
                <h3>Projects</h3>
                <p className="stat-number">{overview.totalProjects}</p>
              </div>
              <div className="stat-card">
                <h3>Upcoming Deadlines</h3>
                <p className="stat-number">{overview.upcomingDeadlines.length}</p>
              </div>
              <div className="stat-card urgent">
                <h3>Overdue Tasks</h3>
                <p className="stat-number">{overview.overdueTasks.length}</p>
              </div>
            </div>

            <div className="status-breakdown">
              <h3>Tasks by Status</h3>
              <div className="status-bars">
                <div className="status-bar">
                  <span>To Do</span>
                  <div className="bar-container">
                    <div 
                      className="bar todo" 
                      style={{ width: `${(overview.tasksByStatus.todo / overview.totalAssignedTasks) * 100 || 0}%` }}
                    />
                  </div>
                  <span>{overview.tasksByStatus.todo}</span>
                </div>
                <div className="status-bar">
                  <span>In Progress</span>
                  <div className="bar-container">
                    <div 
                      className="bar in-progress" 
                      style={{ width: `${(overview.tasksByStatus['in-progress'] / overview.totalAssignedTasks) * 100 || 0}%` }}
                    />
                  </div>
                  <span>{overview.tasksByStatus['in-progress']}</span>
                </div>
                <div className="status-bar">
                  <span>In Review</span>
                  <div className="bar-container">
                    <div 
                      className="bar in-review" 
                      style={{ width: `${(overview.tasksByStatus['in-review'] / overview.totalAssignedTasks) * 100 || 0}%` }}
                    />
                  </div>
                  <span>{overview.tasksByStatus['in-review']}</span>
                </div>
                <div className="status-bar">
                  <span>Done</span>
                  <div className="bar-container">
                    <div 
                      className="bar done" 
                      style={{ width: `${(overview.tasksByStatus.done / overview.totalAssignedTasks) * 100 || 0}%` }}
                    />
                  </div>
                  <span>{overview.tasksByStatus.done}</span>
                </div>
              </div>
            </div>

            {overview.upcomingDeadlines.length > 0 && (
              <div className="deadlines-section">
                <h3>Upcoming Deadlines (Next 7 Days)</h3>
                <div className="deadlines-list">
                  {overview.upcomingDeadlines.map((task) => (
                    <div key={task._id} className="deadline-item">
                      <div className="deadline-info">
                        <h4>{task.title}</h4>
                        <p>{task.project?.name || 'Unknown Project'}</p>
                        <span className="deadline-date">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overview.overdueTasks.length > 0 && (
              <div className="overdue-section">
                <h3>Overdue Tasks</h3>
                <div className="overdue-list">
                  {overview.overdueTasks.map((task) => {
                    const daysOverdue = Math.floor((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={task._id} className="overdue-item">
                        <div className="overdue-info">
                          <h4>{task.title}</h4>
                          <p>{task.project?.name || 'Unknown Project'}</p>
                          <span className="overdue-days">{daysOverdue} days overdue</span>
                        </div>
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {task.priority}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-tab">
            <div className="project-selector">
              <label>Select Project:</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="project-select"
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.key})
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="loading">Loading progress...</div>
            ) : projectProgress && selectedProject ? (
              <div className="progress-content">
                <div className="progress-stats">
                  <div className="progress-card">
                    <h3>Task Completion</h3>
                    <div className="progress-circle">
                      <svg width="120" height="120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - projectProgress.completionPercentage / 100)}`}
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div className="progress-text">
                        <span className="progress-percentage">{projectProgress.completionPercentage}%</span>
                        <span className="progress-label">{projectProgress.completedTasks} / {projectProgress.totalTasks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="progress-card">
                    <h3>Subtask Completion</h3>
                    <div className="progress-circle">
                      <svg width="120" height="120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - projectProgress.subtasks.completionPercentage / 100)}`}
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div className="progress-text">
                        <span className="progress-percentage">{projectProgress.subtasks.completionPercentage}%</span>
                        <span className="progress-label">{projectProgress.subtasks.completed} / {projectProgress.subtasks.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="breakdown-section">
                  <div className="breakdown-card">
                    <h4>Tasks by Status</h4>
                    <div className="breakdown-list">
                      <div className="breakdown-item">
                        <span>To Do</span>
                        <span>{projectProgress.statusBreakdown.todo}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>In Progress</span>
                        <span>{projectProgress.statusBreakdown['in-progress']}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>In Review</span>
                        <span>{projectProgress.statusBreakdown['in-review']}</span>
                      </div>
                      <div className="breakdown-item">
                        <span>Done</span>
                        <span>{projectProgress.statusBreakdown.done}</span>
                      </div>
                    </div>
                  </div>

                  <div className="breakdown-card">
                    <h4>Tasks by Priority</h4>
                    <div className="breakdown-list">
                      <div className="breakdown-item">
                        <span style={{ color: '#ef4444' }}>Urgent</span>
                        <span>{projectProgress.priorityBreakdown.urgent}</span>
                      </div>
                      <div className="breakdown-item">
                        <span style={{ color: '#f59e0b' }}>High</span>
                        <span>{projectProgress.priorityBreakdown.high}</span>
                      </div>
                      <div className="breakdown-item">
                        <span style={{ color: '#3b82f6' }}>Medium</span>
                        <span>{projectProgress.priorityBreakdown.medium}</span>
                      </div>
                      <div className="breakdown-item">
                        <span style={{ color: '#94a3b8' }}>Low</span>
                        <span>{projectProgress.priorityBreakdown.low}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {projectProgress.upcomingDeadlines.length > 0 && (
                  <div className="project-deadlines">
                    <h4>Upcoming Deadlines</h4>
                    <div className="deadlines-list">
                      {projectProgress.upcomingDeadlines.map((task) => (
                        <div key={task.id} className="deadline-item">
                          <span>{task.title}</span>
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {projectProgress.overdueTasks.length > 0 && (
                  <div className="project-overdue">
                    <h4>Overdue Tasks</h4>
                    <div className="overdue-list">
                      {projectProgress.overdueTasks.map((task) => (
                        <div key={task.id} className="overdue-item">
                          <span>{task.title}</span>
                          <span>{task.daysOverdue} days overdue</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-data">Select a project to view progress</div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-tab">
            <h3>My Assigned Tasks</h3>
            {myTasks.length === 0 ? (
              <div className="no-data">No tasks assigned to you</div>
            ) : (
              <div className="tasks-list">
                {myTasks.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  return (
                    <div key={task._id} className={`task-item ${isOverdue ? 'overdue' : ''}`}>
                      <div className="task-main">
                        <h4>{task.title}</h4>
                        <p className="task-project">{task.project?.name} ({task.project?.key})</p>
                        {task.description && (
                          <p className="task-description">
                            {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      <div className="task-meta">
                        <span className={`status-badge status-${task.status}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <div className="activity-selector">
              <label>Project:</label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="project-select"
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.key})
                  </option>
                ))}
              </select>
            </div>

            {selectedProject ? (
              <div className="activity-feed">
                {activityFeed.length === 0 ? (
                  <div className="no-data">No activity yet</div>
                ) : (
                  activityFeed.map((activity) => (
                    <div key={activity._id} className="activity-item">
                      <div className="activity-icon">
                        {activity.user?.profilePicture ? (
                          <img 
                            src={activity.user.profilePicture} 
                            alt={activity.user.name}
                            className="activity-avatar"
                          />
                        ) : (
                          <div className="activity-avatar-placeholder">
                            {activity.user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-user">{activity.user?.name}</span>
                          <span className="activity-action">
                            {getActionIcon(activity.action)} {activity.description}
                          </span>
                          <span className="activity-time">{formatTimeAgo(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="no-data">Select a project to view activity</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
