import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faUserGraduate,
  faStar,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import './ExperiencePage.css';

const ExperiencePage = () => {
  const [experienceData, setexperienceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchexperienceData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/experience');
        setexperienceData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching experience data:', error);
        setError('Failed to load experience information. Please try again later.');
        setLoading(false);
      }
    };

    fetchexperienceData();
  }, []);

  // Use data from the API response

  if (loading) return <div className="loading">Loading experience information...</div>;
  if (error) return <div className="error">{error}</div>;

  // Build unified lifetime timeline (work + education + life), newest first
  const combinedTimeline = (() => {
    if (!experienceData) return [];
    const expItems = (experienceData.experiences || []).map((e) => ({
      ...e,
      type: 'experience',
      sortDate: e.end_date || e.start_date || null,
      displayTitle: e.title,
      displaySubtitle: e.company,
    }));
    const eduItems = (experienceData.education || []).map((e) => ({
      ...e,
      type: 'education',
      sortDate: e.end_date || e.start_date || null,
      displayTitle: e.degree,
      displaySubtitle: e.school,
    }));
    const lifeItems = (experienceData.life_events || []).map((e) => ({
      ...e,
      type: 'life',
      sortDate: e.end_date || e.start_date || null,
      displayTitle: e.title,
      displaySubtitle: null,
    }));
    const sorted = [...expItems, ...eduItems, ...lifeItems]
      .sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));
    // Compute grouping info: if consecutive items share the same year, add flags and labels
    return sorted.map((item, idx, arr) => {
      const currentYear = item.year;
      const prevYear = idx > 0 ? arr[idx - 1].year : null;
      const firstOfYear = currentYear !== prevYear;
      const isCurrent = Boolean(item.is_current) || !item.end_date;
      // Build date range label: Start — End/Present
      const format = (dt) => new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric' });
      const startLabel = item.start_date ? format(item.start_date) : '';
      const endLabel = isCurrent ? 'Present' : (item.end_date ? format(item.end_date) : '');
      let dateLabel = '';
      if (startLabel && endLabel) dateLabel = `${startLabel} — ${endLabel}`;
      else if (startLabel) dateLabel = startLabel;
      else if (endLabel) dateLabel = endLabel;
      return { ...item, firstOfYear, dateLabel, isCurrent };
    });
  })();

  return (
    <main className="experience-page">
      <section className="experience-section">
        <h2 className="section-title">My Lifetime Timeline</h2>
        <div className="timeline">
          {combinedTimeline.length > 0 ? (
            combinedTimeline.map((item, index) => (
              <React.Fragment key={item.id || `${item.type}-${index}`}>
                {item.firstOfYear && (
                  <div className="timeline-year">{item.year}</div>
                )}
                <div className={`timeline-item${item.isCurrent ? ' current' : ''}`}>
                  <div className="timeline-dot">
                    <FontAwesomeIcon icon={item.type === 'education' ? faUserGraduate : (item.type === 'life' ? faStar : faBriefcase)} />
                  </div>
                  <div className="timeline-date">{item.dateLabel}</div>
                  <div className="timeline-content">
                    <h3>{item.displayTitle}</h3>
                    
                    {item.displaySubtitle && <h4>{item.displaySubtitle}</h4>}
                    {item.description && <p>{item.description}</p>}

                   
                    {item.type === 'experience' && Array.isArray(item.projects) && item.projects.length > 0 && (
                     <React.Fragment>
                     <h5 className="projects-title">Projects</h5>
                    <div className="experience-projects">
                        
                        <ul className="projects-list">
                          {item.projects.map((p) => (
                            <li key={p.id} className="project-item">
                              {/* Title at top */}
                              <div className="project-title-column">
                                <span className="project-name">{p.title}</span>
                              </div>
                              {/* Details in the middle (row-based on wide screens) */}
                              {(p.description || p.github_url || p.project_url) && (
                                <div className="project-body">
                                  {p.description && <p className="project-desc">{p.description}</p>}
                                  {(p.github_url || p.project_url) && (
                                    <div className="project-links">
                                      {p.project_url && (
                                        <a href={p.project_url} target="_blank" rel="noreferrer" className="project-link">
                                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                                          <span>Live</span>
                                        </a>
                                      )}
                                      {p.github_url && (
                                        <a href={p.github_url} target="_blank" rel="noreferrer" className="project-link">
                                          <FontAwesomeIcon icon={faGithub} />
                                          <span>GitHub</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Tech tags last */}
                              {p.technologies && (
                                <div className="project-techs">
                                  {p.technologies.split(',').map((t, idx) => {
                                    const label = t.trim();
                                    if (!label) return null;
                                    return (
                                      <span key={`${p.id}-tech-${idx}`} className="project-tech">{label}</span>
                                    );
                                  })}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      </React.Fragment>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <p className="no-data">No timeline data available</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default ExperiencePage;
