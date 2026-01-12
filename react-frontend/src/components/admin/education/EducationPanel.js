import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap, faPlus, faEdit, faTrash, faSave, faTimes,
  faSpinner, faCalendarAlt, faSchool, faBook
} from '@fortawesome/free-solid-svg-icons';
import './EducationPanel.css';
import '../../../common/global.css';
const EducationPanel = () => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentEducation, setCurrentEducation] = useState(null);
  const [formData, setFormData] = useState({
    degree: '', school: '', description: '', start_date: '', end_date: '', is_current: false, order: 0
  });

  useEffect(() => { fetchEducation(); }, []);

  const fetchEducation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/education', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEducation(data);
    } catch (err) {
      setError('Failed to load education entries.');
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
    const highestOrder = education.length > 0 ? Math.max(...education.map(e => e.order)) : 0;
    setFormData({ degree: '', school: '', description: '', start_date: '', end_date: '', is_current: false, order: highestOrder + 1 });
    setEditMode(true);
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

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      setEditMode(false);
      fetchEducation();
    } catch (err) {
      setError('Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentEducation || !window.confirm(`Delete education: ${currentEducation.degree}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`http://localhost:5001/api/admin/education/${currentEducation.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentEducation(null);
      fetchEducation();
    } catch (err) {
      setError('Delete failed.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="admin-container">
      {/* LEFT SIDE: EDUCATION LIST */}
      <div className={`list-section ${editMode || currentEducation ? 'shrink' : ''}`}>
        <div className="section-header">
          <h1>Education</h1>
          <button className="btn btn-primary" onClick={handleCreateNew}>
            <FontAwesomeIcon icon={faPlus} /> Add Degree
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="experience-items-list">
          {[...education].sort((a, b) => b.order - a.order).map((edu) => (
            <div
              key={edu.id}
              className={`experience-card-item ${currentEducation?.id === edu.id ? 'active' : ''}`}
              onClick={() => handleSelectEducation(edu)}
            >
              <div className="card-main">
                <div className="card-icon"><FontAwesomeIcon icon={faGraduationCap} /></div>
                <div className="card-info">
                  <div className="post-title-cell">{edu.degree}</div>
                  <div className="date-text">{edu.school}</div>
                </div>
                {edu.is_current && <span className="tag-pill">Studying</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: EDITOR / DETAILS */}
      {(editMode || currentEducation) && (
        <div className="editor-sidepanel">
          <div className="sidepanel-header">
            <h2>{editMode ? (currentEducation ? 'Edit Education' : 'New Education') : 'Education Details'}</h2>
            <button className="btn-close" onClick={() => { setEditMode(false); setCurrentEducation(null); }}>✕</button>
          </div>

          {editMode ? (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row-group">
                <div className="form-row">
                  <label>Degree / Certification</label>
                  <input className="form-control" value={formData.degree} onChange={e => setFormData({ ...formData, degree: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>School</label>
                  <input className="form-control" value={formData.school} onChange={e => setFormData({ ...formData, school: e.target.value })} required />
                </div>
              </div>

              <div className="form-row-group">
                <div className="form-row">
                  <label>Start Date</label>
                  <input type="date" className="form-control" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>End Date</label>
                  <input type="date" className="form-control" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} disabled={formData.is_current} />
                </div>
              </div>

              <div className="form-check-row">
                <input type="checkbox" id="is_current" checked={formData.is_current} onChange={e => setFormData({ ...formData, is_current: e.target.checked, end_date: e.target.checked ? '' : formData.end_date })} />
                <label htmlFor="is_current">I am currently studying here</label>
              </div>

              <div className="form-row">
                <label>Description / Achievements</label>
                <textarea className="form-control markdown-editor" rows={8} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                   <FontAwesomeIcon icon={faSave} /> Save Education
                </button>
                <button type="button" className="btn" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="experience-view">
              <div className="view-header">
                <h3>{currentEducation.degree}</h3>
                <p className="company-subtitle"><FontAwesomeIcon icon={faSchool} /> {currentEducation.school}</p>
                <p className="date-display">
                  <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(currentEducation.start_date)} — {currentEducation.is_current ? 'Present' : formatDate(currentEducation.end_date)}
                </p>
              </div>

              <div className="view-content">
                <label><FontAwesomeIcon icon={faBook} /> Description & Achievements</label>
                <p className="description-text" style={{ whiteSpace: 'pre-wrap' }}>{currentEducation.description || 'No description provided.'}</p>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                  <FontAwesomeIcon icon={faEdit} /> Edit Education
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EducationPanel;