import React from 'react';
import { Row, Col, Card, Statistic, Progress, Tag, Skeleton } from 'antd';
import { 
    CheckCircleOutlined, 
    SyncOutlined, 
    BugOutlined, 
    CloseCircleOutlined,
    LineChartOutlined 
} from '@ant-design/icons';

// 💡 這裡直接接收 stats (API 回傳的 data 部分)
const TaskStatistics = ({ stats, loading }) => {
    
    // 如果還在讀取，顯示 Antd 的骨架屏 (Skeleton)，看起來更專業
    if (loading || !stats) {
        return (
            <div style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                    <Col span={8}><Card loading={true} active /></Col>
                    <Col span={4}><Card loading={true} active /></Col>
                    <Col span={4}><Card loading={true} active /></Col>
                    <Col span={4}><Card loading={true} active /></Col>
                    <Col span={4}><Card loading={true} active /></Col>
                </Row>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 24 }}>
            <Row gutter={8}>
                {/* 完成率主卡片 - 使用 API 的 completion_rate */}
                <Col xs={24} sm={24} md={8}>
                    <Card hoverable size="small" style={{ height:'100%'}}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px' }}>
                            <Statistic
                                title="總體完成進度"
                                value={stats.completion_rate}
                                suffix="%"
                                prefix={<LineChartOutlined style={{ color: '#722ed1' }} />}
                            />
                            <Progress 
                                type="circle" 
                                percent={stats.completion_rate} 
                                width={60} 
                                strokeColor="#722ed1" 
                            />
                        </div>
                    </Card>
                </Col>

                {/* 進行中 */}
                <Col xs={12} sm={12} md={4}>
                    <Card hoverable size="small" style={{ height: '100%'}}>
                        <Statistic
                            title="進行中"
                            value={stats.pending}
                            style={{ color: '#1890ff' }}
                            prefix={<SyncOutlined spin={stats.pending > 0} />}
                        />
                    </Card>
                </Col>

                {/* 已完成 */}
                <Col xs={12} sm={12} md={4}>
                    <Card hoverable size="small" style={{ height:'100%'}}>
                        <Statistic
                            title="已完成"
                            value={stats.done}
                            style={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>

                {/* Bug 統計 */}
                <Col xs={12} sm={12} md={4}>
                    <Card hoverable size="small" style={{ height:'100%'}}>
                        <Statistic
                            title="待處理 Bug"
                            value={stats.bugs}
                            style={{ color: '#ff4d4f' }}
                            prefix={<BugOutlined />}
                        />
                        {stats.bugs > 0 && <Tag color="error" style={{ marginTop: 4 }}>ISSUE</Tag>}
                    </Card>
                </Col>

                {/* 已取消 */}
                <Col xs={12} sm={12} md={4}>
                    <Card hoverable size="small" style={{ height:'100%'}} >
                        <Statistic
                            title="已取消"
                            value={stats.canceled}
                            style={{ color: '#8c8c8c' }}
                            prefix={<CloseCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default TaskStatistics;