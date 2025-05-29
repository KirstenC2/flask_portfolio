import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faPaperPlane, 
  faUser, 
  faSpinner, 
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';
import { 
  faGithub, 
  faLinkedin 
} from '@fortawesome/free-brands-svg-icons';
import './ContactPage.css';

const ContactPage = () => {
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/contact');
        setContactInfo(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contact info:', error);
        setError('Failed to load contact information. Please try again later.');
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message should be at least 10 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset submission states
    setSubmitSuccess(false);
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:5001/api/contact', formData);
      
      if (response.data.success) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitError('There was an error sending your message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitError('Failed to send message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return <div className="loading">Loading contact information...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="contact-page">
      <div className="container">
        <h1 className="page-title">Get In Touch</h1>
        <p className="page-subtitle">
          Feel free to reach out if you want to collaborate, have questions, or just want to say hello!
        </p>
        
        <div className="contact-container">
          <div className="contact-info">
            <h2 className="section-title">Contact Information</h2>
            <div className="info-items">
              <div className="info-item">
                <div className="info-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div className="info-content">
                  <h3>Email</h3>
                  <a href={`mailto:${contactInfo?.email || 'choovernjet@gmail.com'}`}>
                    {contactInfo?.email || 'choovernjet@gmail.com'}
                  </a>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <FontAwesomeIcon icon={faGithub} />
                </div>
                <div className="info-content">
                  <h3>GitHub</h3>
                  <a href={contactInfo?.github || 'https://github.com/KirstenC2'} target="_blank" rel="noopener noreferrer">
                    {contactInfo?.github?.replace('https://github.com/', '@') || '@KirstenC2'}
                  </a>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <FontAwesomeIcon icon={faLinkedin} />
                </div>
                <div className="info-content">
                  <h3>LinkedIn</h3>
                  <a href={contactInfo?.linkedin || 'https://linkedin.com/in/'} target="_blank" rel="noopener noreferrer">
                    {contactInfo?.linkedin?.replace('https://linkedin.com/in/', '@') || 'Connect on LinkedIn'}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="contact-message">
              <p>I'm always interested in new opportunities, collaborations, and projects. Don't hesitate to reach out!</p>
            </div>
          </div>
          
          <div className="contact-form-container">
            <h2 className="section-title">Send a Message</h2>
            
            {submitSuccess ? (
              <div className="success-message">
                <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
                <p>Your message has been sent successfully! I'll get back to you soon.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">
                    <FontAwesomeIcon icon={faUser} /> Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className={formErrors.name ? 'error' : ''}
                  />
                  {formErrors.name && <div className="error-message">{formErrors.name}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">
                    <FontAwesomeIcon icon={faEnvelope} /> Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your Email"
                    className={formErrors.email ? 'error' : ''}
                  />
                  {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Subject"
                    className={formErrors.subject ? 'error' : ''}
                  />
                  {formErrors.subject && <div className="error-message">{formErrors.subject}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your Message"
                    rows="6"
                    className={formErrors.message ? 'error' : ''}
                  ></textarea>
                  {formErrors.message && <div className="error-message">{formErrors.message}</div>}
                </div>
                
                {submitError && <div className="submit-error">{submitError}</div>}
                
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="spinner" /> Sending...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
