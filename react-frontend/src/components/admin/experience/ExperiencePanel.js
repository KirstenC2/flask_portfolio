import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase, faPlus, faEdit, faSave, faCalendarAlt, faBuilding
} from '@fortawesome/free-solid-svg-icons';
import RelatedProjects from './ExperienceProjectsPanel';
import './ExperiencePanel.css';
import '../../../common/global.css';
import TaskManager from './TaskManager';

const ExperiencePanel = () => {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [formData, setFormData] = useState({
    title: '', company: '', description: '', start_date: '', end_date: '', is_current: false, order: 0, leaving_reason: ''
  });

  useEffect(() => { fetchExperience(); }, []);

  const fetchExperience = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/experience', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setExperience(data);
      
      // 如果當前有選中的項目，同步更新它
      if (currentExperience) {
        const updated = data.find(exp => exp.id === currentExperience.id);
        if (updated) setCurrentExperience(updated);
      }
    } catch (err) {
      setError('Failed to load experience entries.');
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
      leaving_reason: exp.leaving_reason || '',
      order: exp.order
    });
    setEditMode(false);
  };

  const handleCreateNew = () => {
    setCurrentExperience(null);
    const highestOrder = experience.length > 0 ? Math.max(...experience.map(exp => exp.order)) : 0;
    setFormData({ title: '', company: '', description: '', start_date: '', end_date: '', is_current: false, order: highestOrder + 1, leaving_reason: '' });
    setEditMode(true);
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

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      setEditMode(false);
      fetchExperience();
    } catch (err) {
      setError('Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="admin-container">
      {/* LEFT SIDE: LIST */}
      <div className={`list-section ${editMode || currentExperience ? 'shrink' : ''}`}>
        <div className="section-header">
          <h1>Experience</h1>
          <button className="btn btn-primary" onClick={handleCreateNew}><FontAwesomeIcon icon={faPlus} /> Add Job</button>
        </div>
        <div className="experience-items-list">
          {[...experience].sort((a, b) => b.order - a.order).map((exp) => (
            <div key={exp.id} className={`experience-card-item ${currentExperience?.id === exp.id ? 'active' : ''}`} onClick={() => handleSelectExperience(exp)}>
              <div className="card-main">
                <div className="card-icon"><FontAwesomeIcon icon={faBriefcase} /></div>
                <div className="card-info">
                  <div className="post-title-cell">{exp.title}</div>
                  <div className="date-text">{exp.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: EDITOR / DETAILS */}
      {(editMode || currentExperience) && (
        <div className="editor-sidepanel">
          <div className="sidepanel-header">
            <h2>{editMode ? 'Edit Job' : 'Job Details'}</h2>
            <button className="btn-close" onClick={() => { setEditMode(false); setCurrentExperience(null); }}>✕</button>
          </div>

          {editMode ? (
            <div className="edit-scroll-container">
              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <label>Job Title</label>
                  <input className="form-control" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                </div>

                <div className="form-row">
                  <label>Company</label>
                  <input className="form-control" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} required />
                </div>

                <div className="form-row-group">
                  <div className="form-row">
                    <label>Start Date</label>
                    <input type="date" className="form-control" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                  </div>
                  <div className="form-row">
                    <label>End Date</label>
                    <input type="date" className="form-control" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} disabled={formData.is_current} required={!formData.is_current} />
                  </div>
                </div>

                <div className="form-row checkbox-row">
                  <label className="checkbox-container">
                    <input type="checkbox" checked={formData.is_current} onChange={e => setFormData({ ...formData, is_current: e.target.checked })} />
                    <span className="checkbox-label">I currently work here</span>
                  </label>
                </div>

                <div className="form-row">
                  <label>Default Description (Fallback)</label>
                  <textarea className="form-control" rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="form-row">
                  <label>Reason for Leaving</label>
                  <input className="form-control" value={formData.leaving_reason} onChange={e => setFormData({ ...formData, leaving_reason: e.target.value })} />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary"><FontAwesomeIcon icon={faSave} /> Save Job</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </form>

              {/* 在編輯模式下也顯示描述版本管理 */}
              {currentExperience && (
                <TaskManager 
                  experienceId={currentExperience.id} 
                  tasks={currentExperience.tasks || []} 
                  onRefresh={fetchExperience} 
                />
              )}
            </div>
          ) : (
            <div className="experience-view">
              <div className="view-header">
                <h3>{currentExperience.title}</h3>
                <p><FontAwesomeIcon icon={faBuilding} /> {currentExperience.company}</p>
                <p><FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(currentExperience.start_date)} — {currentExperience.is_current ? 'Present' : formatDate(currentExperience.end_date)}</p>
              </div>

              <div className="view-content">
                <label style={{fontWeight:'bold', color:'#666'}}>Active Resume Description:</label>
                <p className="description-text" style={{background:'#f9f9f9', padding:'10px', borderRadius:'4px', borderLeft:'4px solid #007bff'}}>
                  {currentExperience.descriptions?.find(d => d.is_active)?.content || currentExperience.description || "No description set."}
                </p>
              </div>

              {/* 詳情模式下也顯示管理表格，方便快速切換 Active */}
              <TaskManager 
                experienceId={currentExperience.id} 
                tasks={currentExperience.tasks || []} 
                onRefresh={fetchExperience} 
              />

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                  <FontAwesomeIcon icon={faEdit} /> Edit Core Info
                </button>
              </div>

              <RelatedProjects
                experienceId={currentExperience.id}
                companyName={currentExperience.company}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExperiencePanel;