import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Button, Typography, Space, Empty, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, RocketOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const TemplateGallery = ({ onEdit, onCreate }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/admin/templates', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await res.json();
            setTemplates(data);
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Title level={2}>思考模板庫</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} size="large">
                    建立新模板
                </Button>
            </div>

            <Spin spinning={loading}>
                <List
                    grid={{ gutter: 12, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                    dataSource={templates}
                    locale={{ emptyText: <Empty description="尚無模板，點擊上方按鈕建立" /> }}
                    renderItem={(item) => (
                        <List.Item>
                            <Card
                                style={{ height: '25vh'}}
                                hoverable
                                actions={[
                                    <EditOutlined key="edit" onClick={() => onEdit(item)} />,
                                    <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                                ]}
                            >
                                <Card.Meta
                                    avatar={<RocketOutlined style={{ fontSize: '24px', color: '#5ec2c2' }} />}
                                    title={item.name}
                                    description={
                                        <Space direction="vertical" size={0}>
                                            <Tag color="cyan">{item.category || '未分類'}</Tag>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                包含 {item.steps?.length || 0} 個思考步驟
                                            </Text>
                                        </Space>
                                    }
                                />
                            </Card>
                        </List.Item>
                    )}
                />
            </Spin>
        </div>
    );
};

export default TemplateGallery;