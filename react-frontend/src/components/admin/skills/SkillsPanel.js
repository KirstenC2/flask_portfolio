import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, faPlus, faEdit, faTrash, faSave, faTimes,
  faSpinner, faFilter, faLayerGroup, faSignal
} from '@fortawesome/free-solid-svg-icons';
import './SkillsPanel.css'; // Standardized admin styles
import '../../../common/global.css'
const SkillsPanel = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentSkill, setCurrentSkill] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    proficiency: 3
  });

  useEffect(() => { fetchSkills(); }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSkills(data);
      setCategories([...new Set(data.map(skill => skill.category))]);
    } catch (err) {
      setError('Failed to load skills.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSkill = (skill) => {
    setCurrentSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      description: skill.description
    });
    setEditMode(false);
  };

  const handleCreateNew = () => {
    setCurrentSkill(null);
    setFormData({ name: '', category: categories[0] || '', proficiency: 3 });
    setEditMode(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const method = currentSkill ? 'PUT' : 'POST';
      const url = currentSkill 
        ? `http://localhost:5001/api/admin/skills/${currentSkill.id}`
        : 'http://localhost:5001/api/admin/skills';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      setEditMode(false);
      fetchSkills();
    } catch (err) {
      setError('Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentSkill || !window.confirm(`Delete skill: ${currentSkill.name}?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`http://localhost:5001/api/admin/skills/${currentSkill.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentSkill(null);
      fetchSkills();
    } catch (err) {
      setError('Delete failed.');
    }
  };

  const filteredSkills = filterCategory === 'all' 
    ? skills 
    : skills.filter(skill => skill.category === filterCategory);

  const sortedSkills = [...filteredSkills].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="admin-container">
      {/* LEFT SIDE: SKILLS LIST */}
      <div className={`list-section ${editMode || currentSkill ? 'shrink' : ''}`}>
        <div className="section-header">
          <h1>Skills</h1>
          <div className="header-actions">
             <div className="filter-wrapper">
                <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="category-select-mini"
                >
                    <option value="all">All</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
             </div>
            <button className="btn btn-primary" onClick={handleCreateNew}>
                <FontAwesomeIcon icon={faPlus} /> New Skill
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="experience-items-list">
          {sortedSkills.map((skill) => (
            <div
              key={skill.id}
              className={`experience-card-item ${currentSkill?.id === skill.id ? 'active' : ''}`}
              onClick={() => handleSelectSkill(skill)}
            >
              <div className="card-main">
                <div className="card-icon"><FontAwesomeIcon icon={faCode} /></div>
                <div className="card-info">
                  <div className="post-title-cell">{skill.name}</div>
                  <div className="date-text">{skill.category}</div>
                  <div className="date-text">{skill.description}</div>
                </div>
                <div className="skill-indicator">
                    <div className="mini-bar">
                        <div className="mini-fill" style={{ width: `${(skill.proficiency / 5) * 100}%` }}></div>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: EDITOR / DETAILS */}
      {(editMode || currentSkill) && (
        <div className="editor-sidepanel">
          <div className="sidepanel-header">
            <h2>{editMode ? (currentSkill ? 'Edit Skill' : 'New Skill') : 'Skill Details'}</h2>
            <button className="btn-close" onClick={() => { setEditMode(false); setCurrentSkill(null); }}>✕</button>
          </div>

          {editMode ? (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <label>Skill Name</label>
                <input 
                    className="form-control" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                />
              </div>

              <div className="form-row">
                <label>Category</label>
                <input 
                    className="form-control" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    list="category-suggestions"
                    required 
                />
                <datalist id="category-suggestions">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>

              <div className="form-row">
                <label>Proficiency Level ({formData.proficiency}/5)</label>
                <div className="range-container">
                    <input 
                        type="range" 
                        className="proficiency-slider" 
                        min="1" max="5" 
                        value={formData.proficiency} 
                        onChange={e => setFormData({...formData, proficiency: parseInt(e.target.value)})} 
                    />
                    <div className="range-labels">
                        <span>Beginner</span>
                        <span>Expert</span>
                    </div>
                </div>
              </div>

              <div className="form-row">
                <label>Description</label>
                <textarea 
                    className="form-control" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    required 
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  <FontAwesomeIcon icon={faSave} /> Save Skill
                </button>
                <button type="button" className="btn" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="experience-view">
              <div className="view-header">
                <h3>{currentSkill.name}</h3>
                <p className="company-subtitle">
                    <FontAwesomeIcon icon={faLayerGroup} /> {currentSkill.category}
                </p>
              </div>

              <div className="view-content">
                <label><FontAwesomeIcon icon={faSignal} /> Mastery</label>
                <div className="proficiency-display-large">
                    <div className="proficiency-bar-bg">
                        <div 
                            className="proficiency-bar-fill" 
                            style={{ width: `${(currentSkill.proficiency / 5) * 100}%` }}
                        ></div>
                    </div>
                    <div className="proficiency-text">
                        Level {currentSkill.proficiency} of 5
                    </div>
                </div>
              </div>

              <div className="form-row">
                <div className='view-content'>
                  <label className='description-label'>Description</label>
                  <p className='description-text'>{currentSkill.description}</p>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                  <FontAwesomeIcon icon={faEdit} /> Edit Skill
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

export default SkillsPanel;