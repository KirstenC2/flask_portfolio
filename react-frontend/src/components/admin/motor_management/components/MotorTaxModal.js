import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, InputNumber } from 'antd';
import dayjs from 'dayjs';

const MotorTaxModal = ({ open, onCancel, onFinish, editingTax }) => {
    const [form] = Form.useForm();

    // 關鍵：監聽 open 與 editingTax，當 Modal 開啟或切換資料時填入值
    useEffect(() => {
        if (open) {
            if (editingTax) {
                // 編輯模式：帶入現有資料
                form.setFieldsValue({
                    ...editingTax,
                    // 記得將資料庫的日期字串轉換回 dayjs 物件，DatePicker 才能顯示
                    expired_date: editingTax.expired_date ? dayjs(editingTax.expired_date) : null
                });
            } else {
                // 新增模式：清空表單
                form.resetFields();
            }
        }
    }, [open, editingTax, form]);

    const handleSubmit = () => {
        form.validateFields().then(values => {
            onFinish(values);
        });
    };

    return (
        <Modal
            title={editingTax ? "編輯稅務規費" : "新增稅務規費"}
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            destroyOnHidden // 確保關閉時銷毀子組件，避免舊資料殘留
        >
            <Form form={form} layout="vertical">
                <Form.Item 
                    name="title" 
                    label="項目名稱" 
                    rules={[{ required: true, message: '請輸入名稱' }]}
                >
                    <Input placeholder="如：燃料稅、強制險" />
                </Form.Item>

                <Form.Item name="expired_date" label="繳費/到期日">
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="amount" label="金額">
                    <InputNumber style={{ width: '100%' }} prefix="$" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MotorTaxModal;