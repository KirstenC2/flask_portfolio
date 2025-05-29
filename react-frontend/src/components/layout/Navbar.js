import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">Kirsten Choo</Link>
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/projects" className={location.pathname === '/projects' ? 'active' : ''}>Projects</Link>
          <Link to="/skills" className={location.pathname === '/skills' ? 'active' : ''}>Skills</Link>
          <Link to="/studies" className={location.pathname === '/studies' ? 'active' : ''}>Studies</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
