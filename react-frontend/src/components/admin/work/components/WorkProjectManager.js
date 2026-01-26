import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faTasks, faSearch, faFilter, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import '../style/WorkPanel.css';
import '../../../../common/global.css';

const WorkProjectManager = ({ onProjectClick }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkData();
    }, []);

    const fetchWorkData = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/admin/projects', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setProjects(response.data);
        } catch (err) {
            console.error("載入失敗:", err);
        } finally {
            setLoading(false);
        }
    };

    // 篩選與搜尋邏輯
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === 'all' || project.project_type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [projects, searchQuery, filterType]);

    const goToProjectDetail = (projectId) => {
        if (onProjectClick) {
            onProjectClick(projectId);
        } else {
            navigate(`/admin/projects/${projectId}`);
        }
    };

    if (loading) return (
        <div className="loading-state">
            <FontAwesomeIcon icon={faLayerGroup} spin />
            <p>Loading Projects...</p>
        </div>
    );

    return (
        <div className="work-manager-dashboard">
            {/* --- Filter & Search Bar --- */}
            <div className="work-filter-bar">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        placeholder="搜尋專案標題..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <span className="filter-label"><FontAwesomeIcon icon={faFilter} /> Filter:</span>
                    <div className="filter-options">
                        {['all', 'work', 'side'].map(type => (
                            <button
                                key={type}
                                className={filterType === type ? 'active' : ''}
                                onClick={() => setFilterType(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Project Grid --- */}
            <div className="project-grid">
                {filteredProjects.map(project => (
                    <div key={project.id} className="project-dev-card" onClick={() => goToProjectDetail(project.id)}>
                        <div className="project-dev-header">
                            <div className="title-area">
                                <h4>{project.title}</h4>
                                <span className={`type-tag ${project.project_type}`}>{project.project_type}</span>
                            </div>
                            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
                        </div>

                        <div className="features-preview">
                            <p className="section-label">Roadmap Preview</p>
                            {project.dev_features && project.dev_features.length > 0 ? (
                                project.dev_features.slice(0, 3).map(feature => (
                                    <div key={feature.id} className="feature-mini-item">
                                        <FontAwesomeIcon icon={faTasks} className="tasks-icon" />
                                        <span className="feature-title-text">{feature.title}</span>
                                        <span className="task-pill">{feature.tasks?.length || 0}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-features">No features defined</p>
                            )}
                            {project.dev_features?.length > 3 && (
                                <p className="more-count">and {project.dev_features.length - 3} more...</p>
                            )}
                        </div>

                        <div className="card-footer">
                            <span className="view-detail-hint">Enter Dashboard</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkProjectManager;