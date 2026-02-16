import React, { useState } from 'react';
import { List, Card, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, message, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RetweetOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { financeApi } from '../../../services/financeApi'; // 💡 確保路徑正確

const { Text } = Typography;

const RecurringExpenseSection = ({ recurringExpenses, categories, refreshAll }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // --- 彈窗處理 ---
    const showModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            form.setFieldsValue(item);
        } else {
            form.resetFields();
            form.setFieldsValue({ day_of_month: 1 });
        }
        setIsModalOpen(true);
    };

    // --- 功能 1：儲存模板 (新增或更新) ---
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            if (editingItem) {
                await financeApi.updateRecurringExpenses(editingItem.id, values);
                message.success('更新成功');
            } else {
                await financeApi.createRecurringExpense(values);
                message.success('模板建立成功');
            }
            setIsModalOpen(false);
            refreshAll();
        } catch (error) {
            message.error('操作失敗');
        } finally {
            setLoading(false);
        }
    };

    // --- 功能 2：刪除模板 ---
    const handleDelete = async (id) => {
        try {
            await financeApi.removeRecurringExpenses(id);
            message.success('模板已刪除');
            refreshAll();
        } catch (error) {
            message.error('刪除失敗');
        }
    };

    // --- 功能 3：核心「一鍵記帳」 ---
    const handleQuickAdd = async (item) => {
        try {
            const expenseData = {
                amount: item.amount,
                category_id: item.category_id,
                description: `[固定] ${item.name}`
            };
            
            // 💡 這裡直接發送到你現成的支出 API
            await financeApi.createExpense(expenseData);
            message.success(`${item.name} 入帳完成！`);
            refreshAll(); // 刷新讓支出報表立刻更新
        } catch (error) {
            message.error('記帳失敗');
        }
    };

    return (
        <div className="recurring-management" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>
                        <RetweetOutlined style={{ marginRight: 8 }} />
                        每月固定支出模板
                    </h3>
                    <Text type="secondary">在此管理訂閱或租金，每月可一鍵快速入帳</Text>
                </div>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => showModal()}>新增模板</Button>
            </div>

            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                dataSource={recurringExpenses}
                renderItem={(item) => (
                    <List.Item>
                        <Card
                            size="medium"
                            hoverable
                            style={{ height: '100%' }}
                            actions={[
                                <Popconfirm 
                                    key="run"
                                    title={`將 "${item.name}" 記帳至本月支出？`}
                                    onConfirm={() => handleQuickAdd(item)}
                                >
                                    <ThunderboltOutlined style={{ color: '#faad14' }} title="一鍵入帳" />
                                </Popconfirm>,
                                <EditOutlined key="edit" onClick={() => showModal(item)} />,
                                <Popconfirm 
                                    key="delete"
                                    title="確定刪除模板？" 
                                    onConfirm={() => handleDelete(item.id)}
                                >
                                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                                </Popconfirm>
                            ]}
                        >
                            <div style={{ marginBottom: 12 }}>
                                <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                                <br />
                                <Text type="danger" style={{ fontSize: 18, fontWeight: 700 }}>
                                    ${item.amount?.toLocaleString()}
                                </Text>
                            </div>
                            <Space direction="vertical" size={0}>
                                <Tag color="blue">每月 {item.day_of_month} 號</Tag>
                                <Text type="secondary" size="small">
                                    類別: {categories.find(c => c.id === item.category_id)?.name || '未分類'}
                                </Text>
                            </Space>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                title={editingItem ? "編輯固定支出" : "新增固定支出模板"}
                open={isModalOpen}
                onOk={handleSave}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={loading}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="支出項目名稱" rules={[{ required: true }]}>
                        <Input placeholder="例如：Netflix、房租" />
                    </Form.Item>
                    <Form.Item name="amount" label="金額" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} prefix="$" precision={0} />
                    </Form.Item>
                    <Form.Item name="category_id" label="對應類別" rules={[{ required: true }]}>
                        <Select placeholder="選擇分類">
                            {categories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="day_of_month" label="每月幾號提醒/扣款">
                        <InputNumber min={1} max={31} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RecurringExpenseSection;