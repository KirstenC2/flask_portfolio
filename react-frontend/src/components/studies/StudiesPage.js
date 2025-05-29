import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './StudiesPage.css';

const StudiesPage = () => {
  const [studies, setStudies] = useState({
    in_progress: [],
    completed: [],
    planned: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/studies');
        setStudies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching studies:', error);
        setError('Failed to load studies data. Please try again later.');
        setLoading(false);
      }
    };

    fetchStudies();
  }, []);

  if (loading) return <div className="loading">Loading studies...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="studies-page">
      <div className="container">
        <h1 className="page-title">My Learning Journey</h1>
        <p className="page-subtitle">
          Tracking my continuous learning and development in technology and programming
        </p>

        {/* In Progress Studies */}
        <section className="studies-section">
          <h2 className="section-title">Currently Learning</h2>
          <div className="studies-grid">
            {studies.in_progress.length > 0 ? (
              studies.in_progress.map(study => (
                <div className="study-card" key={study.id}>
                  <div className="study-header">
                    <h3>{study.title}</h3>
                    <span className="study-status in-progress">In Progress</span>
                  </div>
                  <div className="study-category">{study.category} • {study.source}</div>
                  <p className="study-description">{study.description}</p>
                  <div className="study-progress-container">
                    <div className="study-progress-bar">
                      <div 
                        className="study-progress-fill"
                        data-progress={study.progress}
                      ></div>
                    </div>
                    <span className="study-progress-text">{study.progress}% Complete</span>
                  </div>
                  <div className="study-footer">
                    <Link to={`/study/${study.id}`} className="btn btn-small">View Details</Link>
                    {study.github_url && (
                      <a 
                        href={study.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-small"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-items">No studies in progress at the moment.</p>
            )}
          </div>
        </section>

        {/* Completed Studies */}
        <section className="studies-section">
          <h2 className="section-title">Completed</h2>
          <div className="studies-grid">
            {studies.completed.length > 0 ? (
              studies.completed.map(study => (
                <div className="study-card" key={study.id}>
                  <div className="study-header">
                    <h3>{study.title}</h3>
                    <span className="study-status completed">Completed</span>
                  </div>
                  <div className="study-category">{study.category} • {study.source}</div>
                  <p className="study-description">{study.description}</p>
                  <div className="study-footer">
                    <Link to={`/study/${study.id}`} className="btn btn-small">View Details</Link>
                    {study.certificate_url && (
                      <a 
                        href={study.certificate_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-small"
                      >
                        Certificate
                      </a>
                    )}
                    {study.github_url && (
                      <a 
                        href={study.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-small"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-items">No completed studies yet.</p>
            )}
          </div>
        </section>

        {/* Planned Studies */}
        <section className="studies-section">
          <h2 className="section-title">Planned</h2>
          <div className="studies-grid">
            {studies.planned.length > 0 ? (
              studies.planned.map(study => (
                <div className="study-card" key={study.id}>
                  <div className="study-header">
                    <h3>{study.title}</h3>
                    <span className="study-status planned">Planned</span>
                  </div>
                  <div className="study-category">{study.category} • {study.source}</div>
                  <p className="study-description">{study.description}</p>
                  <div className="study-footer">
                    <Link to={`/study/${study.id}`} className="btn btn-small">View Details</Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-items">No planned studies at the moment.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default StudiesPage;
