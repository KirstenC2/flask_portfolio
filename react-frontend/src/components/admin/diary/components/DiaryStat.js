import React, { useState, useEffect, useCallback } from 'react';
import { Divider, Row, Col, Card, Statistic, Empty, Typography, Progress, Spin, message } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import dayjs from 'dayjs';
// 💡 假設你的 api 已經在 diaryApi.js 裡面寫好了
import { diaryApi } from '../../../../services/diaryApi';

const { Title, Text } = Typography;

const MOOD_CONFIG = {
    happy: { color: '#FFD700' },
    neutral: { color: '#A9A9A9' },
    tired: { color: '#8c8c8c' },
    helpless: { color: '#595959' },
    sad: { color: '#1E90FF' },
    angry: { color: '#ff4d4f' }
};

const DiaryStats = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            // 💡 這裡可以帶入目前的年份與月份
            const year = dayjs().year();
            const month = dayjs().month() + 1;
            const res = await diaryApi.getStats(year, month);
            setStats(res);
        } catch (err) {
            message.error("無法載入統計數據");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" tip="正在生成心情報告..." /></div>;
    if (!stats || stats.summary.total === 0) return <Empty description="本月尚無數據可生成報告" style={{ marginTop: 100 }} />;

    return (
        <div className="diary-stats-container" style={{ padding: '24px' }}>
            <Title level={3} style={{ marginBottom: 24 }}>本月心情分析報告</Title>
            
            <Row gutter={[16, 16]}>
                {/* 概覽卡片 */}
                <Col xs={24} md={8}>
                    <Card variant="outlined" hoverable style={{ height: '100%' }}>
                        <Statistic title="已記錄天數" value={stats.summary.total} suffix="天" />
                        <Divider style={{ margin: '12px 0' }} />
                        <Text type="secondary">正能量百分比</Text>
                        <Progress 
                            percent={stats.summary.posRate} 
                            status={stats.summary.posRate > 50 ? 'active' : 'normal'}
                            strokeColor={stats.summary.posRate > 50 ? '#52c41a' : '#faad14'}
                        />
                    </Card>
                </Col>

                {/* 情緒佔比圓餅圖 */}
                <Col xs={24} md={16}>
                    <Card title="情緒分佈" variant="outlined" style={{ height: '100%' }}>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pieData}
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.pieData.map((entry) => (
                                            <Cell key={entry.key} fill={MOOD_CONFIG[entry.key]?.color || '#ccc'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* 心情走勢折線圖 */}
                <Col span={24}>
                    <Card title="心情起伏走勢" variant="outlined" style={{ height: '100%' }}>
                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.lineData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                    <YAxis domain={[-2.5, 2.5]} hide />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(val, name, props) => [props.payload.emotion, '心情狀態']}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="score" 
                                        stroke="#1890ff" 
                                        strokeWidth={4} 
                                        dot={{ r: 6, fill: '#1890ff', strokeWidth: 2, stroke: '#fff' }} 
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DiaryStats;