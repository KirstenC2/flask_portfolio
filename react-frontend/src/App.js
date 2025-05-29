import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './components/pages/HomePage';
import StudiesPage from './components/studies/StudiesPage';
import StudyDetail from './components/studies/StudyDetail';
import SkillsPage from './components/skills/SkillsPage';

// Placeholder components for pages we haven't created yet
const ProjectsPage = () => <div className="container" style={{ padding: '5rem 1.5rem' }}><h1>Projects Page</h1><p>This page is under construction.</p></div>;
const AboutPage = () => <div className="container" style={{ padding: '5rem 1.5rem' }}><h1>About Page</h1><p>This page is under construction.</p></div>;
const ContactPage = () => <div className="container" style={{ padding: '5rem 1.5rem' }}><h1>Contact Page</h1><p>This page is under construction.</p></div>;
const ProjectDetail = () => <div className="container" style={{ padding: '5rem 1.5rem' }}><h1>Project Detail</h1><p>This page is under construction.</p></div>;

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/studies" element={<StudiesPage />} />
          <Route path="/study/:id" element={<StudyDetail />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
