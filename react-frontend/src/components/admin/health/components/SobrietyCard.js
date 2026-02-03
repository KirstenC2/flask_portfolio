import React, { useState, useEffect } from 'react';
import { Card, Statistic, Typography, Space, Tag, Progress } from 'antd';
import { SmileOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;

const SobrietyCard = () => {
    const [data, setData] = useState({ days_count: 0, encouragement: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await axios.get('http://localhost:5001/api/admin/health/sobriety-status', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (err) {
                console.error("無法取得清醒狀態");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    // 計算進度條百分比 (假設目標是 14 天)
    const progressPercent = Math.min((data.days_count / 14) * 100, 100);

    return (
        <Card 
            loading={loading}
            style={{ 
                borderRadius: '16px', 
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fcfc 100%)',
                boxShadow: '0 4px 12px rgba(94, 194, 194, 0.1)'
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Statistic 
                        title="已連續清醒"
                        value={data.days_count}
                        suffix="DAYS"
                        valueStyle={{ color: data.encouragement.color, fontSize: '32px', fontWeight: 'bold' }}
                        prefix={data.days_count >= 7 ? <TrophyOutlined /> : <FireOutlined />}
                    />
                    <Tag color={data.encouragement.color} style={{ borderRadius: '4px', padding: '4px 12px' }}>
                        {data.encouragement.title}
                    </Tag>
                </div>

                <div>
                    <Text type="secondary" italic style={{ fontSize: '14px' }}>
                        "{data.encouragement.text}"
                    </Text>
                    <Progress 
                        percent={progressPercent} 
                        strokeColor={data.encouragement.color} 
                        status={data.days_count >= 14 ? "success" : "active"}
                        showInfo={false}
                        style={{ marginTop: '15px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>目標: 14 天</Text>
                        {data.days_count >= 14 && <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>已達成！</Text>}
                    </div>
                </div>
            </Space>
        </Card>
    );
};

export default SobrietyCard;