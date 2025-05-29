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

  // Timeline data
  const timelineData = [
    {
      year: '2023 - Present',
      title: 'Senior Full Stack Developer',
      company: 'Tech Innovations Inc.',
      description: 'Leading development of enterprise web applications using React, Node.js, and MongoDB. Implementing CI/CD pipelines and mentoring junior developers.'
    },
    {
      year: '2020 - 2023',
      title: 'Full Stack Developer',
      company: 'Digital Solutions Ltd.',
      description: 'Developed responsive web applications with React and Express. Implemented RESTful APIs and worked with SQL and NoSQL databases.'
    },
    {
      year: '2018 - 2020',
      title: 'Frontend Developer',
      company: 'Web Creators Studio',
      description: 'Created responsive user interfaces using HTML, CSS, JavaScript, and React. Collaborated with designers to implement pixel-perfect UIs.'
    },
    {
      year: '2017 - 2018',
      title: 'Web Development Intern',
      company: 'Startup Incubator',
      description: 'Assisted in development of web applications. Learned modern JavaScript frameworks and best practices in web development.'
    }
  ];

  // Education data
  const educationData = [
    {
      year: '2014 - 2018',
      degree: 'Bachelor of Science in Computer Science',
      school: 'University of Technology',
      description: 'Focused on software engineering, web development, and database systems. Graduated with honors.'
    },
    {
      year: '2020',
      degree: 'Full Stack Web Development Certification',
      school: 'Tech Academy',
      description: 'Intensive program covering modern JavaScript frameworks, backend development, and deployment technologies.'
    }
  ];

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
            {timelineData.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot">
                  <FontAwesomeIcon icon={faBriefcase} />
                </div>
                <div className="timeline-date">{item.year}</div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <h4>{item.company}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="education-section">
          <h2 className="section-title">Education</h2>
          <div className="timeline">
            {educationData.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot">
                  <FontAwesomeIcon icon={faUserGraduate} />
                </div>
                <div className="timeline-date">{item.year}</div>
                <div className="timeline-content">
                  <h3>{item.degree}</h3>
                  <h4>{item.school}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;
