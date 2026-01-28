import React, { useState } from 'react';
import '../../../common/global.css';
import ProjectManager from './components/ProjectManager';
import TaskQuadrant from './components/TaskQuadrant';

const WorkPanel = ({ onProjectSelect }) => {
    // 預設可以改成 'todo' 或 'dev-progress'
    const [activeTab, setActiveTab] = useState('dev-progress');

    const renderContent = () => {
        switch (activeTab) {
            case 'dev-progress':
                // 將 callback 傳給專案管理組件
                return <ProjectManager onProjectClick={onProjectSelect} />;
            case 'task-quadrant':
                return <TaskQuadrant />;
            default:
                return null;
        }
    };

    return (
        <div className="container">
            {/* 模組切換導覽列 */}
            <div className="main-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    className={`nav-btn ${activeTab === 'dev-progress' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dev-progress')}
                >
                    專案開發進度
                </button>
                <button
                    className={`nav-btn ${activeTab === 'task-quadrant' ? 'active' : ''}`}
                    onClick={() => setActiveTab('task-quadrant')}
                >
                    任務象限圖
                </button>
            </div>

            {/* 主要內容顯示區 */}
            <div className="content-area" style={{ marginTop: '20px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default WorkPanel;