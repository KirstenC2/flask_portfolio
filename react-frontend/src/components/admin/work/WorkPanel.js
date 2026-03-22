import React, { useState, useEffect } from 'react';
import { Dropdown, Tabs } from 'antd';
import {
    DownOutlined, SettingOutlined, BulbOutlined,
    FileTextOutlined, ProjectOutlined, AppstoreOutlined,
    DollarOutlined, MedicineBoxOutlined
} from '@ant-design/icons';
import ProjectManager from './components/ProjectManager';
import TaskQuadrant from './components/TaskQuadrant';
import ThinkingProjectForm from './components/forms/ThinkingProjectForm';
import TemplateManagementPage from './pages/TemplateManagementPage';
import WarBoardPage from './pages/WarBoardPage';
import QuotationSystem from './components/quotation/quotationEditor';
import ServiceList from './components/quotation/serviceList';

const WorkPanel = ({ onProjectSelect }) => {
    const [activeTab, setActiveTab] = useState('dev-progress');
    const [dynamicItems, setDynamicItems] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    // const [projectFilter, setProjectFilter] = useState('active'); // 預設看進行中
    const [activeFilter, setActiveFilter] = useState('active'); // 預設看進行中
    const API_BASE = 'http://localhost:5001/api/admin/templates';
    const token = localStorage.getItem('adminToken');

    // 抓取思考引擎模板
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

    // --- 選單配置 ---

    // 1. 思考引擎 Dropdown
    const thinkingMenu = {
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

    // 2. 商務報價 Dropdown
    const businessMenu = {
        items: [
            {
                key: 'quotation-editor',
                label: '新建報價單',
                icon: <FileTextOutlined />,
                onClick: () => setActiveTab('quotation-editor'),
            },
            {
                key: 'service-list',
                label: '標準服務軍火庫',
                icon: <MedicineBoxOutlined />,
                onClick: () => setActiveTab('service-list'),
            },
        ]
    };

    // 3. 主 Tabs 配置 (僅保留開發核心)
    const tabItems = [
        { 
        key: 'dev-progress', 
        label: (
            <Dropdown
                menu={{
                    items: [
                        { key: 'active', label: '進行中專案', icon: <ProjectOutlined /> },
                        { key: 'inactive', label: '已封存專案', icon: <ProjectOutlined />, danger: true },
                    ],
                    onClick: ({ key }) => {
                        // setProjectFilter(key);
                        setActiveFilter(key);
                        setActiveTab('dev-progress'); // 確保切換回這個 Tab
                    }
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ProjectOutlined />
                    {activeFilter === 'active' ? '專案開發進度' : '已封存專案'}
                    <DownOutlined style={{ fontSize: '10px', marginLeft: '4px' }} />
                </span>
            </Dropdown>
        )
    },
        { key: 'task-quadrant', label: <span><AppstoreOutlined />任務象限圖</span> },
        { key: 'war-board', label: <span><AppstoreOutlined />週報板</span> },
    ];

    // --- 渲染邏輯 ---

    const renderContent = () => {
        const components = {
            'dev-progress': (
            <ProjectManager 
                key={activeFilter} 
                filter={activeFilter} 
                onProjectClick={onProjectSelect} 
            />
        ),
            'task-quadrant': <TaskQuadrant />,
            'dynamic-thinking-form': <ThinkingProjectForm templateId={selectedTemplateId} key={selectedTemplateId} />,
            'template-manager': <TemplateManagementPage />,
            'war-board': <WarBoardPage />,
            'quotation-editor': <QuotationSystem />,
            'service-list': <ServiceList />,
        };
        return components[activeTab] || components['dev-progress'];
    };

    // 判斷當前高亮狀態
    const isThinkingActive = ['dynamic-thinking-form', 'template-manager'].includes(activeTab);
    const isBusinessActive = ['quotation-editor', 'service-list'].includes(activeTab);
    const currentTab = ['dev-progress', 'task-quadrant', 'war-board'].includes(activeTab) ? activeTab : null;

    // 統一的 Dropdown Trigger 樣式封裝
    const triggerStyle = (isActive, activeColor = '#1677ff') => ({
        color: isActive ? activeColor : '#666',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 15px',
        fontWeight: isActive ? '600' : 'normal',
        transition: 'all 0.3s'
    });

    return (
        <div className="container" style={{ padding: '20px' }}>
            <div className="nav-wrapper" style={{
                background: '#fff',
                padding: '0 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center'
            }}>
                <Tabs
                    activeKey={currentTab}
                    onChange={(key) => setActiveTab(key)}
                    items={tabItems}
                    size="large"
                    style={{ flex: 1 }}
                    tabBarExtraContent={
                        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            {/* 商務報價下拉 */}
                            <Dropdown menu={businessMenu} placement="bottomRight">
                                <span style={triggerStyle(isBusinessActive, '#1677ff')}>
                                    <DollarOutlined />
                                    商務報價
                                    <DownOutlined style={{ fontSize: '10px' }} />
                                </span>
                            </Dropdown>

                            {/* 思考引擎下拉 */}
                            <Dropdown menu={thinkingMenu} placement="bottomRight">
                                <span style={triggerStyle(isThinkingActive, '#5ec2c2')}>
                                    <BulbOutlined />
                                    思考引擎
                                    <DownOutlined style={{ fontSize: '10px' }} />
                                </span>
                            </Dropdown>
                        </div>
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