import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes,
  faSpinner,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
  faSchool
} from '@fortawesome/free-solid-svg-icons';
import './EducationPanel.css';

const EducationPanel = () => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentEducation, setCurrentEducation] = useState(null);
  const [formData, setFormData] = useState({
    degree: '',
    school: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
    order: 0
  });
  
  // Fetch education entries on component mount
  useEffect(() => {
    fetchEducation();
  }, []);
  
  const fetchEducation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/education', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch education entries');
      }
      
      const data = await response.json();
      setEducation(data);
    } catch (err) {
      console.error('Error fetching education:', err);
      setError('Failed to load education entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectEducation = (edu) => {
    setCurrentEducation(edu);
    setFormData({
      degree: edu.degree,
      school: edu.school,
      description: edu.description || '',
      start_date: edu.start_date ? edu.start_date.substring(0, 10) : '',
      end_date: edu.end_date ? edu.end_date.substring(0, 10) : '',
      is_current: edu.is_current,
      order: edu.order
    });
    setEditMode(false);
  };
  
  const handleCreateNew = () => {
    setCurrentEducation(null);
    // Set default order to highest order + 1
    const highestOrder = education.length > 0 
      ? Math.max(...education.map(edu => edu.order)) 
      : 0;
    
    setFormData({
      degree: '',
      school: '',
      description: '',
      start_date: '',
      end_date: '',
      is_current: false,
      order: highestOrder + 1
    });
    setEditMode(true);
  };
  
  const handleEditEducation = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    if (currentEducation) {
      // Reset form to current education data
      setFormData({
        degree: currentEducation.degree,
        school: currentEducation.school,
        description: currentEducation.description || '',
        start_date: currentEducation.start_date ? currentEducation.start_date.substring(0, 10) : '',
        end_date: currentEducation.end_date ? currentEducation.end_date.substring(0, 10) : '',
        is_current: currentEducation.is_current,
        order: currentEducation.order
      });
    } else {
      // Clear form
      setFormData({
        degree: '',
        school: '',
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
      const method = currentEducation ? 'PUT' : 'POST';
      const url = currentEducation 
        ? `http://localhost:5001/api/admin/education/${currentEducation.id}`
        : 'http://localhost:5001/api/admin/education';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentEducation ? 'update' : 'create'} education entry`);
      }
      
      // Refresh education list
      fetchEducation();
      
      // Exit edit mode
      setEditMode(false);
      
      // If creating new, clear current education
      if (!currentEducation) {
        setCurrentEducation(null);
      }
      
    } catch (err) {
      console.error(`Error ${currentEducation ? 'updating' : 'creating'} education:`, err);
      setError(`Failed to ${currentEducation ? 'update' : 'create'} education entry. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteEducation = async () => {
    if (!currentEducation) return;
    
    if (!window.confirm(`Are you sure you want to delete "${currentEducation.degree} at ${currentEducation.school}"?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/education/${currentEducation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete education entry');
      }
      
      // Refresh education list
      fetchEducation();
      
      // Clear current education
      setCurrentEducation(null);
      
    } catch (err) {
      console.error('Error deleting education:', err);
      setError('Failed to delete education entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMoveEducation = async (id, direction) => {
    const eduIndex = education.findIndex(edu => edu.id === id);
    
    if (
      (direction === 'up' && eduIndex === 0) || 
      (direction === 'down' && eduIndex === education.length - 1)
    ) {
      return; // Already at the edge
    }
    
    const currentEdu = education[eduIndex];
    const adjacentEdu = education[direction === 'up' ? eduIndex - 1 : eduIndex + 1];
    
    // Swap orders
    const newOrder = adjacentEdu.order;
    const adjacentNewOrder = currentEdu.order;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // Update current education order
      await fetch(`http://localhost:5001/api/admin/education/${currentEdu.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order: newOrder })
      });
      
      // Update adjacent education order
      await fetch(`http://localhost:5001/api/admin/education/${adjacentEdu.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ order: adjacentNewOrder })
      });
      
      // Refresh education list
      fetchEducation();
      
    } catch (err) {
      console.error('Error reordering education:', err);
      setError('Failed to reorder education entries. Please try again.');
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
  
  // Sort education by order (higher order = more recent/important)
  const sortedEducation = [...education].sort((a, b) => b.order - a.order);
  
  return (
    <div className="education-panel">
      <div className="education-header">
        <h2>Education History</h2>
        <button className="new-education-btn" onClick={handleCreateNew}>
          <FontAwesomeIcon icon={faPlus} /> Add Education
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="education-content">
        <div className="education-list">
          {loading && !education.length ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading education history...</p>
            </div>
          ) : education.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faGraduationCap} />
              <p>No education entries found</p>
              <button onClick={handleCreateNew}>Add your first education</button>
            </div>
          ) : (
            <ul className="education-items">
              {sortedEducation.map((edu, index) => (
                <li 
                  key={edu.id} 
                  className={`education-item ${currentEducation && currentEducation.id === edu.id ? 'active' : ''}`}
                >
                  <div 
                    className="education-item-content"
                    onClick={() => handleSelectEducation(edu)}
                  >
                    <div className="education-icon">
                      <FontAwesomeIcon icon={faGraduationCap} />
                    </div>
                    <div className="education-details">
                      <h4>{edu.degree}</h4>
                      <div className="education-school">
                        <FontAwesomeIcon icon={faSchool} />
                        <span>{edu.school}</span>
                      </div>
                      <div className="education-dates">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        <span>
                          {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="education-actions">
                    <button 
                      className="move-btn move-up" 
                      disabled={index === 0}
                      onClick={() => handleMoveEducation(edu.id, 'up')}
                      title="Move up (more recent)"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button 
                      className="move-btn move-down" 
                      disabled={index === sortedEducation.length - 1}
                      onClick={() => handleMoveEducation(edu.id, 'down')}
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
        
        <div className="education-detail">
          {loading && currentEducation ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading education details...</p>
            </div>
          ) : !currentEducation && !editMode ? (
            <div className="no-selection">
              <FontAwesomeIcon icon={faGraduationCap} />
              <p>Select an education entry or add a new one</p>
            </div>
          ) : (
            <div className="education-form-container">
              <div className="form-header">
                <h3>{editMode ? (currentEducation ? 'Edit Education' : 'Add New Education') : 'Education Details'}</h3>
                
                {!editMode && currentEducation && (
                  <div className="form-actions">
                    <button className="edit-btn" onClick={handleEditEducation}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="delete-btn" onClick={handleDeleteEducation}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              {editMode ? (
                <form className="education-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="degree">Degree / Certification*</label>
                    <input
                      type="text"
                      id="degree"
                      name="degree"
                      value={formData.degree}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Bachelor of Science in Computer Science"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="school">School / Institution*</label>
                    <input
                      type="text"
                      id="school"
                      name="school"
                      value={formData.school}
                      onChange={handleChange}
                      required
                      placeholder="e.g., University of Technology"
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
                    <label htmlFor="is_current">Currently studying here</label>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe your studies, achievements, courses, etc."
                    />
                  </div>
                  
                  <div className="form-buttons">
                    <button type="submit" className="save-btn" disabled={loading}>
                      {loading ? <FontAwesomeIcon icon={faSpinner} className="spinner" /> : <FontAwesomeIcon icon={faSave} />}
                      {loading ? 'Saving...' : 'Save Education'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                  </div>
                </form>
              ) : currentEducation && (
                <div className="education-view">
                  <div className="education-header-details">
                    <h2>{currentEducation.degree}</h2>
                    <div className="education-school-name">
                      <FontAwesomeIcon icon={faSchool} />
                      <span>{currentEducation.school}</span>
                    </div>
                  </div>
                  
                  <div className="education-dates-display">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>
                      {formatDate(currentEducation.start_date)} - {currentEducation.is_current ? 'Present' : formatDate(currentEducation.end_date)}
                    </span>
                  </div>
                  
                  {currentEducation.description && (
                    <div className="education-description">
                      <h3>Description</h3>
                      <p>{currentEducation.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EducationPanel;
