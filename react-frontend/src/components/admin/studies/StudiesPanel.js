import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes,
  faSpinner,
  faCalendarAlt,
  faPercent,
  faGraduationCap,
  faAward,
  faCodeBranch,
  faStickyNote
} from '@fortawesome/free-solid-svg-icons';
import './StudiesPanel.css';
import '../../../common/global.css';

const StudiesPanel = () => {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentStudy, setCurrentStudy] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    source: '',
    status: 'In Progress',
    progress: 0,
    start_date: '',
    completion_date: '',
    github_url: '',
    certificate_url: '',
    notes: ''
  });
  
  // Status options for dropdown
  const statusOptions = ['Planned', 'In Progress', 'Completed', 'On Hold'];
  
  // Category options for dropdown
  const categoryOptions = ['Course', 'Book', 'Project', 'Certification', 'Degree', 'Workshop', 'Other'];
  
  // Fetch studies on component mount
  useEffect(() => {
    fetchStudies();
  }, []);
  
  const fetchStudies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/studies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch studies');
      }
      
      const data = await response.json();
      setStudies(data);
    } catch (err) {
      console.error('Error fetching studies:', err);
      setError('Failed to load studies. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectStudy = (study) => {
    setCurrentStudy(study);
    setFormData({
      title: study.title,
      description: study.description || '',
      category: study.category || '',
      source: study.source || '',
      status: study.status || 'In Progress',
      progress: study.progress || 0,
      start_date: study.start_date ? study.start_date.substring(0, 10) : '',
      completion_date: study.completion_date ? study.completion_date.substring(0, 10) : '',
      github_url: study.github_url || '',
      certificate_url: study.certificate_url || '',
      notes: study.notes || ''
    });
    setEditMode(false);
  };
  
  const handleCreateNew = () => {
    setCurrentStudy(null);
    setFormData({
      title: '',
      description: '',
      category: 'Course',
      source: '',
      status: 'Planned',
      progress: 0,
      start_date: '',
      completion_date: '',
      github_url: '',
      certificate_url: '',
      notes: ''
    });
    setEditMode(true);
  };
  
  const handleEditStudy = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    if (currentStudy) {
      // Reset form to current study data
      setFormData({
        title: currentStudy.title,
        description: currentStudy.description || '',
        category: currentStudy.category || '',
        source: currentStudy.source || '',
        status: currentStudy.status || 'In Progress',
        progress: currentStudy.progress || 0,
        start_date: currentStudy.start_date ? currentStudy.start_date.substring(0, 10) : '',
        completion_date: currentStudy.completion_date ? currentStudy.completion_date.substring(0, 10) : '',
        github_url: currentStudy.github_url || '',
        certificate_url: currentStudy.certificate_url || '',
        notes: currentStudy.notes || ''
      });
    } else {
      // Clear form
      setFormData({
        title: '',
        description: '',
        category: 'Course',
        source: '',
        status: 'Planned',
        progress: 0,
        start_date: '',
        completion_date: '',
        github_url: '',
        certificate_url: '',
        notes: ''
      });
    }
    
    setEditMode(false);
  };
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      // Ensure progress stays between 0-100
      if (name === 'progress') {
        const numValue = parseInt(value, 10);
        setFormData({
          ...formData,
          [name]: Math.min(Math.max(numValue, 0), 100)
        });
      } else {
        setFormData({
          ...formData,
          [name]: parseInt(value, 10)
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // If status is changed to 'Completed', set progress to 100
    if (name === 'status' && value === 'Completed') {
      setFormData(prev => ({
        ...prev,
        progress: 100
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const method = currentStudy ? 'PUT' : 'POST';
      const url = currentStudy 
        ? `http://localhost:5001/api/admin/studies/${currentStudy.id}`
        : 'http://localhost:5001/api/admin/studies';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentStudy ? 'update' : 'create'} study`);
      }
      
      // Refresh studies list
      fetchStudies();
      
      // Exit edit mode
      setEditMode(false);
      
      // If creating new, clear current study
      if (!currentStudy) {
        setCurrentStudy(null);
      }
      
    } catch (err) {
      console.error(`Error ${currentStudy ? 'updating' : 'creating'} study:`, err);
      setError(`Failed to ${currentStudy ? 'update' : 'create'} study. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteStudy = async () => {
    if (!currentStudy) return;
    
    if (!window.confirm(`Are you sure you want to delete "${currentStudy.title}"?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/studies/${currentStudy.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete study');
      }
      
      // Refresh studies list
      fetchStudies();
      
      // Clear current study
      setCurrentStudy(null);
      
    } catch (err) {
      console.error('Error deleting study:', err);
      setError('Failed to delete study. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get icon based on study category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Course':
        return faBook;
      case 'Book':
        return faBook;
      case 'Project':
        return faCodeBranch;
      case 'Certification':
        return faAward;
      case 'Degree':
        return faGraduationCap;
      default:
        return faBook;
    }
  };
  
  // Get color based on study status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned':
        return '#6c757d';  // Gray
      case 'In Progress':
        return '#007bff';  // Blue
      case 'Completed':
        return '#28a745';  // Green
      case 'On Hold':
        return '#ffc107';  // Yellow
      default:
        return '#6c757d';  // Default gray
    }
  };
  
  // Group studies by status
  const groupedStudies = {
    'In Progress': studies.filter(study => study.status === 'In Progress'),
    'Completed': studies.filter(study => study.status === 'Completed'),
    'Planned': studies.filter(study => study.status === 'Planned'),
    'On Hold': studies.filter(study => study.status === 'On Hold')
  };
  
  return (
    <div className="studies-panel">
      <div className="studies-header">
        <h2>Learning & Studies</h2>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          <FontAwesomeIcon icon={faPlus} /> Add Study
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="studies-content">
        <div className="studies-list">
          {loading && !studies.length ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading studies...</p>
            </div>
          ) : studies.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faBook} />
              <p>No studies or learning materials found</p>
              <button onClick={handleCreateNew}>Add your first study</button>
            </div>
          ) : (
            <div className="studies-by-status">
              {Object.entries(groupedStudies).map(([status, statusStudies]) => (
                statusStudies.length > 0 && (
                  <div key={status} className="status-group">
                    <h3 className="status-title" style={{ color: getStatusColor(status) }}>
                      {status} <span className="status-count">({statusStudies.length})</span>
                    </h3>
                    <ul className="studies-items">
                      {statusStudies.map(study => (
                        <li 
                          key={study.id} 
                          className={`study-item ${currentStudy && currentStudy.id === study.id ? 'active' : ''}`}
                          onClick={() => handleSelectStudy(study)}
                        >
                          <div className="study-icon" style={{ backgroundColor: `${getStatusColor(status)}20`, color: getStatusColor(status) }}>
                            <FontAwesomeIcon icon={getCategoryIcon(study.category)} />
                          </div>
                          <div className="study-details">
                            <h4>{study.title}</h4>
                            <div className="study-category">
                              {study.category} {study.source && `• ${study.source}`}
                            </div>
                            {study.progress > 0 && (
                              <div className="progress-bar-container">
                                <div 
                                  className="progress-bar" 
                                  style={{ 
                                    width: `${study.progress}%`,
                                    backgroundColor: getStatusColor(study.status)
                                  }}
                                ></div>
                                <span className="progress-text">{study.progress}%</span>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
        
        <div className="study-detail">
          {loading && currentStudy ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading study details...</p>
            </div>
          ) : !currentStudy && !editMode ? (
            <div className="no-selection">
              <FontAwesomeIcon icon={faBook} />
              <p>Select a study or add a new one</p>
            </div>
          ) : (
            <div className="study-form-container">
              <div className="form-header">
                <h3>{editMode ? (currentStudy ? 'Edit Study' : 'Add New Study') : 'Study Details'}</h3>
                
                {!editMode && currentStudy && (
                  <div className="form-actions">
                    <button className="edit-btn" onClick={handleEditStudy}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="delete-btn" onClick={handleDeleteStudy}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              {editMode ? (
                <form className="study-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Title*</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., React Advanced Course"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category*</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        {categoryOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="source">Source</label>
                      <input
                        type="text"
                        id="source"
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        placeholder="e.g., Udemy, MIT, O'Reilly"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="status">Status*</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                      >
                        {statusOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="progress">Progress (%)</label>
                      <input
                        type="number"
                        id="progress"
                        name="progress"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={handleChange}
                        disabled={formData.status === 'Completed'}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="start_date">Start Date</label>
                      <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="completion_date">Completion Date</label>
                      <input
                        type="date"
                        id="completion_date"
                        name="completion_date"
                        value={formData.completion_date}
                        onChange={handleChange}
                        disabled={formData.status !== 'Completed'}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description*</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      required
                      placeholder="Describe what you're learning, key topics, etc."
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="github_url">GitHub URL</label>
                      <input
                        type="url"
                        id="github_url"
                        name="github_url"
                        value={formData.github_url}
                        onChange={handleChange}
                        placeholder="https://github.com/yourusername/repo"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="certificate_url">Certificate URL</label>
                      <input
                        type="url"
                        id="certificate_url"
                        name="certificate_url"
                        value={formData.certificate_url}
                        onChange={handleChange}
                        placeholder="Link to your certificate if available"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Additional notes, key learnings, etc."
                    />
                  </div>
                  
                  <div className="form-buttons">
                    <button type="submit" className="save-btn" disabled={loading}>
                      {loading ? <FontAwesomeIcon icon={faSpinner} className="spinner" /> : <FontAwesomeIcon icon={faSave} />}
                      {loading ? 'Saving...' : 'Save Study'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                  </div>
                </form>
              ) : currentStudy && (
                <div className="study-view">
                  <div className="study-header-details">
                    <div className="study-status-badge" style={{ backgroundColor: getStatusColor(currentStudy.status) }}>
                      {currentStudy.status}
                    </div>
                    <h2>{currentStudy.title}</h2>
                    <div className="study-meta">
                      <span className="study-category-badge">
                        <FontAwesomeIcon icon={getCategoryIcon(currentStudy.category)} />
                        {currentStudy.category}
                      </span>
                      {currentStudy.source && (
                        <span className="study-source">
                          {currentStudy.source}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {currentStudy.progress > 0 && (
                    <div className="study-progress">
                      <div className="progress-label">
                        <FontAwesomeIcon icon={faPercent} />
                        <span>Progress</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${currentStudy.progress}%`,
                            backgroundColor: getStatusColor(currentStudy.status)
                          }}
                        ></div>
                        <span className="progress-text">{currentStudy.progress}%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="study-dates">
                    <div className="date-item">
                      <div className="date-label">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>Started</span>
                      </div>
                      <div className="date-value">
                        {currentStudy.start_date ? formatDate(currentStudy.start_date) : 'Not started yet'}
                      </div>
                    </div>
                    
                    {currentStudy.status === 'Completed' && (
                      <div className="date-item">
                        <div className="date-label">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          <span>Completed</span>
                        </div>
                        <div className="date-value">
                          {currentStudy.completion_date ? formatDate(currentStudy.completion_date) : 'No completion date'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="study-description">
                    <h3>Description</h3>
                    <p>{currentStudy.description}</p>
                  </div>
                  
                  {currentStudy.notes && (
                    <div className="study-notes">
                      <h3>
                        <FontAwesomeIcon icon={faStickyNote} />
                        Notes
                      </h3>
                      <p>{currentStudy.notes}</p>
                    </div>
                  )}
                  
                  <div className="study-links">
                    {currentStudy.github_url && (
                      <a 
                        href={currentStudy.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="github-link"
                      >
                        <FontAwesomeIcon icon={faCodeBranch} />
                        View on GitHub
                      </a>
                    )}
                    
                    {currentStudy.certificate_url && (
                      <a 
                        href={currentStudy.certificate_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="certificate-link"
                      >
                        <FontAwesomeIcon icon={faAward} />
                        View Certificate
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudiesPanel;
