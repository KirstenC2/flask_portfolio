import { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Modal, Form, Input, InputNumber, Select, message, Space, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined } from '@ant-design/icons';
const getCategoryColor = (category) => {
  const cat = category?.toUpperCase() || '';

  if (cat.includes('MICROSERVICES') || cat.includes('ARCH')) return 'volcano'; // 橘紅色 (架構類)
  if (cat.includes('BACKEND')) return 'blue';     // 藍色 (後端類)
  if (cat.includes('FRONTEND')) return 'cyan';    // 青色 (前端類)
  if (cat.includes('DEVOPS') || cat.includes('CLOUD')) return 'purple'; // 紫色 (運維類)
  if (cat.includes('UI') || cat.includes('DESIGN')) return 'magenta';   // 洋紅色 (設計類)

  return 'default'; // 灰色 (其他)
};
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

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (res.ok) {
        message.success('刪除成功');
        fetchServices(); // 重新整理列表
      } else {
        throw new Error('刪除失敗');
      }
    } catch (err) {
      message.error('刪除時發生錯誤，請稍後再試');
    }
  };

  const columns = [
    {
      title: '分類',
      dataIndex: 'category',
      width: 140,
      render: (cat) => (
        <Tag
          // 👈 這裡調用顏色函數
          color={getCategoryColor(cat)}
          style={{
            whiteSpace: 'pre-line', // 支援 \n 換行
            height: 'auto',
            padding: '4px 8px',
            fontSize: '11px',
            lineHeight: '1.4',
            wordBreak: 'break-word',
            display: 'inline-block',
            width: '100%',
            textAlign: 'center', // 讓文字居中更好看
            fontWeight: '600'    // 加粗一點更有質感
          }}
        >
          {/* 遇到 & 換行 */}
          {cat ? cat.replace(' & ', ' &\n') : ''}
        </Tag>
      ),
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
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
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

        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          tableLayout="fixed" // 👈 加上這一行，內容就不會強行撐開欄位
        />

        <Modal
          title={editingId ? "編輯服務模板" : "新增服務模板"}
          open={isModalOpen}
          onOk={() => form.submit()}
          onCancel={() => setIsModalOpen(false)}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="category" label="服務分類" rules={[{ required: true }]}>
              <Select options={[
                { label: '基礎後端建置', value: 'BASE_INFRA' },
                { label: 'API開發與整合', value: 'API & INTEGRATION' },
                { label: '微服務與架構', value: 'MICROSERVICES & ARCHITECTURE' },
                { label: '運維與顧問服務', value: 'DEVOPS & CONSULTING' },

              ]} />
            </Form.Item>
            <Form.Item name="name" label="服務名稱" rules={[{ required: true }]}>
              <Input placeholder="例如：JWT 權限系統" />
            </Form.Item>
            <Form.Item name="price" label="預設單價" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} prefix="$" />
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