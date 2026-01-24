import React, { useState } from 'react';
import { List, Card, Button, Modal, Form, Input, Space, Popconfirm, message, Typography, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import * as Icons from '@ant-design/icons'; // 匯入所有圖示
import axios from 'axios';

const { Text } = Typography;
const cardStyle = {
  height: '200px',      // 固定整體高度
  display: 'flex',
  width:'200px',
  flexDirection: 'column',
  justifyContent: 'space-between'
};
// 定義一些可選的常用圖示與顏色
const ICON_OPTIONS = [
    { name: 'TagOutlined', icon: <Icons.TagOutlined /> },
    { name: 'ShoppingCartOutlined', icon: <Icons.ShoppingCartOutlined /> },
    { name: 'RestOutlined', icon: <Icons.RestOutlined /> },
    { name: 'CarOutlined', icon: <Icons.CarOutlined /> },
    { name: 'HomeOutlined', icon: <Icons.HomeOutlined /> },
    { name: 'GiftOutlined', icon: <Icons.GiftOutlined /> },
    { name: 'MedicineBoxOutlined', icon: <Icons.MedicineBoxOutlined /> },
    { name: 'CoffeeOutlined', icon: <Icons.CoffeeOutlined /> },
    { name: 'DollarOutlined', icon: <Icons.DollarOutlined /> },
    { name: 'BankOutlined', icon: <Icons.BankOutlined /> },
];

const COLOR_OPTIONS = ['#1890ff', '#f5222d', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'];

const ExpenseCategorySection = ({ categories, refreshAll }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form] = Form.useForm();

    const API_BASE = 'http://localhost:5001/api/admin';
    const token = localStorage.getItem('adminToken');

    // 動態渲染圖示的組件
    const DynamicIcon = ({ iconName, color }) => {
        const IconComponent = Icons[iconName] || Icons.TagOutlined;
        return <IconComponent style={{ fontSize: '24px', color: color || '#1890ff' }} />;
    };

    const showModal = (category = null) => {
    setEditingCategory(category);
    
    if (category) {
        // 編輯模式：直接填入現有資料
        form.setFieldsValue(category);
    } else {
        // 新增模式：
        form.resetFields(); // 1. 先清空所有欄位與錯誤狀態（不帶參數）
        form.setFieldsValue({ // 2. 設定新增時的預設值
            icon: 'TagOutlined', 
            color: '#1890ff',
            name: '' // 確保名稱也是空的
        });
    }
    setIsModalOpen(true);
};
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            console.log(values);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (editingCategory) {
                await axios.put(`${API_BASE}/expense-categories/${editingCategory.id}`, values, config);
            } else {
                await axios.post(`${API_BASE}/expense-categories`, values, config);
            }
            message.success('操作成功');
            setIsModalOpen(false);
            refreshAll();
        } catch (error) { message.error('操作失敗'); }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_BASE}/expense-categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            message.success('類別已刪除');
            refreshAll();
        } catch (error) { message.error('刪除失敗'); }
    };

    return (
        <div className="category-management">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>支出類別管理</h3>
                    <Text type="secondary">為您的支出分配美觀的圖示與顏色</Text>
                </div>
                <Button type="primary" shape="round" icon={<PlusOutlined />} onClick={() => showModal()}>新增類別</Button>
            </div>

            <List
                grid={{ gutter: 20, xs: 1, sm: 1, md: 2, lg: 3 }}
                dataSource={categories}
                renderItem={(item) => (
                    <List.Item>
                        <Card
                            hoverable
                            className="category-card"
                            style={cardStyle}
                            actions={[
                                <EditOutlined key="edit" onClick={() => showModal(item)} />,
                                <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(item.id)}>
                                    <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                                </Popconfirm>
                            ]}
                        >
                            <Card.Meta
                                avatar={<DynamicIcon iconName={item.icon} color={item.color} />}
                                title={<span style={{ fontWeight: 600 }}>{item.name}</span>}
                                description={<Text type="secondary" size="small">ID: #{item.id}</Text>}
                            />
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                title={editingCategory ? "編輯類別" : "新增類別"}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="類別名稱" rules={[{ required: true }]}>
                        <Input placeholder="例如：飲食、娛樂" />
                    </Form.Item>
                    
                    <Form.Item name="icon" label="選擇圖示">
                        <Radio.Group buttonStyle="solid">
                            <Space wrap>
                                {ICON_OPTIONS.map(opt => (
                                    <Radio.Button key={opt.name} value={opt.name} style={{ height: 'auto', padding: '8px' }}>
                                        {opt.icon}
                                    </Radio.Button>
                                ))}
                            </Space>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item name="color" label="類別主題色">
                        <Radio.Group>
                            <Space wrap>
                                {COLOR_OPTIONS.map(c => (
                                    <Radio key={c} value={c}>
                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: c }} />
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ExpenseCategorySection;