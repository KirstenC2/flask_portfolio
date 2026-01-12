import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBriefcase,
  faUserGraduate,
  faStar,
  faExternalLinkAlt,
  faCalendarAlt,
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
        setError('Failed to load timeline. Please try again later.');
        setLoading(false);
      }
    };
    fetchexperienceData();
  }, []);

  if (loading) return (
    <div className="timeline-loading">
      <div className="pulse-loader"></div>
      <p>Building Timeline...</p>
    </div>
  );
  
  if (error) return <div className="timeline-error">{error}</div>;

  const getYearFromItem = (item) => {
    const date = item.start_date || item.end_date || item.sortDate || item.date;
    return date ? new Date(date).getFullYear() : 'Unknown';
  };

  const combinedTimeline = (() => {
    if (!experienceData) return [];
    const expItems = (experienceData.experiences || []).map(e => ({ ...e, type: 'experience', sortDate: e.end_date || e.start_date }));
    const eduItems = (experienceData.education || []).map(e => ({ ...e, type: 'education', sortDate: e.end_date || e.start_date }));
    const lifeItems = (experienceData.life_events || []).map(e => ({ ...e, type: 'life', sortDate: e.end_date || e.start_date }));
    
    return [...expItems, ...eduItems, ...lifeItems]
      .sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));
  })();

  const groups = combinedTimeline.reduce((acc, item) => {
    const year = getYearFromItem(item);
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});

  const sortedYears = Object.keys(groups).sort((a, b) => b - a);

  return (
    <main className="experience-showcase">
      <div className="timeline-hero">
        <h1 className="gradient-text">Journey & Milestones</h1>
        <p>A chronological roadmap of my professional and personal growth.</p>
      </div>

      <div className="roadmap-container">
        <div className="roadmap-spine"></div>

        {sortedYears.map((year) => (
          <div key={year} className="roadmap-year-group">
            <div className="roadmap-year-header">
              <span>{year}</span>
            </div>

            <div className="roadmap-items">
              {groups[year].map((item, idx) => (
                <div key={`${item.id}-${idx}`} className={`roadmap-card type-${item.type} ${item.is_current ? 'is-active' : ''}`}>
                  <div className="roadmap-marker">
                    <FontAwesomeIcon icon={item.type === 'education' ? faUserGraduate : (item.type === 'life' ? faStar : faBriefcase)} />
                  </div>

                  <div className="roadmap-content">
                    <header className="roadmap-card-header">
                      <div className="roadmap-meta">
                        <span className="type-badge">{item.type}</span>
                        <span className="date-range">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          {new Date(item.start_date || item.date).toLocaleString('en-US', { month: 'short' })} 
                          {item.end_date ? ` — ${new Date(item.end_date).toLocaleString('en-US', { month: 'short' })}` : (item.is_current ? ' — Present' : '')}
                        </span>
                      </div>
                      <h3>{item.title || item.degree}</h3>
                      {item.company || item.school ? <h4>{item.company || item.school}</h4> : null}
                    </header>

                    {item.description && <p className="roadmap-desc">{item.description}</p>}

                    {item.projects && item.projects.length > 0 && (
                      <div className="roadmap-projects">
                        <h5>Key Projects</h5>
                        <div className="project-chips">
                          {item.projects.map(p => (
                            <div key={p.id} className="mini-project-card">
                              <span className="p-name">{p.title}</span>
                              <div className="p-links">
                                {p.project_url && <a href={p.project_url} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faExternalLinkAlt} /></a>}
                                {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faGithub} /></a>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default ExperiencePage;