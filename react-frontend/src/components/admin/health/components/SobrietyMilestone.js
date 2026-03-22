import React, { useState, useEffect } from 'react'; // 1. 引入 Hooks
import { Card, Steps, Typography, Tag, Space, Spin } from 'antd';
import { 
    FireOutlined, ThunderboltOutlined, HeartOutlined, 
    TrophyOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios'; // 2. 引入 axios

const { Text, Title } = Typography;

const milestones = [
    { title: '1天', description: '肝臟修復', icon: <ThunderboltOutlined />, days: 1 },
    { title: '3天', description: '神經修復', icon: <FireOutlined />, days: 3 },
    { title: '7天', description: '睡眠重啟', icon: <HeartOutlined />, days: 7 },
    { title: '14天', description: '清晰大腦', icon: <TrophyOutlined />, days: 14 },
];

const SobrietyMilestones = () => { // 不再依賴父組件傳入，自己去抓
    const [daysCount, setDaysCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // 3. 組件掛載時呼叫 API
    useEffect(() => {
        const fetchSobrietyData = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await axios.get('http://localhost:5001/api/admin/health/sobriety-status', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // 確保 API 回傳的是計算正確的天數（昨天喝過，今天應該回傳 0）
                setDaysCount(res.data.days_count); 
            } catch (err) {
                console.error("抓取清醒天數失敗", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSobrietyData();
    }, []);

    if (loading) return <Card loading={true} />;

    const getEncouragement = () => {
        if (daysCount >= 14) return "你已經重生了！保持這份清醒。";
        if (daysCount >= 7) return "一週達標！身體正在感謝你的堅持。";
        if (daysCount >= 3) return "最難熬的三天已過，你比酒精更強大！";
        if (daysCount >= 1) return "好的開始是成功的一半。";
        return "準備好開始清醒的一天了嗎？";
    };

    const activeStepIndex = milestones.findIndex(m => daysCount < m.days);
    const currentStep = activeStepIndex === -1 ? 4 : activeStepIndex;

    return (
        <Card 
            className="milestone-card"
            style={{ 
                borderRadius: '16px', marginBottom: '20px', background: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0',
                position: 'relative', overflow: 'hidden'
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: '12px', letterSpacing: '1px' }}>SOBRIETY JOURNEY</Text>
                        <Title level={3} style={{ margin: 0 }}>
                            已持續清醒 <Text style={{ color: '#5ec2c2' }}>{daysCount}</Text> 天
                        </Title>
                    </Space>
                    <div style={{ textAlign: 'right' }}>
                        <Tag color="#5ec2c2" style={{ border: 'none', borderRadius: '20px', padding: '4px 12px', fontWeight: 500 }}>
                            {getEncouragement()}
                        </Tag>
                    </div>
                </div>

                <Steps
                    size="small"
                    current={currentStep}
                    titlePlacement="vertical"
                    items={milestones.map((m, index) => {
                        const isUnlocked = daysCount >= m.days;
                        const isNextGoal = index === activeStepIndex;
                        return {
                            title: <Text strong style={{ color: isUnlocked ? '#5ec2c2' : (isNextGoal ? '#8c8c8c' : '#d9d9d9') }}>{m.title}</Text>,
                            description: <Text style={{ fontSize: '11px', color: isUnlocked ? '#8c8c8c' : '#bfbfbf' }}>{m.description}</Text>,
                            icon: (
                                <div style={{ 
                                    fontSize: isNextGoal ? '24px' : '20px', 
                                    color: isUnlocked ? '#5ec2c2' : (isNextGoal ? '#faad14' : '#d9d9d9'),
                                    filter: isUnlocked ? 'drop-shadow(0 0 5px rgba(94, 194, 194, 0.4))' : 'none',
                                    transition: 'all 0.5s ease',
                                    animation: isNextGoal ? 'pulse 2s infinite' : 'none'
                                }}>
                                    {isUnlocked ? m.icon : (isNextGoal ? <ClockCircleOutlined /> : m.icon)}
                                </div>
                            ),
                            status: isUnlocked ? 'finish' : (isNextGoal ? 'process' : 'wait')
                        };
                    })}
                />
            </Space>

            <div style={{ 
                height: '4px', width: `${Math.min((daysCount / 14) * 100, 100)}%`, 
                background: 'linear-gradient(90deg, #5ec2c2, #b2f2bb)', 
                position: 'absolute', bottom: 0, left: 0,
                transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
            `}</style>
        </Card>
    );
};

export default SobrietyMilestones;