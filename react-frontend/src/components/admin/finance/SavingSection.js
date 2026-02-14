import React, { useState } from 'react';
import { Typography, Row, Col, ConfigProvider, Space, Divider, Card } from 'antd';
import SavingStats from './SavingStats';
import SavingGoals from './SavingGoals';
import AddGoalForm from './AddGoalForm';

const { Title, Paragraph } = Typography;

const SavingSection = () => {
    const [goals, setGoals] = useState([
        { id: 1, title: '日本旅遊基金', target: 50000, current: 25000, icon: '✈️' },
        { id: 2, title: '緊急備用金', target: 100000, current: 80000, icon: '🛡️' },
    ]);

    const totalSaved = goals.reduce((acc, goal) => acc + goal.current, 0);
    const totalTarget = goals.reduce((acc, goal) => acc + goal.target, 0);

    const addGoal = (newGoal) => {
        // 確保數據格式一致
        const goalData = {
            ...newGoal,
            id: Date.now(),
            current: newGoal.current || 0,
            icon: newGoal.icon || '💰'
        };
        setGoals([...goals, goalData]);
    };

    return (
        <Card bordered={false} style={{ height: '100%' }}>
            <ConfigProvider theme={{ token: { borderRadius: 12, colorPrimary: '#1890ff' } }}>


                {/* 頁面標題區 */}
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ marginBottom: 4 }}>儲蓄管理中心</Title>
                    <Paragraph type="secondary">掌控每一筆儲蓄進度，加速實現你的理財夢想</Paragraph>
                </div>

                <Space direction="vertical" size={32} style={{ display: 'flex' }}>

                    {/* 數據總覽區卡片 */}
                    <SavingStats totalSaved={totalSaved} totalTarget={totalTarget} />

                    <Divider />

                    <Row gutter={[32, 32]}>
                        {/* 左側：新增目標表單 (佔 1/3) */}
                        <Col xs={24} lg={8}>
                            <AddGoalForm onAdd={addGoal} />
                        </Col>

                        {/* 右側：目標清單 (佔 2/3) */}
                        <Col xs={24} lg={16}>
                            <SavingGoals goals={goals} />
                        </Col>
                    </Row>
                </Space>

            </ConfigProvider>
        </Card>
    );
};

export default SavingSection;