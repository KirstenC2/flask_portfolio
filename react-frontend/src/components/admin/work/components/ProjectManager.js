import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChevronRight, faTasks, faSearch, faFilter, faLayerGroup, 
    faChartPie, faCalendarAlt 
} from '@fortawesome/free-solid-svg-icons';
import '../style/WorkPanel.css';
import '../../../../common/global.css';

const ProjectManager = ({ onProjectClick, filter ='active' }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkData();
    }, [filter]);

    const fetchWorkData = async () => {
        try {
            console.log(filter);
            // 這裡呼叫的是優化後的輕量 API
            const response = await axios.get(`http://localhost:5001/api/admin/projects?status=${filter}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setProjects(response.data);
        } catch (err) {
            console.error("載入失敗:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterType === 'all' || project.project_type === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [projects, searchQuery, filterType]);

    const goToProjectDetail = (projectId) => {
        // 當點擊時，才會觸發外層的「讀取詳情 (get_projects_info)」邏輯
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

                        {/* --- 新版：使用 stats 取代 roadmap 預覽 --- */}
                        <div className="project-stats-overview">
                            <div className="stat-row">
                                <div className="stat-item">
                                    <FontAwesomeIcon icon={faChartPie} className="stat-icon" />
                                    <span>Progress: <strong>{project.stats?.percent || 0}%</strong></span>
                                </div>
                                <div className="stat-item">
                                    <FontAwesomeIcon icon={faTasks} className="stat-icon" />
                                    <span>Remaining: <strong>{project.stats?.remaining || 0}</strong></span>
                                </div>
                            </div>
                            
                            {/* 進度條預覽 */}
                            <div className="mini-progress-track">
                                <div 
                                    className="mini-progress-bar" 
                                    style={{ width: `${project.stats?.percent || 0}%` }}
                                ></div>
                            </div>

                            <div className="tech-stack-pills">
                                {project.technologies?.split(',').slice(0, 3).map(tech => (
                                    <span key={tech} className="tech-pill-sm">{tech.trim()}</span>
                                ))}
                                {project.technologies?.split(',').length > 3 && <span className="more-tech">...</span>}
                            </div>
                        </div>

                        <div className="card-footer">
                            <div className="date-info">
                                <FontAwesomeIcon icon={faCalendarAlt} />
                                <span>{new Date(project.date_created).toLocaleDateString()}</span>
                            </div>
                            <span className="view-detail-hint">View Tasks</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectManager;