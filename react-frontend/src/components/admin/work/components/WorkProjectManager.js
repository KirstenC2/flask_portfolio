import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. 引入導航
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faTasks } from '@fortawesome/free-solid-svg-icons';
import '../style/WorkPanel.css';
import '../../../../common/global.css';

const WorkProjectManager = ({ onProjectClick }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // 2. 初始化 navigate

    useEffect(() => {
        fetchWorkData();
    }, []);

    const fetchWorkData = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/admin/projects?type=work', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setProjects(response.data);
        } catch (err) { 
            console.error("載入失敗:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    // 3. 跳轉邏輯
    const goToProjectDetail = (projectId) => {
        if (onProjectClick) {
            onProjectClick(projectId);
        } else {
            navigate(`/admin/projects/${projectId}`);
        }
    };

    if (loading) return <div className="loading-container">Loading Work Projects...</div>;

    return (
        <div className="work-manager-dashboard">
            {projects.map(project => (
                <div key={project.id} className="project-dev-card">
                    {/* 點擊專案標題也可以跳轉 */}
                    <div className="project-dev-header" onClick={() => goToProjectDetail(project.id)} style={{cursor: 'pointer'}}>
                        <h4>{project.title}</h4>
                        <span className="view-detail-hint">View All Details</span>
                    </div>

                    <div className="features-container">
                        {project.dev_features && project.dev_features.map(feature => (
                            <div key={feature.id} className="feature-block">
                                {/* 點擊 Feature 直接跳轉到 Project Detail */}
                                <div 
                                    className="feature-link"
                                    onClick={() => goToProjectDetail(project.id)}
                                >
                                    <FontAwesomeIcon icon={faTasks} className="tasks-icon" />
                                    <span className="feature-title-text">{feature.title}</span>
                                    {/* 顯示該 Feature 下有幾個 Task (從 API 回傳的嵌套資料中取得) */}
                                    <span className="task-count">({feature.tasks?.length || 0} tasks)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WorkProjectManager;