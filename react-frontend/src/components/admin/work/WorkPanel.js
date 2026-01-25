import React, { useState } from 'react';
import '../../../common/global.css';
import TodoSection from './components/TodoSection';
import WorkProjectManager from './components/WorkProjectManager';

const WorkPanel = () => {
    // 預設可以改成 'todo' 或 'dev-progress'
    const [activeTab, setActiveTab] = useState('dev-progress');

    const renderContent = () => {
        switch (activeTab) {
            case 'todo':
                return <TodoSection />;
            case 'dev-progress':
                // 這裡會顯示所有工作專案的開發進度
                return <WorkProjectManager />;
            default:
                return null;
        }
    };

    return (
        <div className="container">
            {/* 模組切換導覽列 */}
            <div className="main-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    className={`nav-btn ${activeTab === 'todo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('todo')}
                >
                    日常代辦
                </button>
                
                <button
                    className={`nav-btn ${activeTab === 'dev-progress' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dev-progress')}
                >
                    專案開發進度
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