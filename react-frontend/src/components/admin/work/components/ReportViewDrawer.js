import React, { useState, useEffect } from 'react';
import { Drawer, Timeline, Typography, Tag, Divider, Spin, Empty, Button, Space, Card } from 'antd';
import { CalendarOutlined, BookOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;

const ReportViewDrawer = ({ visible, reportId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && reportId) {
            fetchDetail();
        }
    }, [visible, reportId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`http://localhost:5001/api/admin/thinking/projects/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error("讀取詳情失敗", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            title={<span><BookOutlined /> 匯報詳情回顧</span>}
            placement="right"
            width={600}
            onClose={onClose}
            open={visible}
            extra={<Button onClick={onClose}>關閉</Button>}
        >
            {loading ? <Spin tip="讀取中..." /> : data ? (
                <div>
                    <Title level={3}>{data.title}</Title>
                    <Space size={[0, 8]} wrap>
                        <Tag color="purple">{data.template_name}</Tag>
                        <Tag icon={<CalendarOutlined />} color="blue">{data.ref_tag}</Tag>
                    </Space>
                    
                    <Divider />

                    <Timeline mode="left">
                        {data.contents.map((item, index) => (
                            <Timeline.Item key={index} label={<Text strong>{item.title}</Text>}>
                                <Card size="small" style={{ background: '#fafafa', borderRadius: '8px' }}>
                                    <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                                        {item.content}
                                    </Paragraph>
                                </Card>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </div>
            ) : <Empty />}
        </Drawer>
    );
};

export default ReportViewDrawer;