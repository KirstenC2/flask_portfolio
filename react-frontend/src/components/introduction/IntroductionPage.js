import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IntroductionPage.css';

const IntroductionPage = () => {
  const [aboutData, setAboutData] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load: get default intro (and available_roles)
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/introduction');
        let data = response.data;
        // Fallback: if soft_skills missing/empty, fetch from /api/skills (category 'Soft Skills' or 'Soft')
        if (!data.soft_skills || data.soft_skills.length === 0) {
          try {
            const skillsResp = await axios.get('http://localhost:5001/api/skills');
            const categories = skillsResp.data || {};
            const softCat = categories['Soft Skills'] || categories['Soft'] || [];
            const softList = softCat.map(s => s.name).filter(Boolean);
            data = { ...data, soft_skills: softList };
          } catch (e) {
            // ignore fallback error; keep original data
          }
        }
        setAboutData(data);
        // Initialize selected role from API
        if (data && data.role) setSelectedRole(data.role);
        // Initialize language selection if languages provided
        const langs = (data && (data.languages || [])) || [];
        const lower = langs.map(l => (typeof l === 'string' ? l.toLowerCase() : l));
        if (lower.includes('korean') || lower.includes('ko')) setSelectedLang('ko');
        else if (lower.includes('chinese') || lower.includes('zh')) setSelectedLang('zh');
        else setSelectedLang('en');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching about data:', error);
        setError('Failed to load about information. Please try again later.');
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  // Refetch when role changes
  useEffect(() => {
    const fetchByRole = async (role) => {
      if (!role) return;
      try {
        const response = await axios.get(`http://localhost:5001/api/introduction`, { params: { role } });
        const data = response.data;
        console.log(data);
        setAboutData(data);
        // Preserve existing selectedLang if available; otherwise re-init
        const langs = (data && (data.languages || [])) || [];
        if (!langs.includes(selectedLang)) {
          const lower = langs.map(l => (typeof l === 'string' ? l.toLowerCase() : l));
          if (lower.includes('korean') || lower.includes('ko')) setSelectedLang('ko');
          else if (lower.includes('chinese') || lower.includes('zh')) setSelectedLang('zh');
          else setSelectedLang('en');
        }
      } catch (e) {
        // keep existing data
      }
    };
    fetchByRole(selectedRole);
  }, [selectedRole]);

  // Use data from the API response

  if (loading) return <div className="loading">Loading about information...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="introduction-page">
        {/* Role Switcher */}
        {aboutData?.available_roles && aboutData.available_roles.length > 0 && (
          <section className="role-switcher">
            <div className="section-header">
              <h2 className="section-title">Role</h2>
              <div className="role-buttons">
                {aboutData.available_roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-chip ${selectedRole === role ? 'active' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* Bio */}
        <section className="bio-section">
          <div className="section-header">
            <h2 className="section-title">Bio</h2>
          </div>
          <div>
            <p>{aboutData?.bio}</p>
          </div>
        </section>

        

        <section className="skill-passages-section">
          <div className="section-header">
            <h2 className="section-title">As a {(aboutData && aboutData.role) ? aboutData.role : 'TPM'} ...</h2>
            <div className="lang-switcher">
              {['ko','zh','en'].map(code => (
                <button
                  key={code}
                  type="button"
                  className={`lang-chip ${selectedLang === code ? 'active' : ''}`}
                  onClick={() => setSelectedLang(code)}
                >
                  {code === 'ko' ? 'Korean' : code === 'zh' ? 'Chinese' : 'English'}
                </button>
              ))}
            </div>
          </div>
          <div className="skill-passages-grid">
            {(() => {
              const passages = (aboutData && aboutData.skill_passages && aboutData.skill_passages[selectedLang]) || {};
              const topics = Object.keys(passages || {});
              if (topics.length === 0) {
                return (
                  <div className="empty-hint">Provide your {selectedLang === 'ko' ? 'Korean' : selectedLang === 'zh' ? 'Chinese' : 'English'} PM/TPM passages to populate this section.</div>
                );
              }
              return topics.map(name => (
                <article key={name} className="skill-passage-card">
                  <h3 className="skill-name">{name}</h3>
                  <p className="skill-text">{passages[name]}</p>
                </article>
              ));
            })()}
          </div>
        </section>

        {aboutData?.soft_skills && aboutData.soft_skills.length > 0 && (
          <section className="soft-skills-section">
            <h2 className="section-title">Soft Skills</h2>
            <ul className="soft-skills-list">
              {aboutData.soft_skills.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}

      
    </main>
  );
};

export default IntroductionPage;
