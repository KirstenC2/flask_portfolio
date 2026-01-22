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
const renderBulletPoints = (text) => {
  if (!text) return null;
  // 支援以換行、分號或逗號拆分
  const points = text.split(/[\n;]+/).filter(p => p.trim() !== "");
  if (points.length === 0) return null;

  return (
    <ul className="bullet-points-list">
      {points.map((point, index) => (
        <li key={index}>{point.trim()}</li>
      ))}
    </ul>
  );
};
const ProjectsPanel = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [displayUrls, setDisplayUrls] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    image_url: '',
    project_url: '',
    github_url: '',
    features: '', // 以換行分隔
    goals: ''    // 以換行分隔
  });

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // 當 projects 列表更新時，獲取所有圖片的連結
  useEffect(() => {
    projects.forEach(project => {
      if (project.image_url && !project.image_url.startsWith('http')) {
        fetchImageUrl(project.image_url);
      }
    });
  }, [projects]);

  // 當選擇某個專案時，也要確保該專案的圖片連結已獲取
  useEffect(() => {
    if (currentProject?.image_url && !currentProject.image_url.startsWith('http')) {
      fetchImageUrl(currentProject.image_url);
    }
  }, [currentProject]);

  const fetchImageUrl = async (path) => {
    if (!path || displayUrls[path]) return;

    // 假設 path 是 "projects/123.jpg"
    const parts = path.split('/');
    const bucket = parts[0];
    const filename = parts[1];

    try {
      // 這裡我們直接傳送拆分後的 bucket 和 filename
      const response = await fetch(`http://localhost:5001/api/attachments/view/${bucket}/${filename}`);
      const data = await response.json();

      if (data.url) {
        setDisplayUrls(prev => ({ ...prev, [path]: data.url }));
      }
    } catch (err) {
      console.error("無法取得圖片連結", err);
    }
  };
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
      title: project.title || '',
      description: project.description || '',
      technologies: project.technologies || '',
      image_url: project.image_url || '',
      project_url: project.project_url || '',
      github_url: project.github_url || '',
      features: project.features || '', // 確保這些被載入
      goals: project.goals || '',       // 確保這些被載入
      role: project.role || '',         // 新增 R&D 欄位
      contribution: project.contribution || '',
      challenges: project.challenges || ''
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

  const uploadFile = async (file) => {
    const fileName = `${Date.now()}-${file.name}`;
    const bucket = 'projects';
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch(`http://localhost:5001/api/attachments/upload/${bucket}/${fileName}`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      // 調錯點：這裡必須對應後端 jsonify 的 Key
      console.log("Backend response:", data); // 先印出來看看結構
      return data.path; // 如果後端給的是 {"path": "..."}, 這裡就要用 data.path
    } catch (err) {
      console.error("MinIO Upload Error:", err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;

      // 如果有選擇新檔案，先上傳到 MinIO
      if (selectedFile) {
        setUploading(true);
        finalImageUrl = await uploadFile(selectedFile);
        setUploading(false);
      }

      const token = localStorage.getItem('adminToken');
      const method = currentProject ? 'PUT' : 'POST';
      const url = currentProject
        ? `http://localhost:5001/api/admin/projects/${currentProject.id}`
        : 'http://localhost:5001/api/admin/projects';

      // 將最後獲取的 MinIO URL 放入要傳送的資料中
      const projectData = {
        ...formData,
        image_url: finalImageUrl
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) throw new Error('Failed to save project');

      setSelectedFile(null); // 上傳成功後清空選擇
      fetchProjects();
      setEditMode(false);

    } catch (err) {
      setError("Failed to save project or upload image.");
    } finally {
      setLoading(false);
      setUploading(false);
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
                      <img
                        // 這裡改用 displayUrls[path]
                        src={displayUrls[project.image_url] || project.image_url}
                        alt={project.title}
                      />
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
                    <button className="btn" onClick={handleDeleteProject}>
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
                    <label htmlFor="goals">Project Goals (One per line)*</label>
                    <textarea
                      id="goals"
                      name="goals"
                      value={formData.goals}
                      onChange={handleChange}
                      placeholder="e.g. Build a scalable API&#10;Improve UI performance"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="features">Main Features (One per line)*</label>
                    <textarea
                      id="features"
                      name="features"
                      value={formData.features}
                      onChange={handleChange}
                      placeholder="e.g. Real-time notifications&#10;Dark mode support"
                      rows={4}
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

                  // 在 form-group 內增加預覽圖
                  <div className="form-group">
                    <label htmlFor="image_file">Project Image (MinIO)</label>
                    <input
                      type="file"
                      id="image_file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />

                    {/* 新增：選取檔案後的本地預覽 */}
                    {selectedFile && (
                      <div className="image-preview">
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: '100px', marginTop: '10px' }} />
                        <p>New image selected</p>
                      </div>
                    )}
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
                      <img
                        // 這裡也改用 displayUrls[path]
                        src={displayUrls[currentProject.image_url] || currentProject.image_url}
                        alt={currentProject.title}
                      />
                    </div>
                  )}

                  <div className="project-info">
                    <h2>{currentProject.title}</h2>

                    <div className="project-tech">
                      <strong>Technologies:</strong> {currentProject.technologies}
                    </div>

                    {currentProject.goals && (
                      <div className="info-section">
                        <h3><FontAwesomeIcon icon={faProjectDiagram} /> Project Goals</h3>
                        {renderBulletPoints(currentProject.goals)}
                      </div>
                    )}

                    {currentProject.features && (
                      <div className="info-section">
                        <h3><FontAwesomeIcon icon={faSave} /> Main Features</h3>
                        {renderBulletPoints(currentProject.features)}
                      </div>
                    )}

                    <div className="project-description">
                      <h3>Background</h3>
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
