import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faReact } from '@fortawesome/free-brands-svg-icons';
import { faExternalLinkAlt, faCalendarAlt, faArrowLeft, faCheckCircle, faBullseye } from '@fortawesome/free-solid-svg-icons';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);

  // 1. 獲取專案詳情資料
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/projects/${id}`);
        setProject(response.data);
        
        // 如果有圖片路徑且不是完整 URL，則去換取 MinIO 連結
        if (response.data.image_url && !response.data.image_url.startsWith('http')) {
          fetchImageUrl(response.data.image_url);
        } else {
          setImageUrl(response.data.image_url);
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  // 2. 獲取 MinIO 簽名連結
  const fetchImageUrl = async (path) => {
    const filename = path.split('/').pop();
    try {
      const response = await fetch(`http://localhost:5001/api/attachments/view/projects/${filename}`);
      const data = await response.json();
      if (data.url) setImageUrl(data.url);
    } catch (err) {
      console.error("Failed to get signed URL", err);
    }
  };

  // Helper: 渲染分行文字為清單
  const renderList = (text) => {
    if (!text) return null;
    return text.split(/[\n;]+/).filter(p => p.trim()).map((item, i) => (
      <li key={i}>{item.trim()}</li>
    ));
  };

  if (loading) return <div className="loading">Loading details...</div>;
  if (!project) return <div className="error">Project not found.</div>;

  return (
    <div className="project-detail-page">
      <div className="container">
        <Link to="/projects" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Projects
        </Link>

        <header className="detail-header">
          <h1>{project.title}</h1>
          <div className="detail-meta">
            <span><FontAwesomeIcon icon={faCalendarAlt} /> {new Date(project.date_created).toLocaleDateString()}</span>
            <div className="detail-tags">
              {project.technologies?.split(',').map((t, i) => (
                <span key={i} className="tech-tag">{t.trim()}</span>
              ))}
            </div>
          </div>
        </header>

        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-image">
              {imageUrl ? <img src={imageUrl} alt={project.title} /> : <div className="no-img-placeholder"><FontAwesomeIcon icon={faReact} /></div>}
            </div>

            <section className="detail-section">
              <h3>Description</h3>
              <p>{project.description}</p>
            </section>
          </div>

          <aside className="detail-sidebar">
            <div className="action-cards">
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noreferrer" className="action-btn github">
                  <FontAwesomeIcon icon={faGithub} /> View Source Code
                </a>
              )}
              {project.project_url && (
                <a href={project.project_url} target="_blank" rel="noreferrer" className="action-btn live">
                  <FontAwesomeIcon icon={faExternalLinkAlt} /> Visit Live Demo
                </a>
              )}
            </div>

            {project.goals && (
              <div className="info-box">
                <h4><FontAwesomeIcon icon={faBullseye} /> Project Goals</h4>
                <ul>{renderList(project.goals)}</ul>
              </div>
            )}

            {project.features && (
              <div className="info-box">
                <h4><FontAwesomeIcon icon={faCheckCircle} /> Key Features</h4>
                <ul>{renderList(project.features)}</ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;