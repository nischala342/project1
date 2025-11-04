import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import SupportRequestDialog from '../SupportRequestDialog';
import './Support.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000'

const Support = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState(null);
  const isAdmin = user?.role?.name === 'admin';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/support`);
      setRequests(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch support requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (requestData) => {
    try {
      await axios.post(`${API_URL}/api/support`, requestData);
      setShowDialog(false);
      fetchRequests();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create support request');
    }
  };

  const handleResolve = async (id, adminResponse) => {
    try {
      await axios.put(`${API_URL}/api/support/${id}/resolve`, {
        adminResponse: adminResponse || 'Request resolved',
      });
      fetchRequests();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resolve request');
    }
  };

  const handleReject = async (id, adminResponse) => {
    try {
      await axios.put(`${API_URL}/api/support/${id}/reject`, {
        adminResponse: adminResponse || 'Request rejected',
      });
      fetchRequests();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return '#51cf66';
      case 'rejected':
        return '#ff6b6b';
      default:
        return '#ffd43b';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <h2>Customer Support</h2>
        <button onClick={() => setShowDialog(true)} className="create-request-button">
          Create Support Request
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="no-requests">No support requests found</div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div>
                  <h3>{request.subject}</h3>
                  {isAdmin && (
                    <p className="request-user">From: {request.user?.name || request.user?.email}</p>
                  )}
                </div>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(request.status) }}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>
              <p className="request-message">{request.message}</p>
              <div className="request-footer">
                <span className="request-date">
                  Created: {new Date(request.createdAt).toLocaleString()}
                </span>
                {request.resolvedAt && (
                  <span className="request-date">
                    {request.status === 'resolved' ? 'Resolved' : 'Rejected'}:{' '}
                    {new Date(request.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {request.adminResponse && (
                <div className="admin-response">
                  <strong>Admin Response:</strong> {request.adminResponse}
                </div>
              )}
              {isAdmin && request.status === 'pending' && (
                <div className="admin-actions">
                  <button
                    onClick={() => {
                      const response = window.prompt('Enter admin response (optional):');
                      if (response !== null) {
                        handleResolve(request._id, response);
                      }
                    }}
                    className="action-button resolve-button"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => {
                      const response = window.prompt('Enter rejection reason (optional):');
                      if (response !== null) {
                        handleReject(request._id, response);
                      }
                    }}
                    className="action-button reject-button"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <SupportRequestDialog
          onClose={() => setShowDialog(false)}
          onSubmit={handleCreateRequest}
        />
      )}
    </div>
  );
};

export default Support;
