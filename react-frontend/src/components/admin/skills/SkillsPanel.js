import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes,
  faSpinner,
  faSort,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import './SkillsPanel.css';

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
  
  // Fetch skills on component mount
  useEffect(() => {
    fetchSkills();
  }, []);
  
  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/skills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      
      const data = await response.json();
      setSkills(data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(skill => skill.category))];
      setCategories(uniqueCategories);
      
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectSkill = (skill) => {
    setCurrentSkill(skill);
    setFormData({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency
    });
    setEditMode(false);
  };
  
  const handleCreateNew = () => {
    setCurrentSkill(null);
    setFormData({
      name: '',
      category: categories[0] || '',
      proficiency: 3
    });
    setEditMode(true);
  };
  
  const handleEditSkill = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    if (currentSkill) {
      // Reset form to current skill data
      setFormData({
        name: currentSkill.name,
        category: currentSkill.category,
        proficiency: currentSkill.proficiency
      });
    } else {
      // Clear form
      setFormData({
        name: '',
        category: categories[0] || '',
        proficiency: 3
      });
    }
    
    setEditMode(false);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'proficiency' ? parseInt(value, 10) : value
    });
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
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentSkill ? 'update' : 'create'} skill`);
      }
      
      // Refresh skills list
      fetchSkills();
      
      // Exit edit mode
      setEditMode(false);
      
      // If creating new, clear current skill
      if (!currentSkill) {
        setCurrentSkill(null);
      }
      
    } catch (err) {
      console.error(`Error ${currentSkill ? 'updating' : 'creating'} skill:`, err);
      setError(`Failed to ${currentSkill ? 'update' : 'create'} skill. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSkill = async () => {
    if (!currentSkill) return;
    
    if (!window.confirm(`Are you sure you want to delete "${currentSkill.name}"?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/skills/${currentSkill.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }
      
      // Refresh skills list
      fetchSkills();
      
      // Clear current skill
      setCurrentSkill(null);
      
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError('Failed to delete skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter skills by category
  const filteredSkills = filterCategory === 'all' 
    ? skills 
    : skills.filter(skill => skill.category === filterCategory);
  
  // Sort skills by name
  const sortedSkills = [...filteredSkills].sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className="skills-panel">
      <div className="skills-header">
        <div className="filter-section">
          <FontAwesomeIcon icon={faFilter} />
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <button className="new-skill-btn" onClick={handleCreateNew}>
          <FontAwesomeIcon icon={faPlus} /> New Skill
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="skills-content">
        <div className="skills-list">
          <div className="list-header">
            <h3>Your Skills</h3>
            <span className="skill-count">{filteredSkills.length} skills</span>
          </div>
          
          {loading && !skills.length ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading skills...</p>
            </div>
          ) : skills.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faCode} />
              <p>No skills found</p>
              <button onClick={handleCreateNew}>Add your first skill</button>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faFilter} />
              <p>No skills in this category</p>
              <button onClick={() => setFilterCategory('all')}>Show all skills</button>
            </div>
          ) : (
            <ul className="skill-items">
              {sortedSkills.map(skill => (
                <li 
                  key={skill.id} 
                  className={`skill-item ${currentSkill && currentSkill.id === skill.id ? 'active' : ''}`}
                  onClick={() => handleSelectSkill(skill)}
                >
                  <div className="skill-details">
                    <h4>{skill.name}</h4>
                    <span className="skill-category">{skill.category}</span>
                  </div>
                  <div className="skill-proficiency">
                    <div className="proficiency-bar">
                      <div 
                        className="proficiency-fill" 
                        style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="proficiency-level">{skill.proficiency}/5</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="skill-details-panel">
          {loading && currentSkill ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading skill details...</p>
            </div>
          ) : !currentSkill && !editMode ? (
            <div className="no-selection">
              <FontAwesomeIcon icon={faCode} />
              <p>Select a skill or create a new one</p>
            </div>
          ) : (
            <div className="skill-form-container">
              <div className="form-header">
                <h3>{editMode ? (currentSkill ? 'Edit Skill' : 'Create New Skill') : 'Skill Details'}</h3>
                
                {!editMode && currentSkill && (
                  <div className="form-actions">
                    <button className="edit-btn" onClick={handleEditSkill}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="delete-btn" onClick={handleDeleteSkill}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              {editMode ? (
                <form className="skill-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Skill Name*</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">Category*</label>
                    <div className="category-input">
                      <input
                        type="text"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Programming, Design, Soft Skills"
                        list="category-suggestions"
                      />
                      <datalist id="category-suggestions">
                        {categories.map(category => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </div>
                    <small className="helper-text">
                      You can use existing categories or create a new one
                    </small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="proficiency">
                      Proficiency Level* ({formData.proficiency}/5)
                    </label>
                    <input
                      type="range"
                      id="proficiency"
                      name="proficiency"
                      value={formData.proficiency}
                      onChange={handleChange}
                      min="1"
                      max="5"
                      step="1"
                      className="proficiency-slider"
                    />
                    <div className="proficiency-labels">
                      <span>Beginner</span>
                      <span>Intermediate</span>
                      <span>Expert</span>
                    </div>
                  </div>
                  
                  <div className="form-buttons">
                    <button type="submit" className="save-btn" disabled={loading}>
                      {loading ? <FontAwesomeIcon icon={faSpinner} className="spinner" /> : <FontAwesomeIcon icon={faSave} />}
                      {loading ? 'Saving...' : 'Save Skill'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                  </div>
                </form>
              ) : currentSkill && (
                <div className="skill-view">
                  <div className="skill-info">
                    <h2>{currentSkill.name}</h2>
                    <div className="skill-meta">
                      <div className="skill-category-badge">
                        <span>{currentSkill.category}</span>
                      </div>
                    </div>
                    
                    <div className="skill-proficiency-display">
                      <h3>Proficiency Level</h3>
                      <div className="proficiency-bar-large">
                        <div 
                          className="proficiency-fill" 
                          style={{ width: `${(currentSkill.proficiency / 5) * 100}%` }}
                        ></div>
                      </div>
                      <div className="proficiency-scale">
                        <span>Beginner</span>
                        <span>Intermediate</span>
                        <span>Expert</span>
                      </div>
                      <div className="proficiency-value">
                        {currentSkill.proficiency}/5
                      </div>
                    </div>
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

export default SkillsPanel;
