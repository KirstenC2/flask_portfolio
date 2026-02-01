import React, { useState } from 'react';
import { Tabs, Dropdown, ConfigProvider, Card } from 'antd';
import { 
    BookOutlined, SmileOutlined, SettingOutlined, 
    DownOutlined, EditOutlined 
} from '@ant-design/icons';
import GeneralDiary from './components/GeneralDiary';
import MoodyDiary from './components/MoodyDiary';
import '../../../common/global.css';

const DiaryPanel = () => {
    // 預設切換為 'general' (原本代碼中 activeTab 寫 alcoholic 應該是筆誤)
    const [activeTab, setActiveTab] = useState('general');

    // 1. 下拉選單項目 (管理功能)
    const managementItems = [
        {
            key: 'diary-config',
            label: '日記分類設定',
            icon: <SettingOutlined />,
            onClick: () => setActiveTab('diary-config'),
        }
    ];

    // 2. 內容組件對照表
    const tabComponents = {
        'general': <GeneralDiary />,
        'moody-diary': <MoodyDiary />,
        'diary-config': <Card>這裡可以放置日記分類或權限設定內容...</Card>
    };

    // 3. Tabs 主要標籤項目
    const navItems = [
        {
            key: 'general',
            label: (
                <span>
                    <BookOutlined /> 一般日記
                </span>
            ),
        },
        {
            key: 'moody-diary',
            label: (
                <span>
                    <SmileOutlined /> 情緒日記
                </span>
            ),
        }
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#5ec2c2', // 保持品牌一致色
                    borderRadius: 8,
                },
            }}
        >
            <div className="container" style={{ padding: '20px' }}>
                {/* 導覽列容器 - 完全一致的 TopNav */}
                <div className="diary-nav-wrapper" style={{ 
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
                        tabBarStyle={{ marginBottom: 0, height: '64px' }}
                        tabBarExtraContent={
                            <Dropdown menu={{ items: managementItems }} placement="bottomRight">
                                <span 
                                    className={`mgmt-dropdown-trigger ${activeTab === 'diary-config' ? 'active' : ''}`}
                                    style={{ 
                                        color: activeTab === 'diary-config' ? '#5ec2c2' : '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '12px 0',
                                        fontWeight: activeTab === 'diary-config' ? '600' : 'normal'
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

                {/* 主要內容顯示區 - 使用 Card 加強質感 */}
                <div className="diary-content-area" style={{ marginTop: '20px' }}>
                    {tabComponents[activeTab]}
                </div>
            </div>
        </ConfigProvider>
    );
};

export default DiaryPanel;