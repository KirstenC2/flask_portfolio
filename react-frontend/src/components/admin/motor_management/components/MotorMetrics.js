import React from 'react';
import { Row, Col, Card, Typography, Tag } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MotorMetrics = ({ records }) => {
    const getMetrics = () => {
        if (records.length === 0) return { daysSince: 0, remaining: 0, nextDate: 'N/A', isOverdue: false };
        
        const lastDate = dayjs(records[0].maintenance_date);
        const today = dayjs().startOf('day');
        const nextDate = lastDate.add(3, 'month');
        
        return {
            daysSince: today.diff(lastDate, 'day'),
            remaining: nextDate.diff(today, 'day'),
            nextDate: nextDate.format('YYYY-MM-DD'),
            isOverdue: today.isAfter(nextDate)
        };
    };

    const metrics = getMetrics();

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
                <div className="motor-image-wrapper">
                    <img src="/motor.png" alt="my motor" style={{ width: '100%', maxWidth: '200px' }} />
                </div>
            </Col>
            <Col xs={24} md={8}>
                <Card className={`status-mini-card ${metrics.daysSince >= 90 ? 'danger' : 'safe'}`}>
                    <Text type="secondary">上次保養至今</Text>
                    <Title level={3} style={{ margin: '8px 0' }}>{metrics.daysSince} 天</Title>
                    {metrics.daysSince >= 90 ? <Tag color="error">⚠️ 建議保養</Tag> : <Tag color="success">狀態良好</Tag>}
                </Card>
            </Col>
            <Col xs={24} md={8}>
                <Card className={`status-mini-card ${metrics.isOverdue ? 'danger' : 'safe'}`}>
                    <Text type="secondary">距離下次保養 (預計)</Text>
                    <Title level={3} style={{ margin: '8px 0' }}>{metrics.remaining} 天</Title>
                    <Text size="small" type={metrics.isOverdue ? 'danger' : 'secondary'}>
                        目標日期：{metrics.nextDate}
                    </Text>
                </Card>
            </Col>
        </Row>
    );
};

export default MotorMetrics;