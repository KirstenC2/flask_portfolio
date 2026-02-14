import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Typography, Tag, Button, Empty, Space, message, Popconfirm, Spin } from 'antd';
import { FileProtectOutlined, EditOutlined, CalendarOutlined, DollarOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const DOC_API_URL = "http://localhost:5001/api/admin/motor/taxes";

const MotorTaxesView = ({ onEdit, onAdd, refreshTrigger }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);

    // 從 API 獲取資料
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(DOC_API_URL);
            if (!res.ok) throw new Error("網路請求失敗");
            const data = await res.json();
            setDocuments(data);
        } catch (error) {
            message.error("獲取紀錄失敗: " + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // 當組件載入或外部要求刷新（如新增/修改成功後）時執行
    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments, refreshTrigger]);

    // 處理刪除邏輯
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${DOC_API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                message.success("文件已刪除");
                fetchDocuments(); // 重新整理列表
            }
        } catch (error) {
            message.error("刪除失敗");
        }
    };

    const TaxSummary = ({ documents }) => {
        const currentYear = dayjs().year();
        const totalTaxThisYear = documents
            .filter(d => dayjs(d.expired_date).year() === currentYear)
            .reduce((sum, d) => sum + (d.amount || 0), 0);

        return (
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                        <Row align="middle">
                            <Col span={12}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{currentYear} 年度 稅務與規費總計</Text>
                                <Title level={2} style={{ color: '#fff', margin: 0 }}>${totalTaxThisYear.toLocaleString()}</Title>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <FileProtectOutlined style={{ fontSize: 40, opacity: 0.3 }} />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        );
    };

    if (loading && documents.length === 0) return <div style={{ textAlign: 'center', padding: '40px' }}><Spin /></div>;

    return (
        <div className="document-view">
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col><Title level={4}>車籍與保險文件</Title></Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<FileProtectOutlined />}
                        onClick={onAdd}
                    >
                        新增文件
                    </Button>
                </Col>
            </Row>

            {documents.length === 0 ? (
                <Empty description="尚無文件紀錄" style={{ padding: '40px 0' }} />
            ) : (
                <Row gutter={[16, 16]}>
                    {documents.map((doc) => {
                        const daysLeft = doc.expired_date ? dayjs(doc.expired_date).diff(dayjs(), 'day') : null;
                        const isExpired = daysLeft !== null && daysLeft < 0;

                        return (
                            <Col xs={24} sm={12} lg={8} key={doc.id}>
                                <Card
                                    hoverable
                                    size="small"
                                    style={{
                                        height: '100%',
                                        background: '#fff',
                                        borderRadius: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    }}
                                    className={`doc-card ${isExpired ? 'doc-card-expired' : ''}`}
                                    actions={[
                                        <EditOutlined key="edit" onClick={() => onEdit(doc)} />,
                                        <Popconfirm
                                            title="確定刪除此文件？"
                                            onConfirm={() => handleDelete(doc.id)}
                                            okText="確定"
                                            cancelText="取消"
                                        >
                                            <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                                        </Popconfirm>
                                    ]}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: '16px' }}>{doc.title}</Text>
                                        {daysLeft !== null && (
                                            <Tag color={isExpired ? 'error' : daysLeft < 30 ? 'warning' : 'processing'}>
                                                {isExpired ? '已過期' : `剩 ${daysLeft} 天`}
                                            </Tag>
                                        )}
                                    </div>

                                    <Space direction="vertical" size={2}>
                                        <Text type="secondary" style={{ fontSize: '13px' }}>
                                            <CalendarOutlined style={{ marginRight: 8 }} />
                                            到期日: {doc.expired_date || '永久有效'}
                                        </Text>
                                        {doc.amount && (
                                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                                <DollarOutlined style={{ marginRight: 8 }} />
                                                費用: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>${doc.amount.toLocaleString()}</span>
                                            </Text>
                                        )}
                                    </Space>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </div>
    );
};

export default MotorTaxesView;