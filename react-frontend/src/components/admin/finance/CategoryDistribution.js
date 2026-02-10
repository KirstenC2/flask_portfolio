import React from 'react';
import { Card, Empty, Typography, Space } from 'antd';
import { PieChart as PieIcon } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const { Text } = Typography;

// 定義一組好看的配色 (粉嫩色系搭配你的主題)
const COLORS = ['#ec4899', '#f472b6', '#fb923c', '#fbbf24', '#a855f7', '#6366f1', '#2dd4bf'];

const CategoryDistribution = ({ data = [], title, loading }) => {
    // 過濾掉總額為 0 的類別，並計算總計
    const chartData = data
        .filter(item => item.total > 0)
        .map(item => ({ name: item.category, value: item.total }));

    const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card
            size="small"
            loading={loading}
            title={
                <Space>
                    <PieIcon size={16} style={{ color: '#ec4899' }} />
                    <span style={{ fontSize: '14px' }}>{title}</span>
                </Space>
            }
            style={{ borderRadius: '12px', height: '100%', minHeight: '350px' }}
        >
            {chartData.length > 0 ? (
                <div style={{ width: '100%', height: '280px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60} // 環狀圖的內圈半徑
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value) => `$${value.toLocaleString()}`}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* 在環狀圖中間顯示總金額 */}
                    <div style={{
                        position: 'absolute',
                        top: '44%', // 稍微上移一點點以對準圓心 (考慮到 Legend)
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none'
                    }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>總計</Text>
                        <br />
                        <Text strong style={{ fontSize: '16px' }}>
                            ${Math.round(totalAmount).toLocaleString()}
                        </Text>
                    </div>
                </div>
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚無支出數據" />
            )}
        </Card>
    );
};

export default CategoryDistribution;