import React, { useEffect } from 'react';
import { Modal, Form, DatePicker, InputNumber, Input } from 'antd';
import dayjs from 'dayjs';

const MotorFormModal = ({ open, onCancel, onFinish, editingRecord }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            if (editingRecord) {
                form.setFieldsValue({
                    ...editingRecord,
                    maintenance_date: dayjs(editingRecord.maintenance_date)
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ maintenance_date: dayjs() });
            }
        }
    }, [open, editingRecord, form]);

    return (
        <Modal
            title={editingRecord ? "編輯保養紀錄" : "新增保養紀錄"}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
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
    );
};

export default MotorFormModal;