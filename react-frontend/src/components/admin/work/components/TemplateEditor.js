import React, { useEffect } from 'react';
import { 
    Drawer, Form, Input, Button, Space, Select, 
    Divider, Typography, message, Tooltip 
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TemplateEditor = ({ visible, onClose, initialData, onSaveSuccess }) => {
    const [form] = Form.useForm();

    // Sync form data when initialData changes (e.g., when clicking Edit)
    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
        } else {
            form.resetFields();
        }
    }, [initialData, form, visible]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // Ensure steps have correct 'order' based on their array index
            const formattedValues = {
                ...values,
                id: initialData?.id,
                steps: values.steps.map((step, index) => ({
                    ...step,
                    order: index + 1
                }))
            };

            const res = await fetch('http://localhost:5001/api/admin/templates/save', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formattedValues)
            });

            if (res.ok) {
                message.success('模板儲存成功！');
                onSaveSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Validation Failed:", error);
        }
    };

    return (
        <Drawer
            title={initialData?.id ? "編輯模板" : "建立新模板"}
            width={720}
            onClose={onClose}
            open={visible}
            bodyStyle={{ paddingBottom: 80 }}
            extra={
                <Space>
                    <Button onClick={onClose}>取消</Button>
                    <Button onClick={handleSubmit} type="primary" icon={<SaveOutlined />}>
                        儲存模板
                    </Button>
                </Space>
            }
        >
            <Form 
                form={form} 
                layout="vertical" 
                initialValues={{ steps: [{ title: '', prompt: '', placeholder: '' }] }}
            >
                {/* Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item
                        name="name"
                        label="模板名稱"
                        rules={[{ required: true, message: '請輸入名稱' }]}
                    >
                        <Input placeholder="例如：麥肯錫七步法" />
                    </Form.Item>
                    <Form.Item name="category" label="分類">
                        <Select placeholder="選擇領域">
                            <Select.Option value="Business">商業邏輯</Select.Option>
                            <Select.Option value="Health">健康管理</Select.Option>
                            <Select.Option value="Personal">個人成長</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                <Divider orientation="left">步驟配置</Divider>

                {/* Dynamic Steps List */}
                <Form.List name="steps">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => (
                                <div key={key} style={{ 
                                    background: '#f8fcfc', 
                                    padding: '16px', 
                                    borderRadius: '12px', 
                                    marginBottom: '16px',
                                    border: '1px solid #d1e8e8'
                                }}>
                                    <Space align="baseline" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong color="#5ec2c2">步驟 {index + 1}</Text>
                                        <Tooltip title="刪除此步驟">
                                            <Button 
                                                type="text" 
                                                danger 
                                                icon={<DeleteOutlined />} 
                                                onClick={() => remove(name)} 
                                            />
                                        </Tooltip>
                                    </Space>

                                    <Form.Item
                                        {...restField}
                                        name={[name, 'title']}
                                        label="步驟標題"
                                        rules={[{ required: true, message: '請輸入標題' }]}
                                    >
                                        <Input placeholder="例如：定義核心問題" />
                                    </Form.Item>

                                    <Form.Item
                                        {...restField}
                                        name={[name, 'prompt']}
                                        label="引導語 (Prompt)"
                                    >
                                        <Input.TextArea rows={2} placeholder="指導使用者如何思考此步驟..." />
                                    </Form.Item>

                                    <Form.Item
                                        {...restField}
                                        name={[name, 'placeholder']}
                                        label="輸入框提示 (Placeholder)"
                                    >
                                        <Input placeholder="輸入框內的預設提示文字..." />
                                    </Form.Item>
                                </div>
                            ))}
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                block
                                icon={<PlusOutlined />}
                                style={{ height: '45px' }}
                            >
                                增加步驟
                            </Button>
                        </>
                    )}
                </Form.List>
            </Form>
        </Drawer>
    );
};

export default TemplateEditor;