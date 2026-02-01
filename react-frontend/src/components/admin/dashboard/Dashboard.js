import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Overview from './overview/Overview';

// 引入所有 Panel 組件
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
import AdminProjectDetail from '../work/components/AdminProjectDetail';
import HealthPanel from '../health/HealthPanel';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [adminUser, setAdminUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ journey: true, content: true });

  // 檢查登入與抓取訊息數
  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    if (!storedUser || !token) { navigate('/admin/login'); return; }
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
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // 根據 activeSection 渲染內容的 Mapping Table (比 switch 更乾淨)
  const renderContent = () => {
    if (activeSection === 'work' && selectedProjectId) {
      return <AdminProjectDetail projectId={selectedProjectId} onBack={() => setSelectedProjectId(null)} />;
    }

    const panels = {
      overview: <Overview unreadMessages={unreadMessages} />,
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
      work: <WorkPanel onProjectSelect={(id) => setSelectedProjectId(id)} />,
      health: <HealthPanel />,
    };

    return panels[activeSection] || <Overview unreadMessages={unreadMessages} />;
  };

  return (
    <div className="admin-dashboard">
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        adminUser={adminUser}
        unreadMessages={unreadMessages}
        expandedSections={expandedSections}
        toggleSection={(section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))}
        handleLogout={handleLogout}
      />

      <div className="dashboard-content">
        <div className="content-header">
          <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
        </div>
        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;