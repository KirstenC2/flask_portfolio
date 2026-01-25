import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, faTasks, faSpinner, 
    faChevronDown, faChevronUp, faFilter 
} from '@fortawesome/free-solid-svg-icons';
import '../style/AdminProjectDetail.css'; 
import TaskManager from './TaskManager';

const AdminProjectDetail = ({ projectId, onBack }) => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- New States ---
    const [expandedFeatures, setExpandedFeatures] = useState({}); // Tracks { featureId: boolean }
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'

    const fetchProjectDetail = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`http://localhost:5001/api/admin/projects/info/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const projectData = Array.isArray(response.data) ? response.data[0] : response.data;
            setProject(projectData);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch project details.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectDetail();
    }, [fetchProjectDetail]);

    // Toggle function for features
    const toggleFeature = (featureId) => {
        setExpandedFeatures(prev => ({
            ...prev,
            [featureId]: !prev[featureId]
        }));
    };

    if (loading) return <div className="admin-loading"><FontAwesomeIcon icon={faSpinner} spin /> Loading...</div>;
    if (error) return <div className="admin-error">Error: {error} <button onClick={fetchProjectDetail}>Retry</button></div>;
    if (!project) return <div className="admin-error">Project not found.</div>;

    return (
        <div className="admin-project-detail-container">
            <button className="back-btn" onClick={onBack}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Work Management
            </button>

            <header className="project-header">
                <h1>{project.title}</h1>
                <div className="project-meta">
                    <span className="tech-badge">{project.technologies}</span>
                    <span className="type-badge">{project.project_type}</span>
                </div>
            </header>

            <div className="dev-features-section">
                <div className="section-header">
                    <h2>Development Roadmap</h2>
                    {/* --- Filter Controls --- */}
                    <div className="filter-bar">
                        <FontAwesomeIcon icon={faFilter} />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">All Tasks</option>
                            <option value="canceled">Canceled</option>
                            <option value="todo">To Do</option>
                            <option value="doing">In Progress</option>
                            <option value="done">Completed</option>
                        </select>
                    </div>
                </div>

                {project.dev_features && project.dev_features.length > 0 ? (
                    project.dev_features.map(feature => {
                        const isExpanded = expandedFeatures[feature.id];
                        
                        // --- Logic to filter tasks before passing to TaskManager ---
                        const filteredTasks = (feature.tasks || []).filter(task => {
                            if (statusFilter === 'all') return true;
                            return task.status === statusFilter;
                        });

                        return (
                            <div key={feature.id} className={`feature-detail-card ${isExpanded ? 'active' : ''}`}>
                                <div className="feature-info" onClick={() => toggleFeature(feature.id)} style={{ cursor: 'pointer' }}>
                                    <div className="feature-title-row">
                                        <h3><FontAwesomeIcon icon={faTasks} /> {feature.title}</h3>
                                        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                                    </div>
                                    <p>{feature.description}</p>
                                </div>

                                {/* --- Conditionally Render TaskManager based on Toggle --- */}
                                {isExpanded && (
                                    <div className="task-manager-wrapper">
                                        <TaskManager 
                                            feature_id={feature.id} 
                                            tasks={filteredTasks} 
                                            onUpdate={fetchProjectDetail} 
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="empty-state">No features defined for this project.</p>
                )}
            </div>
        </div>
    );
};

export default AdminProjectDetail;