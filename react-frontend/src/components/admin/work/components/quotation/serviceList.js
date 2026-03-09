import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Form, Input, InputNumber, Select, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined } from '@ant-design/icons';

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // 1. 取得資料
  const fetchServices = async () => {
    const res = await fetch('http://localhost:5001/api/admin/services', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const data = await res.json();
    setServices(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchServices(); }, []);

  // 2. 處理新增/編輯提交
  const handleSave = async (values) => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
        ? `http://localhost:5001/api/admin/services/${editingId}`
        : `http://localhost:5001/api/admin/services`;

    try {
      await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(values),
      });
      message.success('服務模板已更新');
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      message.error('儲存失敗');
    }
  };

  const columns = [
    {
      title: '分類',
      dataIndex: 'category',
      render: (cat) => <Tag color="blue">{cat}</Tag>,
      filters: [
        { text: 'Frontend', value: 'FRONTEND' },
        { text: 'Backend', value: 'BACKEND' },
        { text: 'DevOps', value: 'DEVOPS' },
      ],
      onFilter: (value, record) => record.category === value,
    },
    { title: '服務名稱', dataIndex: 'name', strong: true },
    { title: '預設描述', dataIndex: 'description', ellipsis: true, width: 300 },
    { 
      title: '參考單價', 
      dataIndex: 'price', 
      render: (p) => <p style={{ fontWeight: 'bold' }}>${p.toLocaleString()}</p> 
    },
    { title: '單位', dataIndex: 'unit' },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => {
            setEditingId(record.id);
            form.setFieldsValue(record);
            setIsModalOpen(true);
          }} />
          <Button danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ height: '100%' }} title={<Space><ToolOutlined /> 標準服務軍火庫</Space>} 
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalOpen(true);
            }}>新增模板</Button>}>
        
        <Table dataSource={services} columns={columns} rowKey="id" />

        <Modal 
          title={editingId ? "編輯服務模板" : "新增服務模板"} 
          open={isModalOpen} 
          onOk={() => form.submit()} 
          onCancel={() => setIsModalOpen(false)}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="category" label="服務分類" rules={[{required: true}]}>
              <Select options={[
                {label: '前端開發', value: 'FRONTEND'},
                {label: '後端開發', value: 'BACKEND'},
                {label: '運維部署', value: 'DEVOPS'},
                {label: '其他', value: 'OTHER'},
              ]} />
            </Form.Item>
            <Form.Item name="name" label="服務名稱" rules={[{required: true}]}>
              <Input placeholder="例如：JWT 權限系統" />
            </Form.Item>
            <Form.Item name="price" label="預設單價" rules={[{required: true}]}>
              <InputNumber style={{width: '100%'}} prefix="$" />
            </Form.Item>
            <Form.Item name="unit" label="單位" initialValue="式">
              <Input placeholder="支 / 頁 / 套 / 式" />
            </Form.Item>
            <Form.Item name="description" label="預設規格描述">
              <Input.TextArea rows={4} placeholder="這段文字會自動帶入報價單項目描述..." />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default ServiceList;