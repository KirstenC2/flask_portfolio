import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTasks, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import '../style/WorkPanel.css';
import '../../../../common/global.css';
const WorkProjectManager = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskContent, setNewTaskContent] = useState({}); // 用於儲存每個 Feature 下的新 Task 輸入

    useEffect(() => {
        const fetchWorkData = async () => {
            try {
                // 這裡呼叫你的 Flask API，獲取所有 type='work' 的 projects 及其關聯的 dev_features
                const response = await axios.get('http://localhost:5001/api/admin/projects?type=work', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });
                console.log(response.data);
                setProjects(response.data);
            } catch (err) {
                console.error("載入工作專案失敗", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkData();
    }, []);

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await axios.patch(`http://localhost:5001/api/dev-tasks/${taskId}`, { status: newStatus });
            // 更新本地 State 邏輯 (同前)
            setProjects(prev => prev.map(p => ({
                ...p,
                dev_features: p.dev_features.map(f => ({
                    ...f,
                    tasks: f.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
                }))
            })));
        } catch (err) { alert("更新失敗"); }
    };

    if (loading) return <div className="p-10 text-center"><FontAwesomeIcon icon={faSpinner} spin /> 載入開發進度中...</div>;

    return (
        <div className="work-manager-dashboard">
            {projects.map(project => (
                <div key={project.id} className="project-dev-card">
                    <div className="project-dev-header">
                        <h4>{project.title}</h4>
                        <span className="tech-badge">{project.technologies}</span>
                    </div>

                    <div className="features-container">
                        {project.dev_features && project.dev_features.map(feature => (
                            <div key={feature.id} className="feature-block">
                                <div className="feature-subtitle">
                                    <FontAwesomeIcon icon={faTasks} /> {feature.title}
                                </div>
                                
                                <div className="task-items">
                                    {feature.tasks.map(task => (
                                        <div key={task.id} className={`task-row ${task.status}`}>
                                            <span className="task-text">{task.content}</span>
                                            <div className="task-ctrl">
                                                <button onClick={() => handleStatusChange(task.id, 'todo')} className={task.status === 'todo' ? 'active' : ''}>待辦</button>
                                                <button onClick={() => handleStatusChange(task.id, 'doing')} className={task.status === 'doing' ? 'active' : ''}>進行中</button>
                                                <button onClick={() => handleStatusChange(task.id, 'done')} className={task.status === 'done' ? 'active' : ''}>完成</button>
                                            </div>
                                        </div>
                                    ))}
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