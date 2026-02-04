import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faProjectDiagram, faCode, faBook, faBriefcase,
  faGraduationCap, faEnvelope, faSignOutAlt, faTachometerAlt,
  faUserCircle, faStar, faBlog, faMotorcycle, faFileInvoiceDollar,
  faHeart, faBars, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';
import { Divider, Tooltip } from '@mui/material';

// --- Panels Import 保持不變 ---
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
import FinancePanel from '../finance/FinancePanel';
import MotorManagementPanel from '../motor_management/MotorManagementPanel';
import WorkPanel from '../work/WorkPanel';
import ProjectBoard from '../work/pages/ProjectBoard';
import HealthPanel from '../health/HealthPanel';
import Overview from '../overview/Overview';

const SideNavbar = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [adminUser, setAdminUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // 新增：Sidebar 整體收納狀態
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
    journey: true,
    content: true
  });

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleSection = (section) => {
    if (isCollapsed) setIsCollapsed(false); // 點擊選單時自動展開
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    if (!storedUser || !token) {
      navigate('/admin/login');
      return;
    }
    setAdminUser(JSON.parse(storedUser));
    fetchUnreadMessagesCount();
  }, [navigate]);

  const fetchUnreadMessagesCount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5001/api/admin/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const messages = await response.json();
        setUnreadMessages(messages.filter(msg => !msg.read).length);
      }
    } catch (error) { console.error('Error:', error); }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const renderContent = () => {
    if (activeSection === 'work' && selectedProjectId) {
      return <ProjectBoard projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />;
    }
    const panels = {
      messages: <MessagesPanel onMessageRead={fetchUnreadMessagesCount} />,
      projects: <ProjectsPanel />,
      skills: <SkillsPanel />,
      education: <EducationPanel />,
      experience: <ExperiencePanel />,
      studies: <StudiesPanel />,
      life: <LifeEventsPanel />,
      blog: <BlogPanel />,
      diary: <DiaryPanel />,
      resume: <ResumePanel />,
      finance: <FinancePanel />,
      motor: <MotorManagementPanel />,
      work: <WorkPanel onProjectSelect={setSelectedProjectId} />,
      health: <HealthPanel />,
      overview: <Overview unreadMessages={unreadMessages} />
    };
    return panels[activeSection] || <Overview unreadMessages={unreadMessages} />;
  };

  // 封裝導覽按鈕，加入 Tooltip 處理收納時的顯示
  const NavButton = ({ id, icon, label, badge }) => (
    <li className={activeSection === id ? 'active' : ''}>
      <Tooltip title={isCollapsed ? label : ""} placement="right">
        <button onClick={() => setActiveSection(id)}>
          <FontAwesomeIcon icon={icon} />
          {!isCollapsed && <span>{label}</span>}
          {!isCollapsed && badge > 0 && <span className="badge">{badge}</span>}
        </button>
      </Tooltip>
    </li>
  );

  return (
    <div className={`admin-dashboard ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          {!isCollapsed && <h2>Admin Panel</h2>}
          <button className="collapse-toggle-btn" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={isCollapsed ? faBars : faChevronLeft} />
          </button>
        </div>

        <div className="admin-info">
          <FontAwesomeIcon icon={faUserCircle} className="admin-avatar" />
          {!isCollapsed && (
            <div className="admin-details">
              <p className="admin-name">{adminUser?.username || 'Admin'}</p>
              <p className="admin-email">{adminUser?.email || 'admin@email.com'}</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <ul>
            <NavButton id="resume" icon={faGraduationCap} label="Resume" />
            <NavButton id="overview" icon={faTachometerAlt} label="Dashboard" />
            <NavButton id="messages" icon={faEnvelope} label="Messages" badge={unreadMessages} />

            <Divider component="li" style={{ backgroundColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

            <li className="sidebar-subheader" onClick={() => toggleSection('journey')}>
              {!isCollapsed ? (
                <><h3>My Journey</h3><span className={`chevron ${expandedSections.journey ? 'open' : ''}`}>▼</span></>
              ) : <div className="dot-divider" />}
            </li>

            {(expandedSections.journey || isCollapsed) && (
              <div className="collapsible-group">
                <NavButton id="projects" icon={faProjectDiagram} label="Projects" />
                <NavButton id="skills" icon={faCode} label="Skills" />
                <NavButton id="studies" icon={faBook} label="Studies" />
                <NavButton id="experience" icon={faBriefcase} label="Experience" />
                <NavButton id="education" icon={faGraduationCap} label="Education" />
                <NavButton id="life" icon={faStar} label="Life Events" />
              </div>
            )}

            <li className="sidebar-subheader" onClick={() => toggleSection('content')}>
              {!isCollapsed ? (
                <><h3>My Tools</h3><span className={`chevron ${expandedSections.content ? 'open' : ''}`}>▼</span></>
              ) : <div className="dot-divider" />}
            </li>

            {(expandedSections.content || isCollapsed) && (
              <div className="collapsible-group">
                <NavButton id="blog" icon={faBlog} label="Blog" />
                <NavButton id="diary" icon={faBook} label="Diary" />
                <NavButton id="finance" icon={faFileInvoiceDollar} label="Finance" />
                <NavButton id="motor" icon={faMotorcycle} label="Motor" />
                <NavButton id="work" icon={faBriefcase} label="Work" />
                <NavButton id="health" icon={faHeart} label="Health" />
              </div>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="view-site">
            <FontAwesomeIcon icon={faHome} />
            {!isCollapsed && <span>View Site</span>}
          </Link>
          <button className="logout-button" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <h1>{activeSection.toUpperCase()}</h1>
        </div>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SideNavbar;