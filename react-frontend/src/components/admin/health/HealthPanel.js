import React, { useState } from 'react';
import { Tabs, Dropdown, ConfigProvider } from 'antd';
import { 
    RestOutlined, SettingOutlined, 
    DownOutlined, SmileOutlined 
} from '@ant-design/icons';
import AlcoholManager from './components/AlcoholManager';
import '../../../common/global.css';

const HealthPanel = () => {
    const [activeTab, setActiveTab] = useState('alcoholic');

    // 1. 下拉選單項目 (比照 Finance 的管理設計)
    const managementItems = [
        {
            key: 'health-config',
            label: '健康參數設定',
            icon: <SettingOutlined />,
            onClick: () => setActiveTab('health-config'),
        }
    ];

    // 2. 內容組件對照表 (唯一來源控制)
    const tabComponents = {
        'alcoholic': <AlcoholManager />,
        // 'health-config': <div>這裡放健康設定內容...</div>, // 預留空間
        // 'moody-diary': <div>這裡放情緒日記內容...</div>,
    };

    // 3. Tabs 條上顯示的標籤 (不含下拉選單內的項目)
    const navItems = [
        {
            key: 'alcoholic',
            label: (
                <span>
                    <RestOutlined /> 酒精攝取管理
                </span>
            ),
        }
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#5ec2c2', // 保持你最愛的青色系
                    borderRadius: 8,
                },
            }}
        >
            <div className="container" style={{ padding: '20px' }}>
                {/* 導覽列容器 - 完全比照 Finance 風格 */}
                <div className="health-nav-wrapper" style={{ 
                    background: '#fff', 
                    padding: '0 20px', 
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                }}>
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={(key) => setActiveTab(key)} 
                        items={navItems} 
                        size="large"
                        tabBarExtraContent={
                            <Dropdown menu={{ items: managementItems }} placement="bottomRight">
                                <span 
                                    className={`mgmt-dropdown-trigger ${activeTab === 'health-config' ? 'active' : ''}`}
                                    style={{ 
                                        color: activeTab === 'health-config' ? '#5ec2c2' : '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '12px 0',
                                        fontWeight: activeTab === 'health-config' ? '600' : 'normal'
                                    }}
                                >
                                    <SettingOutlined />
                                    管理
                                    <DownOutlined style={{ fontSize: '10px' }} />
                                </span>
                            </Dropdown>
                        }
                    />
                </div>

                {/* 主要內容顯示區 */}
                <div className="health-content-area" style={{ marginTop: '20px' }}>
                    {tabComponents[activeTab]}
                </div>
            </div>
        </ConfigProvider>
    );
};

export default HealthPanel;