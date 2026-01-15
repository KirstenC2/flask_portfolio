import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode } from '@fortawesome/free-solid-svg-icons';

// Destructure the props passed from the parent
const renderSkillCard = ({ skill, currentSkill, handleSelectSkill }) => {
  return (
    <div
      key={skill.id}
      className={`experience-card-item ${currentSkill?.id === skill.id ? 'active' : ''}`}
      onClick={() => handleSelectSkill(skill)}
    >
      <div className="card-main">
        <div className="card-icon"><FontAwesomeIcon icon={faCode} /></div>
        <div className="card-info">
          <div className="post-title-cell">{skill.name}</div>
          <div className="date-text">{skill.category}</div>
        </div>
        <div className="skill-indicator">
          <div className="mini-bar">
            <div className="mini-fill" style={{ width: `${(skill.proficiency / 5) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default renderSkillCard;