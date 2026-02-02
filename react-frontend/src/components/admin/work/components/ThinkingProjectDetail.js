import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Spin, message, Progress, Tag, Empty } from 'antd';
import { BulbOutlined, FileSearchOutlined } from '@ant-design/icons';
import { thinkingApi } from '../../../../services/thinkingApi';

const { Title, Paragraph, Text } = Typography;

const ThinkingProjectDetail = ({ analysisId }) => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!analysisId) return;
            setLoading(true);
            try {
                const data = await thinkingApi.getThinkingProjectDetail(analysisId);
                setProject(data);
            } catch (err) {
                message.error("讀取分析內容失敗");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [analysisId]);

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
    if (!project) return <Empty description="暫無分析資料" />;

    // 計算進度（僅用於展示）
    const completedSteps = project.steps.filter(s => s.content?.trim()).length;
    const progressPercent = Math.round((completedSteps / project.steps.length) * 100);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
            {/* 標頭區域 */}
            <div style={{ marginBottom: '32px' }}>
                <Space align="baseline" style={{ marginBottom: 16 }}>
                    <Title level={2} style={{ margin: 0 }}>{project.title}</Title>
                    <Tag color="blue" icon={<FileSearchOutlined />}>查看模式</Tag>
                </Space>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text type="secondary">分析進度：</Text>
                    <Progress percent={progressPercent} strokeColor="#5ec2c2" style={{ flex: 1 }} />
                </div>
            </div>

            {/* 內容卡片 */}
            {project.steps.map((step, index) => (
                <Card 
                    key={step.step_id}
                    title={
                        <Space>
                            <span style={{ background: '#5ec2c2', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}>
                                {index + 1}
                            </span>
                            {step.title}
                        </Space>
                    }
                    style={{ marginBottom: '24px', borderRadius: '12px', border: '1px solid #f0f0f0' }}
                >
                    {/* 當時的引導文字 */}
                    <div style={{ marginBottom: '16px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                        <Text type="secondary" size="small"><BulbOutlined /> 引導思考：</Text>
                        <Paragraph style={{ marginTop: '4px', color: '#8c8c8c', marginBottom: 0 }}>
                            {step.prompt}
                        </Paragraph>
                    </div>
                    
                    {/* 使用者填寫的內容 - 改為純文字展示 */}
                    <div style={{ 
                        padding: '16px', 
                        background: '#fff', 
                        border: '1px solid #eee', 
                        borderRadius: '8px',
                        minHeight: '80px',
                        whiteSpace: 'pre-wrap' // 保留換行
                    }}>
                        {step.content ? (
                            <Text>{step.content}</Text>
                        ) : (
                            <Text type="secondary" italic>（當時未填寫內容）</Text>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default ThinkingProjectDetail;