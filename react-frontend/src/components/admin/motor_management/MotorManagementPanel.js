import React, { useState, useEffect, useCallback } from 'react';
import { 
    Form, Input, Button, message, Popconfirm, Space, 
    Modal, Table, Typography, Card, Row, Col, Tag, DatePicker, InputNumber 
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';  
import './MotorManagementPanel.css';
import '../../../common/global.css';

const { Title, Text } = Typography;
const API_URL = "http://localhost:5001/api/motor";

const MotorManagementPanel = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            // 排序：最新日期在前
            const sortedData = data.sort((a, b) => dayjs(b.maintenance_date).unix() - dayjs(a.maintenance_date).unix());
            setRecords(sortedData);
        } catch (error) {
            message.error("獲取紀錄失敗");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    // --- 邏輯計算區 ---
    const getMetrics = () => {
        if (records.length === 0) return { daysSince: 0, remaining: 0, nextDate: 'N/A', isOverdue: false };
        
        const lastDate = dayjs(records[0].maintenance_date);
        const today = dayjs().startOf('day');
        const nextDate = lastDate.add(3, 'month');
        
        return {
            daysSince: today.diff(lastDate, 'day'),
            remaining: nextDate.diff(today, 'day'),
            nextDate: nextDate.format('YYYY-MM-DD'),
            isOverdue: today.isAfter(nextDate)
        };
    };

    const metrics = getMetrics();

    // --- 操作處理區 ---
    const handleOpenModal = (record = null) => {
        setEditingRecord(record);
        if (record) {
            form.setFieldsValue({
                ...record,
                maintenance_date: dayjs(record.maintenance_date)
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ maintenance_date: dayjs() });
        }
        setIsModalOpen(true);
    };

    const handleFinish = async (values) => {
        const payload = {
            ...values,
            maintenance_date: values.maintenance_date.format('YYYY-MM-DD'),
            item_name: '換機油' 
        };

        const method = editingRecord ? 'PUT' : 'POST';
        const url = editingRecord ? `${API_URL}/record/${editingRecord.id}` : `${API_URL}/record`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                message.success(editingRecord ? "修改成功" : "新增紀錄成功");
                setIsModalOpen(false);
                fetchRecords();
            }
        } catch (error) {
            message.error("提交失敗");
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/record/${id}`, { method: 'DELETE' });
            if (res.ok) {
                message.success("紀錄已刪除");
                fetchRecords();
            }
        } catch (error) {
            message.error("刪除失敗");
        }
    };

    const columns = [
        {
            title: '日期',
            dataIndex: 'maintenance_date',
            key: 'maintenance_date',
            sorter: (a, b) => dayjs(a.maintenance_date).unix() - dayjs(b.maintenance_date).unix(),
        },
        { title: '項目', dataIndex: 'item_name', key: 'item_name' },
        { 
            title: '里程數', 
            dataIndex: 'mileage', 
            key: 'mileage', 
            render: (val) => `${val?.toLocaleString()} KM` 
        },
        { 
            title: '價格', 
            dataIndex: 'price', 
            key: 'price', 
            render: (val) => <Text style={{ color: '#cf1322', fontWeight: 'bold' }}>${val?.toLocaleString()}</Text> 
        },
        { title: '備註', dataIndex: 'note', key: 'note', ellipsis: true },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
                    <Popconfirm title="確定刪除此紀錄？" onConfirm={() => handleDelete(record.id)} okText="確定" cancelText="取消">
                        <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="motor-container" style={{ padding: '24px' }}>
            <Card bordered={false} className="main-glass-card">
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Col>
                        <Title level={2} style={{ margin: 0 }}>
                            <HistoryOutlined style={{ marginRight: 12, color: '#ec4899' }} />
                            機車保養管理
                        </Title>
                    </Col>
                    <Col>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => handleOpenModal()}
                            style={{ background: '#ec4899', borderColor: '#ec4899' }}
                            size="large"
                        >
                            新增紀錄
                        </Button>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={8}>
                        <div className="motor-image-wrapper">
                            <img src="/motor.png" alt="my motor" style={{ width: '100%', maxWidth: '200px' }} />
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card className={`status-mini-card ${metrics.daysSince >= 90 ? 'danger' : 'safe'}`}>
                            <Text type="secondary">上次保養至今</Text>
                            <Title level={3} style={{ margin: '8px 0' }}>{metrics.daysSince} 天</Title>
                            {metrics.daysSince >= 90 ? <Tag color="error">⚠️ 建議保養</Tag> : <Tag color="success">狀態良好</Tag>}
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card className={`status-mini-card ${metrics.isOverdue ? 'danger' : 'safe'}`}>
                            <Text type="secondary">距離下次保養 (預計)</Text>
                            <Title level={3} style={{ margin: '8px 0' }}>{metrics.remaining} 天</Title>
                            <Text size="small" type={metrics.isOverdue ? 'danger' : 'secondary'}>
                                目標日期：{metrics.nextDate}
                            </Text>
                        </Card>
                    </Col>
                </Row>

                <Table 
                    columns={columns} 
                    dataSource={records} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 6 }}
                    className="custom-antd-table"
                />
            </Card>

            <Modal
                title={editingRecord ? "編輯保養紀錄" : "新增保養紀錄"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Form.Item name="maintenance_date" label="保養日期" rules={[{ required: true, message: '請選擇日期' }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="mileage" label="當前里程 (KM)" rules={[{ required: true, message: '請輸入里程' }]}>
                        <InputNumber style={{ width: '100%' }} placeholder="例如: 12500" />
                    </Form.Item>
                    <Form.Item name="price" label="價格" rules={[{ required: true, message: '請輸入價格' }]}>
                        <InputNumber style={{ width: '100%' }} prefix="$" placeholder="例如: 150" />
                    </Form.Item>
                    <Form.Item name="note" label="備註">
                        <Input.TextArea placeholder="機油型號或其他更換項目" rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default MotorManagementPanel;