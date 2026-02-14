import React from 'react';
import { Row, Col, Card, Progress, Typography, Avatar, Space } from 'antd';

const { Text, Title } = Typography;

const SavingGoals = ({ goals }) => {
    return (
        <Card style={{ height: '100%'}}>
            <Title level={4}>進行中的目標</Title>
            <Row gutter={[16, 16]}>

                {goals.map((goal) => {
                    const percentage = Math.round((goal.current / goal.target) * 100) || 0;
                    return (
                        // 在大螢幕上一排顯示兩個 (span=12)，在小螢幕顯示一個 (span=24)
                        <Col xs={24} sm={12} key={goal.id}>
                            <Card style={{ height: '100%' }}>
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Avatar size={48} style={{ backgroundColor: '#f0f7ff', fontSize: '24px' }}>
                                            {goal.icon}
                                        </Avatar>
                                        <div style={{ textAlign: 'right' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>完成率</Text>
                                            <div style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '18px' }}>{percentage}%</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: 4 }}>{goal.title}</div>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                            ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                                        </Text>
                                    </div>

                                    <Progress
                                        percent={percentage}
                                        strokeWidth={8}
                                        showInfo={false}
                                        strokeColor={percentage >= 100 ? '#52c41a' : '#1890ff'}
                                    />
                                </Space>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </Card>
    );
};

export default SavingGoals;