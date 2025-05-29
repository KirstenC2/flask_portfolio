import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-info">
            <h3>Kirsten Choo</h3>
            <p>Fullstack Developer</p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/KirstenC2" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faGithub} />
            </a>
            <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
            <a href="mailto:choovernjet@gmail.com">
              <FontAwesomeIcon icon={faEnvelope} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} Kirsten Choo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
