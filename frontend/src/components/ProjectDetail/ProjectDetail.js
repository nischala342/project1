import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import KanbanBoard from '../KanbanBoard';
import AddMemberDialog from '../AddMemberDialog';
import ProjectSettings from '../ProjectSettings';
import './ProjectDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ProjectDetail = ({ project, onBack }) => {
  const [projectData, setProjectData] = useState(project);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  const userRole = projectData?.userRole || project?.userRole;

  const fetchProjectDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/${project._id}`);
      setProjectData(response.data.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch project details');
    }
  };

  const fetchMembers = async () => {
    if (!['admin', 'manager', 'contributor', 'viewer'].includes(userRole)) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/projects/${project._id}/members`);
      setMembers(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      fetchProjectDetails();
      fetchMembers();
    }
  }, [project]);

  const canManageMembers = userRole === 'admin';
  const canCreateTasks = ['admin', 'manager', 'contributor'].includes(userRole);
  const canViewTasks = ['admin', 'manager', 'contributor', 'viewer'].includes(userRole);
  const canViewSettings = userRole === 'admin';

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      admin: 'role-admin',
      manager: 'role-manager',
      contributor: 'role-contributor',
      viewer: 'role-viewer',
    };
    return roleMap[role] || '';
  };

  return (
    <div className="project-detail-container">
      <div className="project-detail-header">
        <div>
          <button onClick={onBack} className="back-button">
            ← Back to Projects
          </button>
          <h2>{projectData?.name || project?.name}</h2>
          <div className="project-meta">
            <span className="project-key">Key: {projectData?.key || project?.key}</span>
            <span className={`role-badge ${getRoleBadgeClass(userRole)}`}>
              {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'No role'}
            </span>
          </div>
        </div>
      </div>

      <div className="project-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        {canViewTasks && (
          <button 
            className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
        )}
        {(canManageMembers || userRole === 'manager') && (
          <button 
            className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
        )}
        {canViewSettings && (
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        )}
      </div>

      <div className="project-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h3>Project Overview</h3>
            {projectData?.description && (
              <div className="project-description">
                <p>{projectData.description}</p>
              </div>
            )}
            <div className="project-info-grid">
              <div className="info-card">
                <h4>Your Role</h4>
                <p className={`role-text ${getRoleBadgeClass(userRole)}`}>
                  {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'No role'}
                </p>
              </div>
              <div className="info-card">
                <h4>Project Key</h4>
                <p>{projectData?.key || project?.key}</p>
              </div>
              <div className="info-card">
                <h4>Created</h4>
                <p>{new Date(projectData?.createdAt || project?.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="permissions-info">
              <h4>Your Permissions</h4>
              <div className="permissions-list">
                {userRole === 'admin' && (
                  <>
                    <span className="permission-badge">Full Access</span>
                    <span className="permission-badge">Manage Settings</span>
                    <span className="permission-badge">Manage Members</span>
                    <span className="permission-badge">Manage Tasks</span>
                    <span className="permission-badge">Create Tasks</span>
                    <span className="permission-badge">View All</span>
                  </>
                )}
                {userRole === 'manager' && (
                  <>
                    <span className="permission-badge">Assign Tasks</span>
                    <span className="permission-badge">Create Sprints</span>
                    <span className="permission-badge">Manage Deadlines</span>
                    <span className="permission-badge">Create Tasks</span>
                    <span className="permission-badge">Update Tasks</span>
                    <span className="permission-badge">View All</span>
                  </>
                )}
                {userRole === 'contributor' && (
                  <>
                    <span className="permission-badge">Create Tasks</span>
                    <span className="permission-badge">Update Assigned Tasks</span>
                    <span className="permission-badge">View Tasks</span>
                  </>
                )}
                {userRole === 'viewer' && (
                  <>
                    <span className="permission-badge">View Only</span>
                    <span className="permission-badge">Read Access</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && canViewTasks && (
          <div className="tab-content">
            <KanbanBoard projectId={project?._id || projectData?._id} userRole={userRole} />
          </div>
        )}

        {activeTab === 'members' && (canManageMembers || userRole === 'manager') && (
          <div className="tab-content">
            <div className="members-header">
              <h3>Project Members</h3>
              <button 
                className="create-button"
                onClick={() => setShowAddMemberDialog(true)}
              >
                Add Member
              </button>
            </div>
            {loading ? (
              <div className="loading">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="no-data">No members found</div>
            ) : (
              <div className="members-list">
                {members.map((member, idx) => (
                  <div key={idx} className="member-card">
                    <div className="member-info">
                      {member.user?.profilePicture ? (
                        <img 
                          src={member.user.profilePicture} 
                          alt={member.user.name}
                          className="member-avatar"
                        />
                      ) : (
                        <div className="member-avatar-placeholder">
                          {member.user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4>{member.user?.name}</h4>
                        <p>{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="member-actions">
                      <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      {canManageMembers && (
                        <button
                          className="update-role-button"
                          onClick={async () => {
                            const newRole = window.prompt(
                              `Current role: ${member.role}\nEnter new role (admin, manager, contributor, viewer):`
                            );
                            if (newRole && ['admin', 'manager', 'contributor', 'viewer'].includes(newRole.toLowerCase())) {
                              try {
                                await axios.put(
                                  `${API_URL}/api/projects/${project?._id || projectData?._id}/members/${member.user._id || member.user}`,
                                  { role: newRole.toLowerCase() }
                                );
                                fetchMembers();
                                setSuccess('Role updated successfully!');
                                setTimeout(() => setSuccess(null), 3000);
                              } catch (error) {
                                setError(error.response?.data?.error || 'Failed to update role');
                              }
                            }
                          }}
                        >
                          Update Role
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && canViewSettings && (
          <div className="tab-content">
            <ProjectSettings
              project={projectData || project}
              onUpdate={(updatedProject) => {
                setProjectData(updatedProject);
                setSuccess('Project updated successfully!');
                setTimeout(() => setSuccess(null), 3000);
              }}
              onDelete={() => {
                if (onBack) {
                  onBack();
                }
              }}
            />
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showAddMemberDialog && (
        <AddMemberDialog
          projectId={project?._id || projectData?._id}
          existingMembers={members}
          onClose={() => setShowAddMemberDialog(false)}
          onAdd={() => {
            fetchMembers();
            setSuccess('Member added successfully!');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
