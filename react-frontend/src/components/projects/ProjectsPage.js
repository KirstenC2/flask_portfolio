import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faReact } from '@fortawesome/free-brands-svg-icons';
import { faExternalLinkAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [displayUrls, setDisplayUrls] = useState({});

  // 當 projects 列表更新時，獲取所有圖片的連結
  useEffect(() => {
    projects.forEach(project => {
      if (project.image_url && !project.image_url.startsWith('http')) {
        fetchImageUrl(project.image_url);
      }
    });
  }, [projects]);

  const fetchImageUrl = async (path) => {
    if (!path || displayUrls[path]) return;

    // 假設 path 是 "projects/123.jpg"
    const parts = path.split('/');
    const bucket = parts[0];
    const filename = parts[1];

    try {
      // 這裡我們直接傳送拆分後的 bucket 和 filename
      const response = await fetch(`http://localhost:5001/api/attachments/view/projects/${filename}`);
      const data = await response.json();
      console.log(data);
      if (data.url) {
        setDisplayUrls(prev => ({ ...prev, [path]: data.url }));
      }
    } catch (err) {
      console.error("無法取得圖片連結", err);
    }
  };
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/projects');
        setProjects(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again later.');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to display technologies as tags
  const renderTechnologies = (technologiesString) => {
    if (!technologiesString) return null;

    const technologies = technologiesString.split(',').map(tech => tech.trim());

    return (
      <div className="project-technologies">
        {technologies.map((tech, index) => (
          <span key={index} className="technology-tag">
            {tech}
          </span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="loading">Loading projects...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="projects-page">
      <div className="container">
        <h1 className="page-title">My Projects</h1>
        <p className="page-subtitle">
          A showcase of my recent development work and personal projects
        </p>

        {projects.length === 0 ? (
          <p className="no-projects">No projects found in database.</p>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <article key={project.id} className="project-card">
                {/* 在 map 循環中修改如下 */}
                <div className="project-image">
                  {project.image_url ? (
                    <img
                      // 關鍵修正：優先從 displayUrls 找，找不到才用原始路徑（相容完整 URL）
                      src={displayUrls[project.image_url] || (project.image_url.startsWith('http') ? project.image_url : '')}
                      alt={project.title}
                      onError={(e) => {
                        // 增加一個破圖後的處理邏輯
                        if (e.target.src !== '') {
                          console.error(`Image failed to load: ${project.image_url}`);
                          e.target.style.display = 'none'; // 或者替換成 placeholder
                        }
                      }}
                    />
                  ) : (
                    <div className="placeholder-image">
                      <FontAwesomeIcon icon={faReact} className="placeholder-icon" />
                    </div>
                  )}
                </div>
                <div className="project-content">
                  <h2 className="project-title">{project.title}</h2>

                  <div className="project-date">
                    <FontAwesomeIcon icon={faCalendarAlt} className="date-icon" />
                    <span>{formatDate(project.date_created)}</span>
                  </div>

                  <p className="project-description">{project.description}</p>

                  {renderTechnologies(project.technologies)}

                  <div className="project-links">
                    <Link to={`/project/${project.id}`} className="view-project-btn">
                      View Details
                    </Link>

                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-link"
                      >
                        <FontAwesomeIcon icon={faGithub} />
                      </a>
                    )}

                    {project.project_url && (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="live-link"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ProjectsPage;
