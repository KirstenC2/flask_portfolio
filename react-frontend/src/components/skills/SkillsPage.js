import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCode, 
  faDatabase, 
  faServer, 
  faTools, 
  faTasks, 
  faUsers, 
  faLanguage, 
  faLaptopCode,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import './SkillsPage.css';

// Define skill domains and their associated categories
const SKILL_DOMAINS = {
  'Technical': {
    icon: faLaptopCode,
    categories: ['Programming', 'Frameworks', 'Databases', 'DevOps', 'API']
  },
  'Project Management': {
    icon: faTasks,
    categories: ['Methodology', 'Tools']
  },
  'Soft Skills': {
    icon: faUsers,
    categories: ['Communication', 'Leadership', 'Design']
  },
  'Languages': {
    icon: faLanguage,
    categories: ['Human Languages', 'Markup Languages']
  }
};

// Icons for specific categories
const CATEGORY_ICONS = {
  'Programming': faCode,
  'Frameworks': faServer,
  'Databases': faDatabase,
  'DevOps': faTools,
  // Add more category-specific icons as needed
};

const SkillsPage = () => {
  const [skillCategories, setSkillCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizedSkills, setOrganizedSkills] = useState({});
  
  // Track expanded/collapsed state of domains and categories
  const [expandedDomains, setExpandedDomains] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/skills');
        setSkillCategories(response.data);
        
        // Organize skills by domains
        organizeSkillsByDomains(response.data);
        
        // Initialize all domains as expanded, categories as collapsed
        const domains = {};
        const categories = {};
        
        Object.keys(SKILL_DOMAINS).forEach(domain => {
          // Set domains expanded initially
          domains[domain] = true;
          
          // Set all categories collapsed initially
          SKILL_DOMAINS[domain].categories.forEach(category => {
            const categoryKey = `${domain}-${category}`;
            categories[categoryKey] = false;
          });
        });
        
        // Also handle "Other" category
        domains['Other'] = true;
        
        setExpandedDomains(domains);
        setExpandedCategories(categories);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching skills:', error);
        setError('Failed to load skills data. Please try again later.');
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);
  
  // Organize skills into domains and their categories
  const organizeSkillsByDomains = (data) => {
    const organized = {};
    
    // Initialize domains with empty categories
    Object.keys(SKILL_DOMAINS).forEach(domain => {
      organized[domain] = {};
      SKILL_DOMAINS[domain].categories.forEach(category => {
        organized[domain][category] = [];
      });
    });
    
    // Add "Other" domain for any categories not explicitly mapped
    organized['Other'] = {};
    
    // Distribute skills from API to the organized structure
    Object.keys(data).forEach(category => {
      // Find which domain this category belongs to
      let foundDomain = Object.keys(SKILL_DOMAINS).find(domain => 
        SKILL_DOMAINS[domain].categories.includes(category)
      );
      
      // If no domain mapping exists, put it in "Other"
      if (!foundDomain) {
        organized['Other'][category] = data[category];
      } else {
        // Add skills to the appropriate domain and category
        organized[foundDomain][category] = data[category];
      }
    });
    
    // Clean up empty domains and categories
    Object.keys(organized).forEach(domain => {
      if (domain === 'Other') {
        if (Object.keys(organized[domain]).length === 0) {
          delete organized[domain];
        }
      } else {
        // Remove empty categories
        Object.keys(organized[domain]).forEach(category => {
          if (organized[domain][category].length === 0) {
            delete organized[domain][category];
          }
        });
        
        // Remove domain if all categories are empty
        if (Object.keys(organized[domain]).length === 0) {
          delete organized[domain];
        }
      }
    });
    
    setOrganizedSkills(organized);
  };

  if (loading) return <div className="loading">Loading skills...</div>;
  if (error) return <div className="error">{error}</div>;
  
  // If no domains have skills
  const noSkills = Object.keys(organizedSkills).length === 0;

  // Toggle domain expansion
  const toggleDomain = (domain) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
    
    // If collapsing a domain, also collapse all its categories
    if (expandedDomains[domain]) {
      const updatedCategories = {...expandedCategories};
      
      // Only if domain exists in SKILL_DOMAINS
      if (SKILL_DOMAINS[domain]) {
        SKILL_DOMAINS[domain].categories.forEach(category => {
          updatedCategories[`${domain}-${category}`] = false;
        });
        setExpandedCategories(updatedCategories);
      }
    }
  };
  
  // Toggle category expansion
  const toggleCategory = (domain, category) => {
    const categoryKey = `${domain}-${category}`;
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };
  
  return (
    <main className="skills-page">
      <div className="container">
        <h1 className="page-title">My Skills</h1>
        <p className="page-subtitle">
          A comprehensive overview of my professional skills and proficiency levels
        </p>
        
        {noSkills ? (
          <p className="no-skills">No skills found in database.</p>
        ) : (
          Object.keys(organizedSkills).map(domain => (
            <div key={domain} className="skill-domain">
              <div 
                className="domain-header clickable" 
                onClick={() => toggleDomain(domain)}
              >
                {SKILL_DOMAINS[domain] && (
                  <FontAwesomeIcon 
                    icon={SKILL_DOMAINS[domain]?.icon || faCode} 
                    className="domain-icon" 
                  />
                )}
                <h2 className="domain-title">{domain}</h2>
                <FontAwesomeIcon 
                  icon={expandedDomains[domain] ? faChevronUp : faChevronDown} 
                  className="toggle-icon"
                />
              </div>
              
              {expandedDomains[domain] && (
                <div className="domain-content">
                  {Object.keys(organizedSkills[domain]).map(category => {
                    const categoryKey = `${domain}-${category}`;
                    return (
                      <section key={categoryKey} className="skills-section">
                        <div 
                          className="category-header clickable"
                          onClick={() => toggleCategory(domain, category)}
                        >
                          {CATEGORY_ICONS[category] && (
                            <FontAwesomeIcon 
                              icon={CATEGORY_ICONS[category]} 
                              className="category-icon" 
                            />
                          )}
                          <h3 className="section-title">{category}</h3>
                          <FontAwesomeIcon 
                            icon={expandedCategories[categoryKey] ? faChevronUp : faChevronDown} 
                            className="toggle-icon"
                          />
                        </div>
                        
                        {expandedCategories[categoryKey] && (
                          <div className="skills-grid">
                            {organizedSkills[domain][category].map(skill => (
                              <div key={skill.id} className="skill-card">
                                <h3>{skill.name}</h3>
                                <div className="skill-bar-container">
                                  <div className="skill-bar">
                                    <div 
                                      className="skill-bar-fill"
                                      style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                                    ></div>
                                  </div>
                                  <div className="skill-level">
                                    {renderProficiencyStars(skill.proficiency)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
};

// Helper function to render stars based on proficiency level
const renderProficiencyStars = (level) => {
  const stars = [];
  const maxStars = 5;
  
  for (let i = 1; i <= maxStars; i++) {
    if (i <= level) {
      stars.push(<span key={i} className="star filled">★</span>);
    } else {
      stars.push(<span key={i} className="star">☆</span>);
    }
  }
  
  return stars;
};

const deleteSkill = async (skillId) => {
  const response = await fetch(`/api/admin/skills/${skillId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete skill');
  }
}


export default SkillsPage;
