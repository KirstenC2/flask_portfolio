import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserGraduate, 
  faBriefcase, 
  faCode, 
  faEnvelope, 
  faMapMarkerAlt,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import './AboutPage.css';

const AboutPage = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/about');
        setAboutData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching about data:', error);
        setError('Failed to load about information. Please try again later.');
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  // Use data from the API response

  if (loading) return <div className="loading">Loading about information...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="about-page">
      <div className="container">
        <section className="about-intro">
          <div className="profile-container">
            <div className="profile-image">
              {/* You can replace this with an actual profile image */}
              <div className="profile-placeholder">
                <span>{aboutData?.name?.charAt(0) || 'K'}</span>
              </div>
            </div>
            <div className="profile-details">
              <h1>{aboutData?.name || 'Kirsten Choo'}</h1>
              <h2>{aboutData?.title || 'Fullstack Developer'}</h2>
              
              <div className="contact-details">
                <div className="contact-item">
                  <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                  <span>{aboutData?.email || 'choovernjet@gmail.com'}</span>
                </div>
                <div className="contact-item">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
                  <span>Singapore</span>
                </div>
              </div>
              
              <p className="bio-text">
                {aboutData?.bio || 'Passionate about creating elegant, user-friendly applications with clean code. Experienced in full-stack development with expertise in modern web technologies and frameworks.'}
              </p>
              
              <div className="cta-buttons">
                <Link to="/contact" className="btn btn-primary">Contact Me</Link>
                <Link to="/projects" className="btn btn-secondary">View Projects</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="skills-highlight">
          <h2 className="section-title">My Expertise</h2>
          <div className="expertise-grid">
            <div className="expertise-card">
              <h3>Frontend Development</h3>
              <ul className="expertise-list">
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  React & Redux
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  JavaScript/TypeScript
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  HTML5 & CSS3/SCSS
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  Responsive Design
                </li>
              </ul>
            </div>
            <div className="expertise-card">
              <h3>Backend Development</h3>
              <ul className="expertise-list">
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  Node.js & Express
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  Python & Flask
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  RESTful APIs
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  SQL & NoSQL Databases
                </li>
              </ul>
            </div>
            <div className="expertise-card">
              <h3>DevOps & Tools</h3>
              <ul className="expertise-list">
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  Docker & Kubernetes
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  CI/CD Pipelines
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  Git & GitHub
                </li>
                <li>
                  <FontAwesomeIcon icon={faChevronRight} className="list-icon" />
                  AWS & Cloud Services
                </li>
              </ul>
            </div>
          </div>
          <div className="view-all-skills">
            <Link to="/skills" className="skills-link">
              View All Skills
              <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
            </Link>
          </div>
        </section>

        <section className="experience-section">
          <h2 className="section-title">Work Experience</h2>
          <div className="timeline">
            {aboutData?.experiences?.length > 0 ? (
              aboutData.experiences.map((experience, index) => (
                <div key={experience.id || index} className="timeline-item">
                  <div className="timeline-dot">
                    <FontAwesomeIcon icon={faBriefcase} />
                  </div>
                  <div className="timeline-date">{experience.year}</div>
                  <div className="timeline-content">
                    <h3>{experience.title}</h3>
                    <h4>{experience.company}</h4>
                    <p>{experience.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No experience data available</p>
            )}
          </div>
        </section>

        <section className="education-section">
          <h2 className="section-title">Education</h2>
          <div className="timeline">
            {aboutData?.education?.length > 0 ? (
              aboutData.education.map((edu, index) => (
                <div key={edu.id || index} className="timeline-item">
                  <div className="timeline-dot">
                    <FontAwesomeIcon icon={faUserGraduate} />
                  </div>
                  <div className="timeline-date">{edu.year}</div>
                  <div className="timeline-content">
                    <h3>{edu.degree}</h3>
                    <h4>{edu.school}</h4>
                    <p>{edu.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No education data available</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
