import React, { useState, useEffect } from 'react';
import { 
  Form, Input, InputNumber, Button, Table, Card, Select,
  Typography, Space, Divider, Row, Col, Statistic, Tag, message 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, SaveOutlined, 
  FileProtectOutlined, DollarOutlined 
} from '@ant-design/icons';
import { quotationApi } from '../../services/quotationApi';
const { Text, Title } = Typography;

const QuotationSystem = () => {
  const [form] = Form.useForm();
  const [serviceTemplates, setServiceTemplates] = useState([]); // 軍火庫數據
  const [loading, setLoading] = useState(false);
  
  const items = Form.useWatch('items', form);
  const discount = Form.useWatch('discount', form) || 0;
  const taxRate = Form.useWatch('taxRate', form) || 0.05;

  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, final: 0 });

  // 1. 初始化抓取服務清單
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await quotationApi.getStandardServices();
        setServiceTemplates(data);
      } catch (err) {
        message.error("無法載入標準服務清單");
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const sub = (items || []).reduce((acc, curr) => 
      acc + ((curr?.price || 0) * (curr?.qty || 0)), 0
    );
    const tax = (sub - discount) * taxRate;
    setTotals({ subtotal: sub, tax, final: sub - discount + tax });
  }, [items, discount, taxRate]);

  // 2. 處理快選連動邏輯
  const handleServiceSelect = (val, index) => {
    const selected = serviceTemplates.find(s => s.id === val);
    if (selected) {
      const currentItems = form.getFieldValue('items');
      currentItems[index] = {
        ...currentItems[index],
        name: selected.name, // 覆蓋為名稱字串
        price: selected.price,
        desc: selected.description,
        service_id: selected.id // 記錄來源 ID
      };
      form.setFieldsValue({ items: currentItems });
    }
  };

  // 3. 提交表單至後端
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 轉換數據結構以符合後端 API (把欄位名轉為後端對應名稱)
      const payload = {
        client_name: values.clientName,
        subject: values.subject,
        discount: values.discount,
        tax_rate: values.taxRate,
        payment_terms: values.paymentTerms,
        items: values.items.map(item => ({
          service_id: item.service_id,
          title: item.name,
          description: item.desc,
          unit_price: item.price,
          quantity: item.qty
        }))
      };

      const res = await quotationApi.createQuotation(payload);
      message.success(`報價單儲存成功！單號: ${res.quotation_no}`);
      form.resetFields();
    } catch (err) {
      message.error("儲存失敗，請檢查網路連線");
    } finally {
      setLoading(false);
    }
  };

  const getColumns = (remove) => [
    {
      title: '服務項目',
      dataIndex: 'name',
      width: '40%',
      render: (_, record, index) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={[index, 'name']} rules={[{ required: true }]} style={{ margin: 0 }}>
            <Select
              showSearch
              placeholder="搜尋或輸入服務"
              options={serviceTemplates.map(s => ({ label: s.name, value: s.id }))}
              onSelect={(val) => handleServiceSelect(val, index)}
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name={[index, 'desc']} style={{ margin: 0 }}>
            <Input.TextArea autoSize={{ minRows: 1 }} placeholder="細項描述" style={{ fontSize: '12px' }} />
          </Form.Item>
          {/* 隱藏欄位記錄 ID */}
          <Form.Item name={[index, 'service_id']} hidden><Input /></Form.Item>
        </Space>
      ),
    },
    {
      title: '單價',
      dataIndex: 'price',
      width: '20%',
      render: (_, record, index) => (
        <Form.Item name={[index, 'price']} rules={[{ required: true }]} style={{ margin: 0 }}>
          <InputNumber style={{ width: '100%' }} prefix="$" />
        </Form.Item>
      ),
    },
    {
      title: '數量',
      dataIndex: 'qty',
      width: '15%',
      render: (_, record, index) => (
        <Form.Item name={[index, 'qty']} rules={[{ required: true }]} style={{ margin: 0 }}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: '小計',
      width: '15%',
      align: 'right',
      render: (_, record, index) => {
        const p = items?.[index]?.price || 0;
        const q = items?.[index]?.qty || 0;
        return <Text strong>${(p * q).toLocaleString()}</Text>;
      },
    },
    {
      title: '操作',
      width: '10%',
      align: 'center',
      render: (_, record, index) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(index)} />
      ),
    },
  ];

  return (
    <div style={{ padding: '40px', background: '#f4f7f9', minHeight: '100vh' }}>
      <Card style={{ height: '100%'}} loading={loading}>
        <Title level={2}><FileProtectOutlined /> 外包報價系統</Title>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ items: [{}], taxRate: 0.05, discount: 0 }}>
          {/* ... 客戶與主旨 Row (同之前) ... */}
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Form.Item name="clientName" label="客戶/公司名稱" rules={[{ required: true }]}><Input size="large" /></Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="subject" label="專案主旨" rules={[{ required: true }]}><Input size="large" /></Form.Item>
            </Col>
          </Row>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <Table
                dataSource={fields}
                columns={getColumns(remove)}
                pagination={false}
                rowKey="key"
                footer={() => <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>新增項目</Button>}
              />
            )}
          </Form.List>

          <Divider />

          <Row gutter={48}>
            <Col span={14}>
              <Form.Item name="paymentTerms" label="付款與商務條件">
                <Input.TextArea rows={6} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Card style={{ background: '#fafafa' }}>
                <Statistic title="最終總報價" value={totals.final} precision={0} prefix={<DollarOutlined />} />
                <Button type="primary" size="large" block icon={<SaveOutlined />} onClick={() => form.submit()} style={{ marginTop: 24 }}>
                  儲存報價單
                </Button>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default QuotationSystem;