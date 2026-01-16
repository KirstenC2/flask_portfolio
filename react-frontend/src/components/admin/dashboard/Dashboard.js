import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faProjectDiagram,
  faCode,
  faBook,
  faBriefcase,
  faGraduationCap,
  faEnvelope,
  faSignOutAlt,
  faTachometerAlt,
  faUserCircle,
  faStar,
  faBlog
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';
import { Divider } from '@mui/material';

// Import admin components
import MessagesPanel from '../messages/MessagesPanel';
import ProjectsPanel from '../projects/ProjectsPanel';
import SkillsPanel from '../skills/SkillsPanel';
import EducationPanel from '../education/EducationPanel';
import ExperiencePanel from '../experience/ExperiencePanel';
import StudiesPanel from '../studies/StudiesPanel';
import LifeEventsPanel from '../life/LifeEventsPanel';
import BlogPanel from '../blog/BlogPanel';
import DiaryPanel from '../diary/DiaryPanel';
import ResumePanel from '../resume/ResumePanel';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [adminUser, setAdminUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    journey: true,
    content: true
  });
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');

    if (!storedUser || !token) {
      navigate('/admin/login');
      return;
    }

    setAdminUser(JSON.parse(storedUser));

    // Fetch unread messages count
    fetchUnreadMessagesCount();
  }, [navigate]);

  const fetchUnreadMessagesCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const messages = await response.json();
        const unread = messages.filter(msg => !msg.read).length;
        setUnreadMessages(unread);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'messages':
        return <MessagesPanel onMessageRead={fetchUnreadMessagesCount} />;
      case 'projects':
        return <ProjectsPanel />;
      case 'skills':
        return <SkillsPanel />;
      case 'education':
        return <EducationPanel />;
      case 'experience':
        return <ExperiencePanel />;
      case 'studies':
        return <StudiesPanel />;
      case 'life':
        return <LifeEventsPanel />;
      case 'blog':
        return <BlogPanel />;
      case 'diary':
        return <DiaryPanel />;
      case 'resume':
        return <ResumePanel />;
      case 'overview':
      default:
        return (
          <div className="dashboard-overview">
            <h2>Welcome to your Admin Dashboard</h2>
            <p>From here, you can manage all the content of your portfolio website.</p>

            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div className="stat-content">
                  <h3>Messages</h3>
                  <p>{unreadMessages} unread</p>
                </div>
              </div>
              {/* Add more stat cards as needed */}
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-button" onClick={() => setActiveSection('messages')}>
                  <FontAwesomeIcon icon={faEnvelope} />
                  Check Messages {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
                </button>
                <button className="action-button" onClick={() => setActiveSection('projects')}>
                  <FontAwesomeIcon icon={faProjectDiagram} />
                  Manage Projects
                </button>
                <button className="action-button" onClick={() => setActiveSection('studies')}>
                  <FontAwesomeIcon icon={faBook} />
                  Manage Studies
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Portfolio Admin</h2>
        </div>

        <div className="admin-info">
          <FontAwesomeIcon icon={faUserCircle} className="admin-avatar" />
          <div className="admin-details">
            <p className="admin-name">{adminUser?.username || 'Admin'}</p>
            <p className="admin-email">{adminUser?.email || 'admin@example.com'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeSection === 'resume' ? 'active' : ''}>
              <button onClick={() => setActiveSection('resume')}>
                <FontAwesomeIcon icon={faGraduationCap} /> Resume
              </button>
            </li>
            <li className={activeSection === 'overview' ? 'active' : ''}>
              <button onClick={() => setActiveSection('overview')}>
                <FontAwesomeIcon icon={faTachometerAlt} /> Dashboard
              </button>
            </li>
            <li className={activeSection === 'messages' ? 'active' : ''}>
              <button onClick={() => setActiveSection('messages')}>
                <FontAwesomeIcon icon={faEnvelope} /> Messages
                {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
              </button>
            </li>
            {/* GROUP 1: MY JOURNEY */}
            <li className="sidebar-subheader" onClick={() => toggleSection('journey')}>
              <h3>My Journey</h3>
              <span className={`chevron ${expandedSections.journey ? 'open' : ''}`}>▼</span>
            </li>
            {expandedSections.journey && (
              <div className="collapsible-group">

                <li className={activeSection === 'projects' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('projects')}>
                    <FontAwesomeIcon icon={faProjectDiagram} />
                    Projects
                  </button>
                </li>
                <li className={activeSection === 'skills' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('skills')}>
                    <FontAwesomeIcon icon={faCode} />
                    Skills
                  </button>
                </li>
                <li className={activeSection === 'studies' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('studies')}>
                    <FontAwesomeIcon icon={faBook} />
                    Studies
                  </button>
                </li>
                <li className={activeSection === 'experience' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('experience')}>
                    <FontAwesomeIcon icon={faBriefcase} />
                    Experience
                  </button>
                </li>
                <li className={activeSection === 'education' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('education')}>
                    <FontAwesomeIcon icon={faGraduationCap} />
                    Education
                  </button>
                </li>
                <li className={activeSection === 'life' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('life')}>
                    <FontAwesomeIcon icon={faStar} />
                    Life Events
                  </button>
                </li>
              </div>)}

            <Divider component="li" />
            {/* GROUP 2: MY CONTENT */}
            <li className="sidebar-subheader" onClick={() => toggleSection('content')}>
              <h3>My Content</h3>
              <span className={`chevron ${expandedSections.content ? 'open' : ''}`}>▼</span>
            </li>
            {expandedSections.content && (
              <div className="collapsible-group">
                <li className={activeSection === 'blog' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('blog')}>
                    <FontAwesomeIcon icon={faBlog} />
                    Blog
                  </button>
                </li>
                <li className={activeSection === 'diary' ? 'active' : ''}>
                  <button onClick={() => setActiveSection('diary')}>
                    <FontAwesomeIcon icon={faBook} />
                    Diary
                  </button>
                </li>
              </div>)}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="view-site">
            <FontAwesomeIcon icon={faHome} />
            View Site
          </Link>
          <button className="logout-button" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <h1>
            {activeSection === 'overview' && 'Dashboard Overview'}
            {activeSection === 'messages' && 'Messages'}
            {activeSection === 'projects' && 'Projects'}
            {activeSection === 'resume' && 'Resume'}
            {activeSection === 'skills' && 'Skills'}
            {activeSection === 'studies' && 'Studies'}
            {activeSection === 'experience' && 'Experience'}
            {activeSection === 'education' && 'Education'}
            {activeSection === 'life' && 'Life Events'}
            {activeSection === 'blog' && 'Blog'}
            {activeSection === 'diary' && 'Diary'}
          </h1>
        </div>

        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
