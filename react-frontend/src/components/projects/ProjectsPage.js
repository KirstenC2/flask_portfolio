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
                <div className="project-image">
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.title} />
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
