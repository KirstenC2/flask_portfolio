import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBriefcase, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes,
  faSpinner,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
  faBuilding
} from '@fortawesome/free-solid-svg-icons';
import './ExperiencePanel.css';

const ExperiencePanel = () => {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
    order: 0
  });
  
  // Fetch experience entries on component mount
  useEffect(() => {
    fetchExperience();
  }, []);
  
  const fetchExperience = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/experience', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch experience entries');
      }
      
      const data = await response.json();
      setExperience(data);
    } catch (err) {
      console.error('Error fetching experience:', err);
      setError('Failed to load experience entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectExperience = (exp) => {
    setCurrentExperience(exp);
    setFormData({
      title: exp.title,
      company: exp.company,
      description: exp.description || '',
      start_date: exp.start_date ? exp.start_date.substring(0, 10) : '',
      end_date: exp.end_date ? exp.end_date.substring(0, 10) : '',
      is_current: exp.is_current,
      order: exp.order
    });
    setEditMode(false);
  };
  
  const handleCreateNew = () => {
    setCurrentExperience(null);
    // Set default order to highest order + 1
    const highestOrder = experience.length > 0 
      ? Math.max(...experience.map(exp => exp.order)) 
      : 0;
    
    setFormData({
      title: '',
      company: '',
      description: '',
      start_date: '',
      end_date: '',
      is_current: false,
      order: highestOrder + 1
    });
    setEditMode(true);
  };
  
  const handleEditExperience = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    if (currentExperience) {
      // Reset form to current experience data
      setFormData({
        title: currentExperience.title,
        company: currentExperience.company,
        description: currentExperience.description || '',
        start_date: currentExperience.start_date ? currentExperience.start_date.substring(0, 10) : '',
        end_date: currentExperience.end_date ? currentExperience.end_date.substring(0, 10) : '',
        is_current: currentExperience.is_current,
        order: currentExperience.order
      });
    } else {
      // Clear form
      setFormData({
        title: '',
        company: '',
        description: '',
        start_date: '',
        end_date: '',
        is_current: false,
        order: 0
      });
    }
    
    setEditMode(false);
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
        // Clear end date if "is current" is checked
        ...(name === 'is_current' && checked ? { end_date: '' } : {})
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const method = currentExperience ? 'PUT' : 'POST';
      const url = currentExperience 
        ? `http://localhost:5001/api/admin/experience/${currentExperience.id}`
        : 'http://localhost:5001/api/admin/experience';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentExperience ? 'update' : 'create'} experience entry`);
      }
      
      // Refresh experience list
      fetchExperience();
      
      // Exit edit mode
      setEditMode(false);
      
      // If creating new, clear current experience
      if (!currentExperience) {
        setCurrentExperience(null);
      }
      
    } catch (err) {
      console.error(`Error ${currentExperience ? 'updating' : 'creating'} experience:`, err);
      setError(`Failed to ${currentExperience ? 'update' : 'create'} experience entry. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteExperience = async () => {
    if (!currentExperience) return;
    
    if (!window.confirm(`Are you sure you want to delete "${currentExperience.title} at ${currentExperience.company}"?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/experience/${currentExperience.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete experience entry');
      }
      
      // Refresh experience list
      fetchExperience();
      
      // Clear current experience
      setCurrentExperience(null);
      
    } catch (err) {
      console.error('Error deleting experience:', err);
      setError('Failed to delete experience entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMoveExperience = async (id, direction) => {
    const expIndex = experience.findIndex(exp => exp.id === id);
    
    if (
      (direction === 'up' && expIndex === 0) || 
      (direction === 'down' && expIndex === experience.length - 1)
    ) {
      return; // Already at the edge
    }
    
    const currentExp = experience[expIndex];
    const adjacentExp = experience[direction === 'up' ? expIndex - 1 : expIndex + 1];
    
    // Swap orders
    const newOrder = adjacentExp.order;
    const adjacentNewOrder = currentExp.order;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // Update current experience order
      await fetch(`http://localhost:5001/api/admin/experience/${currentExp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order: newOrder })
      });
      
      // Update adjacent experience order
      await fetch(`http://localhost:5001/api/admin/experience/${adjacentExp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order: adjacentNewOrder })
      });
      
      // Refresh experience list
      fetchExperience();
      
    } catch (err) {
      console.error('Error reordering experience:', err);
      setError('Failed to reorder experience entries. Please try again.');
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
      month: 'long'
    });
  };
  
  // Sort experience by order (higher order = more recent/important)
  const sortedExperience = [...experience].sort((a, b) => b.order - a.order);
  
  return (
    <div className="experience-panel">
      <div className="experience-header">
        <h2>Work Experience</h2>
        <button className="new-experience-btn" onClick={handleCreateNew}>
          <FontAwesomeIcon icon={faPlus} /> Add Experience
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="experience-content">
        <div className="experience-list">
          {loading && !experience.length ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading work experience...</p>
            </div>
          ) : experience.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faBriefcase} />
              <p>No work experience entries found</p>
              <button onClick={handleCreateNew}>Add your first job</button>
            </div>
          ) : (
            <ul className="experience-items">
              {sortedExperience.map((exp, index) => (
                <li 
                  key={exp.id} 
                  className={`experience-item ${currentExperience && currentExperience.id === exp.id ? 'active' : ''}`}
                >
                  <div 
                    className="experience-item-content"
                    onClick={() => handleSelectExperience(exp)}
                  >
                    <div className="experience-icon">
                      <FontAwesomeIcon icon={faBriefcase} />
                    </div>
                    <div className="experience-details">
                      <h4>{exp.title}</h4>
                      <div className="experience-company">
                        <FontAwesomeIcon icon={faBuilding} />
                        <span>{exp.company}</span>
                      </div>
                      <div className="experience-dates">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>
                          {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="experience-actions">
                    <button 
                      className="move-btn move-up" 
                      disabled={index === 0}
                      onClick={() => handleMoveExperience(exp.id, 'up')}
                      title="Move up (more recent)"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button 
                      className="move-btn move-down" 
                      disabled={index === sortedExperience.length - 1}
                      onClick={() => handleMoveExperience(exp.id, 'down')}
                      title="Move down (less recent)"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="experience-detail">
          {loading && currentExperience ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading experience details...</p>
            </div>
          ) : !currentExperience && !editMode ? (
            <div className="no-selection">
              <FontAwesomeIcon icon={faBriefcase} />
              <p>Select a work experience entry or add a new one</p>
            </div>
          ) : (
            <div className="experience-form-container">
              <div className="form-header">
                <h3>{editMode ? (currentExperience ? 'Edit Experience' : 'Add New Experience') : 'Experience Details'}</h3>
                
                {!editMode && currentExperience && (
                  <div className="form-actions">
                    <button className="edit-btn" onClick={handleEditExperience}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="delete-btn" onClick={handleDeleteExperience}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              {editMode ? (
                <form className="experience-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Job Title*</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="company">Company*</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Tech Solutions Inc."
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="start_date">Start Date*</label>
                      <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="end_date">End Date</label>
                      <input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        disabled={formData.is_current}
                      />
                    </div>
                  </div>
                  
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="is_current"
                      name="is_current"
                      checked={formData.is_current}
                      onChange={handleChange}
                    />
                    <label htmlFor="is_current">I currently work here</label>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Job Description*</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      required
                      placeholder="Describe your responsibilities, achievements, technologies used, etc."
                    />
                  </div>
                  
                  <div className="form-buttons">
                    <button type="submit" className="save-btn" disabled={loading}>
                      {loading ? <FontAwesomeIcon icon={faSpinner} className="spinner" /> : <FontAwesomeIcon icon={faSave} />}
                      {loading ? 'Saving...' : 'Save Experience'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                  </div>
                </form>
              ) : currentExperience && (
                <div className="experience-view">
                  <div className="experience-header-details">
                    <h2>{currentExperience.title}</h2>
                    <div className="experience-company-name">
                      <FontAwesomeIcon icon={faBuilding} />
                      <span>{currentExperience.company}</span>
                    </div>
                  </div>
                  
                  <div className="experience-dates-display">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>
                      {formatDate(currentExperience.start_date)} - {currentExperience.is_current ? 'Present' : formatDate(currentExperience.end_date)}
                    </span>
                  </div>
                  
                  <div className="experience-description">
                    <h3>Job Description</h3>
                    <p>{currentExperience.description}</p>
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

export default ExperiencePanel;
