import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import Profile from './components/Profile';
import Support from './components/Support';
import Admin from './components/Admin';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CreateProjectDialog from './components/CreateProjectDialog';
import './App.css';
import './components/Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectDetails(selectedProject._id);
    }
  }, [selectedProject]);

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

  const fetchProjectDetails = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/${projectId}`);
      setProjectDetails(response.data.data);
    } catch (error) {
      console.error('Failed to fetch project details:', error);
      setProjectDetails(null);
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

  const handleCreateProject = async (projectData) => {
    try {
      const response = await axios.post(`${API_URL}/api/projects`, projectData);
      setShowCreateDialog(false);
      fetchProjects();
      if (response.data.data?._id) {
        setSelectedProject(response.data.data);
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create project');
    }
  };

  return (
    <div className="home-layout">
      <div className="home-side-nav">
        <div className="side-nav-header">
          <h3>Projects</h3>
          <p className="side-nav-subtitle">Manage your projects</p>
          <button 
            onClick={() => setShowCreateDialog(true)} 
            className="create-project-side-button"
          >
            + Create Project
          </button>
        </div>
        <div className="side-nav-content">
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : projects.length === 0 ? (
            <div className="no-projects">
              <p>No projects found</p>
              <button 
                onClick={() => navigate('/projects')} 
                className="view-all-projects-button"
              >
                View All Projects
              </button>
            </div>
          ) : (
            <div className="projects-side-list">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className={`project-side-item ${selectedProject?._id === project._id ? 'active' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="project-side-header">
                    <span className="project-side-key">{project.key}</span>
                    <span className={`role-badge-small ${getRoleBadgeClass(project.role)}`}>
                      {getRoleLabel(project.role)}
                    </span>
                  </div>
                  <h4 className="project-side-name">{project.name}</h4>
                  {project.description && (
                    <p className="project-side-description">
                      {project.description.substring(0, 60)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="side-nav-footer">
          <button 
            onClick={() => navigate('/projects')} 
            className="view-all-button"
          >
            View All Projects
          </button>
        </div>
      </div>

      <div className="home-main-content">
        {selectedProject && projectDetails ? (
          <div className="project-detail-view">
            <div className="project-detail-header-section">
              <h2>{projectDetails.name}</h2>
              <div className="project-meta-info">
                <span className="project-key-badge">Key: {projectDetails.key}</span>
                <span className={`role-badge ${getRoleBadgeClass(projectDetails.userRole)}`}>
                  {getRoleLabel(projectDetails.userRole)}
                </span>
              </div>
            </div>
            {projectDetails.description && (
              <div className="project-description-section">
                <h3>Description</h3>
                <p>{projectDetails.description}</p>
              </div>
            )}
            <div className="project-actions-section">
              <button 
                onClick={() => navigate(`/projects/${projectDetails._id}`)}
                className="view-project-button"
              >
                View Full Project Details
              </button>
            </div>
          </div>
        ) : (
          <div className="welcome-section">
            <h2>Welcome, {user?.name}!</h2>
            <p className="user-email">{user?.email}</p>
            <div className="welcome-message">
              <p>Select a project from the sidebar to view its details</p>
            </div>
          </div>
        )}
      </div>

      {showCreateDialog && (
        <CreateProjectDialog
          onClose={() => setShowCreateDialog(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
};

const AuthPage = () => {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="auth-content">
      {showRegister ? (
        <Register onToggle={() => setShowRegister(false)} />
      ) : (
        <Login onToggle={() => setShowRegister(true)} />
      )}
    </div>
  );
};

const ProjectDetailWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/projects/${id}`);
        setProject(response.data.data);
      } catch (error) {
        console.error('Failed to fetch project:', error);
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id, navigate]);

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <ProjectDetail
      project={project}
      onBack={() => navigate('/projects')}
    />
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAuthenticated && <Header />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage />
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetailWrapper />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/support" element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
