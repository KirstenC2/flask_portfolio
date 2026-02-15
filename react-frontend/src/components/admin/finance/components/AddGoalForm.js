import React from 'react';
import { Form, Input, InputNumber, Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const AddGoalForm = ({ onAdd }) => {
  const [form] = Form.useForm();

  return (
    <Card style={{ padding: '20px',height:'100%' }}>
      <h3 style={{ margin: 0, padding: '20px' }}>建立新計畫</h3>
      <Form form={form} layout="vertical" onFinish={(v) => { onAdd(v); form.resetFields(); }}>
        <Form.Item name="title" label="目標名稱" rules={[{ required: true }]}>
          <Input placeholder="例如：日本旅遊" size="large" />
        </Form.Item>
        <Form.Item name="target_amount" label="目標金額" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} size="large" prefix="$" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large" icon={<PlusOutlined />}>
          確認新增
        </Button>
      </Form>
    </Card>
  );
};

export default AddGoalForm;