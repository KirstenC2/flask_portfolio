import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faProjectDiagram, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes,
  faSpinner,
  faExternalLinkAlt,
  faImage
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import './ProjectsPanel.css';

const ProjectsPanel = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    image_url: '',
    project_url: '',
    github_url: ''
  });
  
  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);
  
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectProject = (project) => {
    setCurrentProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      technologies: project.technologies,
      image_url: project.image_url,
      project_url: project.project_url,
      github_url: project.github_url
    });
    setEditMode(false);
  };
  
  const handleCreateNew = () => {
    setCurrentProject(null);
    setFormData({
      title: '',
      description: '',
      technologies: '',
      image_url: '',
      project_url: '',
      github_url: ''
    });
    setEditMode(true);
  };
  
  const handleEditProject = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    if (currentProject) {
      // Reset form to current project data
      setFormData({
        title: currentProject.title,
        description: currentProject.description,
        technologies: currentProject.technologies,
        image_url: currentProject.image_url,
        project_url: currentProject.project_url,
        github_url: currentProject.github_url
      });
    } else {
      // Clear form
      setFormData({
        title: '',
        description: '',
        technologies: '',
        image_url: '',
        project_url: '',
        github_url: ''
      });
    }
    
    setEditMode(false);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const method = currentProject ? 'PUT' : 'POST';
      const url = currentProject 
        ? `http://localhost:5001/api/admin/projects/${currentProject.id}`
        : 'http://localhost:5001/api/admin/projects';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${currentProject ? 'update' : 'create'} project`);
      }
      
      // Refresh projects list
      fetchProjects();
      
      // Exit edit mode
      setEditMode(false);
      
      // If creating new, clear current project
      if (!currentProject) {
        setCurrentProject(null);
      }
      
    } catch (err) {
      console.error(`Error ${currentProject ? 'updating' : 'creating'} project:`, err);
      setError(`Failed to ${currentProject ? 'update' : 'create'} project. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteProject = async () => {
    if (!currentProject) return;
    
    if (!window.confirm(`Are you sure you want to delete "${currentProject.title}"?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/admin/projects/${currentProject.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // Refresh projects list
      fetchProjects();
      
      // Clear current project
      setCurrentProject(null);
      
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="projects-panel">
      <div className="projects-header">
        <button className="new-project-btn" onClick={handleCreateNew}>
          <FontAwesomeIcon icon={faPlus} /> New Project
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="projects-content">
        <div className="projects-list">
          <h3>Your Projects</h3>
          
          {loading && !projects.length ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faProjectDiagram} />
              <p>No projects found</p>
              <button onClick={handleCreateNew}>Create your first project</button>
            </div>
          ) : (
            <ul className="project-items">
              {projects.map(project => (
                <li 
                  key={project.id} 
                  className={`project-item ${currentProject && currentProject.id === project.id ? 'active' : ''}`}
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="project-item-image">
                    {project.image_url ? (
                      <img src={project.image_url} alt={project.title} />
                    ) : (
                      <div className="no-image">
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                    )}
                  </div>
                  <div className="project-item-details">
                    <h4>{project.title}</h4>
                    <p className="technologies">{project.technologies}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="project-details">
          {loading && currentProject ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} className="spinner" />
              <p>Loading project details...</p>
            </div>
          ) : !currentProject && !editMode ? (
            <div className="no-selection">
              <FontAwesomeIcon icon={faProjectDiagram} />
              <p>Select a project or create a new one</p>
            </div>
          ) : (
            <div className="project-form-container">
              <div className="form-header">
                <h3>{editMode ? (currentProject ? 'Edit Project' : 'Create New Project') : 'Project Details'}</h3>
                
                {!editMode && currentProject && (
                  <div className="form-actions">
                    <button className="edit-btn" onClick={handleEditProject}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button className="delete-btn" onClick={handleDeleteProject}>
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              {editMode ? (
                <form className="project-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Project Title*</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="technologies">Technologies*</label>
                    <input
                      type="text"
                      id="technologies"
                      name="technologies"
                      value={formData.technologies}
                      onChange={handleChange}
                      required
                      placeholder="E.g., React, Node.js, MongoDB"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description*</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={5}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="image_url">Image URL</label>
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="project_url">Project URL</label>
                    <input
                      type="url"
                      id="project_url"
                      name="project_url"
                      value={formData.project_url}
                      onChange={handleChange}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="github_url">GitHub URL</label>
                    <input
                      type="url"
                      id="github_url"
                      name="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  
                  <div className="form-buttons">
                    <button type="submit" className="save-btn" disabled={loading}>
                      {loading ? <FontAwesomeIcon icon={faSpinner} className="spinner" /> : <FontAwesomeIcon icon={faSave} />}
                      {loading ? 'Saving...' : 'Save Project'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                  </div>
                </form>
              ) : currentProject && (
                <div className="project-view">
                  {currentProject.image_url && (
                    <div className="project-image">
                      <img src={currentProject.image_url} alt={currentProject.title} />
                    </div>
                  )}
                  
                  <div className="project-info">
                    <h2>{currentProject.title}</h2>
                    <div className="project-tech">
                      <strong>Technologies:</strong> {currentProject.technologies}
                    </div>
                    
                    <div className="project-links">
                      {currentProject.project_url && (
                        <a href={currentProject.project_url} target="_blank" rel="noopener noreferrer">
                          <FontAwesomeIcon icon={faExternalLinkAlt} /> View Project
                        </a>
                      )}
                      {currentProject.github_url && (
                        <a href={currentProject.github_url} target="_blank" rel="noopener noreferrer">
                          <FontAwesomeIcon icon={faGithub} /> GitHub Repository
                        </a>
                      )}
                    </div>
                    
                    <div className="project-description">
                      <h3>Description</h3>
                      <p>{currentProject.description}</p>
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

export default ProjectsPanel;
