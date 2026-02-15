import React from 'react';
import { Modal, Form, InputNumber, Input, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import { financeApi } from '../../../../services/financeApi';

const DepositModal = ({ visible, onCancel, goal, onSuccess }) => {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                goal_id: goal.id,
                amount: values.amount,
                note: values.note || `存入項目：${goal.title}`,
                transaction_date: values.date.format('YYYY-MM-DD HH:mm:ss'),
            };

            // 呼叫 API (需在 financeApi 補上這個方法)
            await financeApi.depositToGoal(payload);
            
            message.success(`成功存入 ${values.amount.toLocaleString()} 元！`);
            form.resetFields();
            onSuccess(); // 刷新父組件資料
        } catch (err) {
            console.error("存款失敗:", err);
            message.error("存款紀錄儲存失敗");
        }
    };

    return (
        <Modal
            title={`存款至：${goal?.title}`}
            open={visible}
            onOk={handleSubmit}
            onCancel={onCancel}
            destroyOnClose
        >
            <Form form={form} layout="vertical" initialValues={{ date: dayjs(), amount: goal?.monthly_push }}>
                <Form.Item label="存款金額" name="amount" rules={[{ required: true, message: '請輸入金額' }]}>
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                </Form.Item>
                <Form.Item label="日期" name="date" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="備註" name="note">
                    <Input.TextArea placeholder="例如：2月獎金撥入" rows={2} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default DepositModal;