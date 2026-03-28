import React from 'react';
import { Row, Col, Card, Typography, Tag, Progress, Space, Statistic } from 'antd';
import { CalendarOutlined, SafetyCertificateOutlined, AlertOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MotorMetrics = ({ records }) => {
    const getMetrics = () => {
        if (!records || records.length === 0) {
            return { daysSince: 0, remaining: 0, nextDate: 'N/A', isOverdue: false, percent: 0 };
        }
        
        const lastDate = dayjs(records[0].maintenance_date);
        const today = dayjs().startOf('day');
        const cycleDays = 90; // 定義保養週期為 90 天
        const nextDate = lastDate.add(cycleDays, 'day');
        
        const daysSince = today.diff(lastDate, 'day');
        const remaining = nextDate.diff(today, 'day');
        // 計算進度百分比 (0-100)
        const percent = Math.min(Math.max(Math.round((daysSince / cycleDays) * 100), 0), 100);
        
        return {
            daysSince,
            remaining,
            nextDate: nextDate.format('YYYY-MM-DD'),
            isOverdue: today.isAfter(nextDate),
            percent
        };
    };

    const metrics = getMetrics();

    // 根據狀態決定顏色
    const getStatusColor = () => {
        if (metrics.isOverdue) return '#ff4d4f'; // 錯誤紅
        if (metrics.percent > 80) return '#faad14'; // 警告橘
        return '#52c41a'; // 安全綠
    };

    return (
        <Card bordered={false} className="metrics-glass-card" style={{ background: 'transparent', padding: 0 }}>
            <Row gutter={[24, 24]} align="top" style={{ height: '100%', width: '100%' }}>
                {/* 左側：車輛視覺圖片 */}
                <Col xs={24} md={6}>
                    <div className="motor-visual-container" style={{ textAlign: 'center', position: 'relative' }}>
                        <img 
                            src="/motor.png" 
                            alt="my motor" 
                            style={{ 
                                width: '100%', 
                                maxWidth: '160px', 
                                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))',
                                transform: 'scale(1.1)' 
                            }} 
                        />
                    </div>
                </Col>

                {/* 中間：核心進度儀表 */}
                <Col xs={24} md={8} style={{ textAlign: 'center', height: '100%', width: '100%' }}>
                    <Progress
                        type="dashboard"
                        percent={metrics.percent}
                        strokeColor={getStatusColor()}
                        gapDegree={30}
                        width={140}
                        format={() => (
                            <div style={{ marginTop: '-10px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor() }}>
                                    {metrics.daysSince}
                                </div>
                                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>天已過</div>
                            </div>
                        )}
                    />
                    <div style={{ marginTop: 8 }}>
                        {metrics.isOverdue ? (
                            <Tag color="error" icon={<AlertOutlined />}>已逾期 {Math.abs(metrics.remaining)} 天</Tag>
                        ) : (
                            <Tag color={metrics.percent > 80 ? "warning" : "success"} icon={<SafetyCertificateOutlined />}>
                                {metrics.percent > 80 ? "建議近期保養" : "車況良好"}
                            </Tag>
                        )}
                    </div>
                </Col>

                {/* 右側：次要數據 */}
                <Col xs={24} md={10} style={{ height: '100%', width: '100%' }}>
                    <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
                        <Card size="medium" className="inner-metric-card" style={{ height:'100%' }}>
                            <Statistic
                                title={<Text type="secondary"><ClockCircleOutlined /> 下次預計</Text>}
                                value={metrics.remaining > 0 ? metrics.remaining : 0}
                                suffix={<span style={{ fontSize: 14 }}>天後</span>}
                                style={{ color: metrics.remaining <= 10 ? '#cf1322' : '#3f8600' }}
                            />
                        </Card>
                       <Card size="medium" className="inner-metric-card" style={{ height:'100%' }}>
                            <Statistic
                                title={<Text type="secondary"><CalendarOutlined /> 目標日期</Text>}
                                value={metrics.nextDate}
                                style={{ fontSize: '16px', fontWeight: '500' }}
                            />
                        </Card>
                    </Space>
                </Col>
            </Row>
            
        </Card>
    );
};

export default MotorMetrics;