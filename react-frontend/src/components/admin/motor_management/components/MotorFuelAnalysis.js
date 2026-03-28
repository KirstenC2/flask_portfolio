import React, { useState, useEffect } from 'react';
// ✅ UI 組件：必須從 'antd' 引入
import {
    Card, Row, Col, Statistic, Timeline, Tag, Space,
    Typography, Spin, Empty, Divider
} from 'antd';

// ✅ 圖標：必須從 '@ant-design/icons' 引入
// 注意：圖標首字母通常大寫，例如 ArrowRightOutlined
import {
    FireOutlined, CalendarOutlined, ArrowRightOutlined
} from '@ant-design/icons';

import dayjs from 'dayjs';

const { Text } = Typography;

const MotorFuelAnalysis = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchFuelData = async () => {
        setLoading(true);
        try {
            const year = dayjs().year();
            const month = dayjs().month() + 1;
            const res = await fetch(`http://localhost:5001/api/admin/expenses/analysis/fuel?year=${year}&month=${month}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error("獲取加油分析失敗", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFuelData();
    }, []);

    // 使用 Spin 前必須確保它已從 'antd' 引入
    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin tip="分析加油頻率中..." />
        </div>
    );

    // 使用 Empty 前必須確保它已從 'antd' 引入
    if (!data || data.count === 0) return (
        <Card style={{ marginTop: 16, borderRadius: '12px' }}>
            <Empty description="本月尚無加油紀錄 (Category 13)" />
        </Card>
    );

    return (
        // 在 MotorFuelAnalysis.jsx 的 return 中修改
        <Card
            title={<Space><FireOutlined style={{ color: '#ff4d4f' }} />汽油支出與頻率</Space>}
            style={{ marginTop: 16, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
            {/* 第一行：次數與間隔 */}
            <Row gutter={16}>
                <Col span={12}>
                    <Statistic title="本月加油" value={data.count} suffix="次" />
                </Col>
                <Col span={12}>
                    <Statistic title="平均間隔" value={data.average_days} precision={1} suffix="天" />
                </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            {/* 第二行：金額擴展 */}
            <Row gutter={16}>
                <Col span={12}>
                    <Statistic
                        title="油錢總計"
                        value={data.total_amount}
                        prefix="$"
                        valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                    />
                </Col>
                <Col span={12}>
                    <Statistic title="平均/次" value={data.avg_per_fill} prefix="$" />
                </Col>
            </Row>

            <div style={{ marginTop: 24 }}>
                <Text type="secondary" size="small">加油紀錄詳情：</Text>
                <Timeline
                    style={{ marginTop: 12 }}
                    items={data.intervals.map((item, index) => ({
                        label: `${item.days}天`,
                        children: (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>{item.to}</Text>
                                <Text strong style={{ color: '#555' }}>${item.amount}</Text>
                            </div>
                        ),
                        color: item.days > data.average_days ? 'orange' : 'green'
                    }))}
                />
            </div>
        </Card>
    );
};

export default MotorFuelAnalysis;