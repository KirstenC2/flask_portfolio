import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

const HomePage = () => {
  const [homeData, setHomeData] = useState({
    featured_projects: [],
    top_skills: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/home');
        setHomeData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setError('Failed to load portfolio data. Please try again later.');
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Hi, I'm Kirsten Choo</h1>
          <h2>Fullstack Developer</h2>
          <p>Building elegant, user-friendly applications with clean code</p>
          <div className="hero-btns">
            <Link to="/projects" className="btn btn-primary">View My Work</Link>
            <Link to="/contact" className="btn btn-secondary">Get In Touch</Link>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="featured-projects">
        <div className="container">
          <h2 className="section-title">Featured Projects</h2>
          <div className="project-grid">
            {homeData.featured_projects.map(project => (
              <div className="project-card" key={project.id}>
                <div className="project-img">
                  <img src={`/images/${project.image_url}`} alt={project.title} />
                </div>
                <div className="project-info">
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-tech">{project.technologies}</div>
                  <div className="project-links">
                    <Link to={`/project/${project.id}`} className="btn btn-small">View Details</Link>
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-small">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/projects" className="btn btn-primary">View All Projects</Link>
          </div>
        </div>
      </section>

      {/* Top Skills Section */}
      <section className="top-skills">
        <div className="container">
          <h2 className="section-title">Top Skills</h2>
          <div className="skills-grid">
            {homeData.top_skills.map(skill => (
              <div className="skill-card" key={skill.id}>
                <h3>{skill.name}</h3>
                <div className="skill-category">{skill.category}</div>
                <div className="skill-bar">
                  <div 
                    className="skill-progress" 
                    style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/skills" className="btn btn-primary">View All Skills</Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-preview">
        <div className="container">
          <h2 className="section-title">About Me</h2>
          <p>
            I'm a passionate fullstack developer with expertise in building modern web applications.
            My focus is on creating seamless user experiences with clean, efficient code.
          </p>
          <Link to="/about" className="btn btn-primary">Learn More</Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
