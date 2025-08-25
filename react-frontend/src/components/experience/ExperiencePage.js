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
        if (process.env.NODE_ENV !== 'production') {
          console.log('[ExperiencePage] fetched keys:', Object.keys(response.data || {}));
          console.log('[ExperiencePage] life_events count:', (response.data.life_events || []).length);
          console.log('[ExperiencePage] experiences count:', (response.data.experiences || []).length);
          console.log('[ExperiencePage] education count:', (response.data.education || []).length);
        }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ExperiencePage] merged counts:', {
        exp: expItems.length,
        edu: eduItems.length,
        life: lifeItems.length,
      });
    }
    const sorted = [...expItems, ...eduItems, ...lifeItems]
      .sort((a, b) => new Date(b.sortDate || 0) - new Date(a.sortDate || 0));
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ExperiencePage] first 5 sorted types:', sorted.slice(0, 5).map(i => i.type));
    }
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
        {
          /* Group by year to render a big year node with smaller nodes beneath */
        }
        <div className="timeline">
          {(() => {
            if (combinedTimeline.length === 0) return <p className="no-data">No timeline data available</p>;
            // De-duplicate items (in case API returns overlaps)
            const seen = new Set();
            const unique = [];
            for (const it of combinedTimeline) {
              const k = it.id != null
                ? `${it.type}:${it.id}`
                : `${it.type}|${it.displayTitle}|${it.start_date}|${it.end_date}`;
              if (seen.has(k)) continue;
              seen.add(k);
              unique.push(it);
            }

            // Build groups: year -> items[]
            const groupsMap = new Map();
            const getYearFromItem = (item) => {
              if (item.start_date) return new Date(item.start_date).getFullYear();
              if (item.end_date) return new Date(item.end_date).getFullYear();
              if (item.sortDate) return new Date(item.sortDate).getFullYear();
              if (item.date) return new Date(item.date).getFullYear();
              if (typeof item.year === 'string') {
                const m = item.year.match(/\b(\d{4})\b/);
                if (m) return Number(m[1]);
              }
              if (typeof item.year === 'number') return item.year;
              return null;
            };
            for (const item of unique) {
              const y = getYearFromItem(item);
              const key = y ?? 'Unknown';
              if (!groupsMap.has(key)) groupsMap.set(key, []);
              groupsMap.get(key).push(item);
            }
            const yearsDesc = Array.from(groupsMap.keys()).sort((a, b) => {
              const na = a === 'Unknown' ? -Infinity : a;
              const nb = b === 'Unknown' ? -Infinity : b;
              return nb - na;
            });
            return yearsDesc.map((year, gi) => {
              const group = { year, items: groupsMap.get(year) };
              return (
              <div className="timeline-year-block" key={`yblk-${group.year}-${gi}`}>
                <div className="timeline-year-node">
                  <div className="year-dot" />
                  <div className="year-text">{group.year}</div>
                </div>

                {group.items.map((item, index) => (
                  <div className={`timeline-item${item.isCurrent ? ' current' : ''}`} key={item.id || `${item.type}-${gi}-${index}`}>
                    <div className="timeline-dot">
                      <FontAwesomeIcon icon={item.type === 'education' ? faUserGraduate : (item.type === 'life' ? faStar : faBriefcase)} />
                    </div>
                    <div className="timeline-date">
                      {(() => {
                        const ts = item.start_date || item.end_date || item.sortDate || item.date;
                        if (!ts) return '';
                        return new Date(ts).toLocaleString('en-US', { month: 'short' });
                      })()}
                    </div>
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
                                  <div className="project-title-column">
                                    <span className="project-name">{p.title}</span>
                                  </div>
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
                ))}
              </div>
              );
            });
          })()}
        </div>
      </section>
    </main>
  );
}

export default ExperiencePage;
