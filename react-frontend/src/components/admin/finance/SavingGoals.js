import React, { useState } from 'react';
import { Row, Col, Card, Progress, Typography, Avatar, Space, Button, Tooltip } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import DepositModal from './components/DepositModal';
import SavingHistoryModal from './components/SavingHistoryModal';

const { Text, Title } = Typography;

// 💡 記得要把 onRefresh 從 Props 拿出來
const SavingGoals = ({ goals, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const handleOpenDeposit = (goal) => {
        setSelectedGoal(goal);
        setIsModalOpen(true);
    };

    if (!Array.isArray(goals) || goals.length === 0) {
        return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>尚無儲蓄目標</div>;
    }

    return (
        <Card style={{ height: '100%' }} variant="outlined">
            <Title level={4} style={{ marginBottom: 24 }}>🎯 進行中的目標</Title>
            <Row gutter={[16, 16]}>
                {goals.map((goal) => {
                    const current = goal.current_amount ?? 0;
                    const target = goal.target_amount ?? 1;
                    const monthlyPush = goal.monthly_push ?? 0;
                    const percentage = Math.round((current / target) * 100) || 0;

                    return (
                        <Col xs={24} sm={12} key={goal.id}>
                            <Card
                                style={{ height: '100%', borderRadius: '12px' }}
                                hoverable
                                // 💡 加入操作按鈕
                                actions={[
                                    <Button
                                        type="text"
                                        icon={<PlusCircleOutlined style={{ color: '#5ec2c2' }} />}
                                        onClick={() => handleOpenDeposit(goal)}
                                    >
                                        立即存款
                                    </Button>,
                                    <Button
                                        type="text"
                                        onClick={() => {
                                            setSelectedGoal(goal);
                                            setIsHistoryOpen(true);
                                        }}
                                    >
                                        歷史紀錄
                                    </Button>

                                ]}
                            >
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Avatar size={48} style={{ backgroundColor: '#f0f7ff', fontSize: '24px' }}>
                                            {goal.icon || '💰'}
                                        </Avatar>
                                        <div style={{ textAlign: 'right' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>完成率</Text>
                                            <div style={{ color: '#5ec2c2', fontWeight: 'bold', fontSize: '18px' }}>{percentage}%</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: 4 }}>{goal.title}</div>
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                                進度: ${current.toLocaleString()} / ${target.toLocaleString()}
                                            </Text>
                                            <Text style={{ fontSize: '13px', color: '#5ec2c2', fontWeight: 500 }}>
                                                本月計畫撥款: ${monthlyPush.toLocaleString()}
                                            </Text>
                                        </Space>
                                    </div>

                                    <Progress
                                        percent={percentage}
                                        status={percentage >= 100 ? "success" : "active"}
                                        strokeColor="#5ec2c2"
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">${current.toLocaleString()}</Text>
                                        <Text type="secondary">目標: ${target.toLocaleString()}</Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* 存款對話框 */}
            <DepositModal
                visible={isModalOpen}
                goal={selectedGoal}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    if (onRefresh) onRefresh(); // 💡 執行重新整理
                }}
            />
            <SavingHistoryModal
                visible={isHistoryOpen}
                goal={selectedGoal}
                onCancel={() => setIsHistoryOpen(false)}
            />
        </Card>
    );
};

export default SavingGoals;