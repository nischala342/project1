import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateProjectDialog from '../CreateProjectDialog';
import './Projects.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/projects`);
      setProjects(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await axios.post(`${API_URL}/api/projects`, projectData);
      setShowCreateDialog(false);
      fetchProjects();
      if (response.data.data?._id) {
        navigate(`/projects/${response.data.data._id}`);
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create project');
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      admin: 'role-admin',
      manager: 'role-manager',
      contributor: 'role-contributor',
      viewer: 'role-viewer',
    };
    return roleMap[role] || '';
  };

  const getRoleLabel = (role) => {
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'No role';
  };

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div>
          <h2>Projects</h2>
          <p className="projects-subtitle">Manage your projects and teams</p>
        </div>
        <button 
          onClick={() => setShowCreateDialog(true)} 
          className="create-project-button"
        >
          Create Project
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="no-projects">
          <p>No projects found</p>
          <button 
            onClick={() => setShowCreateDialog(true)} 
            className="create-first-project-button"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div 
              key={project._id} 
              className="project-card"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div className="project-card-header">
                <div className="project-key">{project.key}</div>
                <span className={`role-badge ${getRoleBadgeClass(project.role)}`}>
                  {getRoleLabel(project.role)}
                </span>
              </div>
              <h3 className="project-name">{project.name}</h3>
              {project.description && (
                <p className="project-description">{project.description}</p>
              )}
              <div className="project-footer">
                <span className="project-date">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateDialog && (
        <CreateProjectDialog
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
};

export default Projects;
