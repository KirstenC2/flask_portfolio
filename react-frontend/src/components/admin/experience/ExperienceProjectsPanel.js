import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faTimes, faSave } from '@fortawesome/free-solid-svg-icons';

const RelatedProjects = ({ experienceId, companyName }) => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null); // Tracks which project is being edited
  
  const [formData, setFormData] = useState({
    title: '', description: '', technologies: '', project_url: '', github_url: ''
  });

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/experience/${experienceId}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, [experienceId]);

  useEffect(() => {
    if (experienceId) fetchProjects();
  }, [experienceId, fetchProjects]);

  // Enter Edit Mode
  const handleEditClick = (proj) => {
    setEditingProjectId(proj.id);
    setFormData({
      title: proj.title || '',
      description: proj.description || '',
      technologies: proj.technologies || '',
      project_url: proj.project_url || '',
      github_url: proj.github_url || ''
    });
    setShowForm(true);
  };

  // Reset/Cancel Form
  const resetForm = () => {
    setFormData({ title: '', description: '', technologies: '', project_url: '', github_url: '' });
    setShowForm(false);
    setEditingProjectId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const isEditing = !!editingProjectId;
      
      const url = isEditing 
        ? `http://localhost:5001/api/admin/experience-projects/${editingProjectId}`
        : `http://localhost:5001/api/admin/experience-projects`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          experience_id: experienceId
        })
      });

      if (response.ok) {
        resetForm();
        fetchProjects();
      }
    } catch (err) {
      console.error("Operation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`http://localhost:5001/api/admin/experience-projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProjects();
    } catch (err) {
      console.error("Delete project failed:", err);
    }
  };

  return (
    <div className="related-projects-container white-based">
      <div className="section-header-sub">
        <h3>Projects at {companyName}</h3>
        <button className="btn btn-sm btn-outline" onClick={showForm ? resetForm : () => setShowForm(true)}>
          <FontAwesomeIcon icon={showForm ? faTimes : faPlus} /> 
          {showForm ? ' Cancel' : ' Add Project'}
        </button>
      </div>

      {showForm && (
        <form className="mini-project-form card-style" onSubmit={handleSubmit}>
          <h4>{editingProjectId ? 'Edit Project' : 'New Project'}</h4>
          <div className="form-grid">
            <input
              className="form-control"
              placeholder="Project Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <input
              className="form-control"
              placeholder="Technologies (e.g. React, Node)"
              value={formData.technologies}
              onChange={e => setFormData({ ...formData, technologies: e.target.value })}
            />
          </div>
          <textarea
            className="form-control"
            placeholder="What did you build/accomplish?"
            rows="3"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="form-actions-row">
            <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
              <FontAwesomeIcon icon={faSave} /> {loading ? ' Saving...' : ' Save Details'}
            </button>
          </div>
        </form>
      )}

      <div className="project-list-mini">
        {projects.length > 0 ? (
          projects.map((proj) => (
            <div key={proj.id} className="project-item-card white-card">
              <div className="proj-details">
                <div className="proj-header">
                  <strong>{proj.title}</strong>
                  <div className="proj-actions">
                    <button className="icon-btn edit" onClick={() => handleEditClick(proj)}>
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="icon-btn delete" onClick={() => onDelete(proj.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                {proj.technologies && <span className="proj-tech-badge">{proj.technologies}</span>}
                <p className="proj-desc-text">{proj.description}</p>
              </div>
            </div>
          ))
        ) : (
          !showForm && <div className="empty-sub-state"><p>No projects recorded yet.</p></div>
        )}
      </div>
    </div>
  );
};

export default RelatedProjects;