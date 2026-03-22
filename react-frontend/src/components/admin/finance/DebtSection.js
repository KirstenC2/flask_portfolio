import React, { useState } from 'react';
import {
    Card, Progress, Statistic, Button, Modal, Drawer,
    Form, Input, DatePicker, List, Space, Tag, Typography, Divider, Empty, Select
} from 'antd';
import {
    DollarOutlined, HistoryOutlined, PlusOutlined,
    CheckCircleOutlined, ArrowDownOutlined, FallOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

const DebtSection = ({ debts = [], newDebt, setNewDebt, onCreate, onAddPayment, filterStatus, setFilterStatus }) => {
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [form] = Form.useForm();

    const safeDebts = Array.isArray(debts) ? debts : [];
    const totalRemaining = safeDebts.reduce((acc, d) => acc + (Number(d.current_balance) || 0), 0);

    const openPayModal = (debt) => {
        setSelectedDebt(debt);
        setIsPayModalOpen(true);
        // 預設狀態為 COMPLETED，日期為今天
        form.setFieldsValue({ amount: '', date: dayjs(), note: '', status: 'COMPLETED' });
    };

    const openHistory = (debt) => {
        setSelectedDebt(debt);
        setIsHistoryOpen(true);
    };

    const handlePaymentSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formatted = {
                ...values,
                // 後端 API 現在接收 date 欄位
                date: values.date.format('YYYY-MM-DD HH:mm:ss')
            };
            await onAddPayment(selectedDebt.id, formatted);
            setIsPayModalOpen(false);
        } catch (err) {
            console.error("Validation failed", err);
        }
    };

    return (
        <section>
            <Card variant="outlined" className="full-calendar-card" style={{ height: '100%' }}>
                <Title level={2} style={{ margin: 0, padding: '20px 0' }}>債務管理</Title>

            {/* 統計與快速新增 */}
            <Card variant="outlined" style={{ marginBottom: 20, borderRadius: 12, height: "100%" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <Space size="large">
                        <Statistic
                            title="剩餘總負債"
                            value={totalRemaining}
                            prefix={<FallOutlined style={{ color: '#ff4d4f' }} />}
                            precision={0}
                            styles={{ color: '#ff4d4f', fontWeight: 'bold' }}
                        />
                        <Space.Compact style={{ marginLeft: 20 }}>
                            {['all', 'active', 'paid'].map(s => (
                                <Button
                                    key={s}
                                    // 診斷點：看看當前 filterStatus 到底是哪個字串
                                    type={filterStatus === s ? 'primary' : 'default'}
                                    onClick={() => {
                                        console.log("切換過濾器至:", s);
                                        setFilterStatus(s);
                                    }}
                                >
                                    {s === 'all' ? '全部' : s === 'active' ? '待還' : '已結'}
                                </Button>
                            ))}
                        </Space.Compact>
                    </Space>

                    <Form layout="inline">
                        <Form.Item>
                            <Input
                                placeholder="債務名稱"
                                value={newDebt.title}
                                onChange={e => setNewDebt({ ...newDebt, title: e.target.value })}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Input
                                type="number"
                                placeholder="總金額"
                                value={newDebt.total_amount}
                                onChange={e => setNewDebt({ ...newDebt, total_amount: e.target.value })}
                            />
                        </Form.Item>
                        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
                    </Form>
                </div>
            </Card>

            {/* 債務卡片清單 */}
            <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
                dataSource={safeDebts}
                // ... 內部的 renderItem
                renderItem={(debt) => {
                    // 1. 強制轉換為數字，並給予預設值 0
                    const total = Number(debt.total_amount) || 0;
                    const current = Number(debt.current_balance) || 0;

                    // 2. 增加分母檢查，避免除以 0
                    const progress = total > 0
                        ? Math.min(100, Math.round(((total - current) / total) * 100))
                        : 0;

                    return (
                        <List.Item>
                            <Card
                                hoverable
                                actions={[
                                    <Button type="text" icon={<HistoryOutlined />} onClick={() => openHistory(debt)}>歷史</Button>,
                                    <Button
                                        type="primary"
                                        ghost
                                        icon={<DollarOutlined />}
                                        onClick={() => openPayModal(debt)}
                                        // 使用後端給的布林值，如果沒有則用邏輯判斷
                                        disabled={debt.is_fully_paid || current <= 0}
                                    >
                                        還款
                                    </Button>
                                ]}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <Title level={5} style={{ margin: 0 }}>{debt.title}</Title>
                                    <Text type={current > 0 ? "danger" : "success"} strong>
                                        ${current.toLocaleString()}
                                    </Text>
                                </div>
                                {/* 確保數據存在才顯示 */}
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    原始金額: ${total.toLocaleString()}
                                </Text>

                                <div style={{ marginTop: 15 }}>
                                    <Progress
                                        percent={progress}
                                        size="small"
                                        strokeColor={current <= 0 ? '#52c41a' : '#1890ff'}
                                    />
                                    {debt.is_fully_paid && <Tag color="success" style={{ marginTop: 5 }}>已結清</Tag>}
                                </div>
                            </Card>
                        </List.Item>
                    );
                }}
            />

            {/* 彈窗：還款表單 (新增狀態選擇) */}
            <Modal
                title={`還款 - ${selectedDebt?.title}`}
                open={isPayModalOpen}
                onOk={handlePaymentSubmit}
                onCancel={() => setIsPayModalOpen(false)}
                destroyOnHidden
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="amount" label="金額" rules={[{ required: true }]}>
                        <Input type="number" prefix="$" />
                    </Form.Item>
                    <Form.Item name="date" label="日期" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="status" label="交易狀態" tooltip="PENDING 會鎖定可用資金但債務餘額暫時不變">
                        <Select>
                            <Option value="COMPLETED">已支付 (Completed)</Option>
                            <Option value="PENDING">預計支付 (Pending)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="note" label="備註">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 抽屜：明細 (整合 Transaction 資訊) */}
            <Drawer
                title="還款明細"
                onClose={() => setIsHistoryOpen(false)}
                open={isHistoryOpen}
                width={350}
            >
                {selectedDebt?.payments?.length > 0 ? (
                    <List
                        dataSource={selectedDebt.payments}
                        renderItem={p => (
                            <List.Item extra={<Text strong>-${p.amount}</Text>}>
                                <List.Item.Meta
                                    title={dayjs(p.date).format('YYYY-MM-DD')}
                                    description={
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary">{p.note || "無備註"}</Text>
                                            {p.status === 'PENDING' ? (
                                                <Tag icon={<ClockCircleOutlined />} color="warning">待執行</Tag>
                                            ) : (
                                                <Tag icon={<CheckCircleOutlined />} color="success">已完成</Tag>
                                            )}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : <Empty />}
            </Drawer>
            </Card>
        </section>
    );
};

export default DebtSection;