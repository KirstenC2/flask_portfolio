import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './components/pages/HomePage';
import StudiesPage from './components/studies/StudiesPage';
import StudyDetail from './components/studies/StudyDetail';
import SkillsPage from './components/skills/SkillsPage';
import ProjectsPage from './components/projects/ProjectsPage';
import AboutPage from './components/about/AboutPage';
import ContactPage from './components/contact/ContactPage';
import ExperiencePage from './components/experience/ExperiencePage';
import BlogSplitView from './components/blog/BlogSplitView';
import BlogEditor from './components/blog/BlogEditor';
import IntroductionPage from './components/introduction/IntroductionPage';

// Admin Components
import LoginPage from './components/admin/auth/LoginPage';
import Dashboard from './components/admin/dashboard/Dashboard';

// Placeholder components for pages we haven't created yet
const ProjectDetail = () => <div className="container" style={{ padding: '5rem 1.5rem' }}><h1>Project Detail</h1><p>This page is under construction.</p></div>;

// Private Route component to protect admin routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('adminToken') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes - No Navbar/Footer */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin/*" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin/blog/new" 
          element={
            <PrivateRoute>
              <BlogEditor />
            </PrivateRoute>
          }
        />
        
        {/* Main Site Routes - With Navbar/Footer */}
        <Route path="/*" element={
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/introduction" element={<IntroductionPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/studies" element={<StudiesPage />} />
              <Route path="/study/:id" element={<StudyDetail />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/experience" element={<ExperiencePage />} />
              <Route path="/blog/*" element={<BlogSplitView />} />
            </Routes>
            <Footer />
          </div>
        } />      
      </Routes>
    </Router>
  );
}

export default App;
