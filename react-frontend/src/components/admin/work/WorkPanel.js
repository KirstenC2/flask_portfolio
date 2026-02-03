import React, { useState, useEffect } from 'react';
import { Dropdown, Tabs } from 'antd';
import {
    DownOutlined, SettingOutlined, BulbOutlined,
    FileTextOutlined, ProjectOutlined, AppstoreOutlined
} from '@ant-design/icons';
import ProjectManager from './components/ProjectManager';
import TaskQuadrant from './components/TaskQuadrant';
import ThinkingProjectForm from './components/forms/ThinkingProjectForm';
import TemplateManagementPage from './pages/TemplateManagementPage';
import WarBoardPage from './pages/WarBoardPage';

const WorkPanel = ({ onProjectSelect }) => {
    const [activeTab, setActiveTab] = useState('dev-progress');
    const [dynamicItems, setDynamicItems] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);

    const API_BASE = 'http://localhost:5001/api/admin/templates';
    const token = localStorage.getItem('adminToken');

    // 抓取模板
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch(API_BASE, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                const items = data.map(t => ({
                    key: `template-${t.id}`,
                    label: t.name,
                    icon: <FileTextOutlined />,
                    onClick: () => {
                        setSelectedTemplateId(t.id);
                        setActiveTab('dynamic-thinking-form');
                    }
                }));
                setDynamicItems(items);
            } catch (err) {
                console.error("選單抓取失敗", err);
            }
        };
        fetchTemplates();
    }, [token]);

    const dropdownMenu = {
        items: [
            ...dynamicItems,
            { type: 'divider' },
            {
                key: 'template-manager',
                label: '管理所有模板',
                icon: <SettingOutlined />,
                danger: true,
                onClick: () => setActiveTab('template-manager'),
            },
        ]
    };

    // Tabs 的配置
    const tabItems = [
        {
            key: 'dev-progress',
            label: (
                <span>
                    <ProjectOutlined />
                    專案開發進度
                </span>
            ),
        },
        {
            key: 'task-quadrant',
            label: (
                <span>
                    <AppstoreOutlined />
                    任務象限圖
                </span>
            ),
        },
        {
            key: 'war-board',
            label: (
                <span>
                    <AppstoreOutlined />
                    週報板
                </span>
            ),
        }
    ];

    // 內容渲染邏輯 (簡化為物件映射)
    const renderContent = () => {
        const components = {
            'dev-progress': <ProjectManager onProjectClick={onProjectSelect} />,
            'task-quadrant': <TaskQuadrant />,
            'dynamic-thinking-form': <ThinkingProjectForm templateId={selectedTemplateId} key={selectedTemplateId} />,
            'template-manager': <TemplateManagementPage />,
            'war-board': <WarBoardPage />
        };
        // 統一使用 activeTab 即可
        return components[activeTab];
    };

    // 處理當點擊思考引擎選單時，Tab 可能不在列隊中的標籤高亮問題
    const currentTab = ['dev-progress', 'task-quadrant','war-board'].includes(activeTab) ? activeTab : null;

    return (
        <div className="container" style={{ padding: '20px' }}>
            <div className="nav-wrapper" style={{
                background: '#fff',
                padding: '0 20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <Tabs
                    activeKey={currentTab}
                    onChange={(key) => setActiveTab(key)}
                    items={tabItems} // 你定義的 '專案開發進度' 和 '任務象限圖'
                    size="large"
                    tabBarExtraContent={
                        <Dropdown menu={dropdownMenu} placement="bottomRight">
                            <span
                                className={`mgmt-dropdown-trigger ${['dynamic-thinking-form', 'template-manager'].includes(activeTab) ? 'active' : ''}`}
                                style={{
                                    // 如果目前在動態表單或模板管理，就變色
                                    color: ['dynamic-thinking-form', 'template-manager'].includes(activeTab) ? '#5ec2c2' : '#666',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '12px 0',
                                    fontWeight: ['dynamic-thinking-form', 'template-manager'].includes(activeTab) ? '600' : 'normal'
                                }}
                            >
                                <BulbOutlined /> {/* 這裡維持思考引擎的 Bulb 圖標 */}
                                思考引擎
                                <DownOutlined style={{ fontSize: '10px' }} />
                            </span>
                        </Dropdown>
                    }
                />
            </div>

            <div className="content-area" style={{ marginTop: '24px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default WorkPanel;