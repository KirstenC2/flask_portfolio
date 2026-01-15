import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ddRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">Kirsten Choo</Link>
        <div className="nav-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
      <Link to="/experience" className={location.pathname === '/experience' ? 'active' : ''} role="menuitem" onClick={() => setOpen(false)}>My Journey</Link>
          <Link to="/skills" className={location.pathname === '/skills' ? 'active' : ''}>Skills</Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''} role="menuitem" onClick={() => setOpen(false)}>About</Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''} role="menuitem" onClick={() => setOpen(false)}>Contact</Link>
          
          <div
            className={`nav-dropdown ${open ? 'open' : ''}`}
            ref={ddRef}
          >
            <button
              className={`dropdown-toggle ${(location.pathname === '/about' || location.pathname === '/contact' || location.pathname === '/experience' || location.pathname.startsWith('/blog')) ? 'active' : ''}`}
              onClick={() => setOpen(v => !v)}
              aria-haspopup="true"
              aria-expanded={open}
            >
              More ▾
            </button>
            <div className="dropdown-menu" role="menu">
              <Link to="/studies" className={location.pathname === '/studies' ? 'active' : ''}>Studies</Link>
              <Link to="/projects" className={location.pathname === '/projects' ? 'active' : ''}>Projects</Link>
              <Link to="/blog" className={location.pathname.startsWith('/blog') ? 'active' : ''} role="menuitem" onClick={() => setOpen(false)}>Blog</Link>
              <Link to="/admin/login" className={location.pathname === '/admin/login' ? 'active' : ''} role="menuitem" onClick={() => setOpen(false)}>Admin</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
