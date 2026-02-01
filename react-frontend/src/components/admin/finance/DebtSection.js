import React, { useState } from 'react';
import {
    Card, Progress, Statistic, Button, Modal, Drawer,
    Form, Input, DatePicker, List, Space, Tag, Typography, Divider, Empty
} from 'antd';
import {
    DollarOutlined, HistoryOutlined, PlusOutlined,
    CheckCircleOutlined, ArrowDownOutlined, FallOutlined  // 改成 FallOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const DebtSection = ({ debts = [], newDebt, setNewDebt, onCreate, onAddPayment, filterStatus, setFilterStatus }) => {
    // 狀態管理
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [form] = Form.useForm();

    const safeDebts = Array.isArray(debts) ? debts : [];
    const totalRemaining = safeDebts.reduce((acc, d) => acc + (Number(d.current_balance) || 0), 0);

    // 開啟還款視窗
    const openPayModal = (debt) => {
        setSelectedDebt(debt);
        setIsPayModalOpen(true);
        form.setFieldsValue({ amount: '', payment_date: dayjs(), note: '' });
    };

    // 開啟歷史紀錄抽屜
    const openHistory = (debt) => {
        setSelectedDebt(debt);
        setIsHistoryOpen(true);
    };

    // 提交還款
    const handlePaymentSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formatted = {
                ...values,
                payment_date: values.payment_date.format('YYYY-MM-DD')
            };
            await onAddPayment(selectedDebt.id, formatted);
            setIsPayModalOpen(false);
        } catch (err) {
            console.error("Validation failed", err);
        }
    };

    return (
        <div className="debt-page-container" style={{ padding: '20px' }}>

            {/* 頂部新增與統計列 */}
            <Card bordered={false} style={{ marginBottom: 20, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <Space size="large">
                        <Statistic
                            title="剩餘總負債"
                            value={totalRemaining}
                            // 將 TrendingDownOutlined 改為 FallOutlined
                            prefix={<FallOutlined style={{ color: '#ff4d4f' }} />}
                            precision={0}
                            valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
                        />
                        <div className="filter-group" style={{ marginLeft: 40 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>篩選狀態</Text>
                            <Space.Compact>
                                {['all', 'active', 'paid'].map(s => (
                                    <Button
                                        key={s}
                                        type={filterStatus === s ? 'primary' : 'default'}
                                        onClick={() => setFilterStatus(s)}
                                    >
                                        {s === 'all' ? '全部' : s === 'active' ? '待還' : '已結'}
                                    </Button>
                                ))}
                            </Space.Compact>
                        </div>
                    </Space>

                    <div className="quick-add">
                        <Space align="end">
                            <Form layout="inline">
                                <Form.Item label="快速新增債務">
                                    <Input
                                        placeholder="債務名稱"
                                        value={newDebt.title}
                                        onChange={e => setNewDebt({ ...newDebt, title: e.target.value })}
                                    />
                                </Form.Item>
                                <Form.Item>
                                    <Input
                                        type="number"
                                        placeholder="金額"
                                        value={newDebt.total_amount}
                                        onChange={e => setNewDebt({ ...newDebt, total_amount: e.target.value })}
                                    />
                                </Form.Item>
                                <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新增</Button>
                            </Form>
                        </Space>
                    </div>
                </div>
            </Card>

            {/* 債務卡片清單 */}
            <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
                dataSource={safeDebts}
                renderItem={(debt) => {
                    const progress = Math.min(100, Math.round(((debt.total_amount - debt.current_balance) / debt.total_amount) * 100));

                    return (
                        <List.Item>
                            <Card
                                hoverable
                                bodyStyle={{ padding: '20px' }}
                                actions={[
                                    <Button type="text" icon={<HistoryOutlined />} onClick={() => openHistory(debt)}>查看明細</Button>,
                                    <Button
                                        type="primary"
                                        ghost
                                        icon={<DollarOutlined />}
                                        onClick={() => openPayModal(debt)}
                                        disabled={debt.current_balance <= 0}
                                    >
                                        立即還款
                                    </Button>
                                ]}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <Title level={4} style={{ margin: 0 }}>{debt.title}</Title>
                                        <Text type="secondary">總金額: ${Number(debt.total_amount).toLocaleString()}</Text>
                                    </div>
                                    <Statistic
                                        value={debt.current_balance}
                                        prefix="$"
                                        valueStyle={{ fontSize: '20px', color: debt.current_balance > 0 ? '#ff4d4f' : '#52c41a' }}
                                    />
                                </div>

                                <div style={{ marginTop: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <Text strong>{progress}% 已還款</Text>
                                        {progress === 100 && <Tag color="success" icon={<CheckCircleOutlined />}>已結清</Tag>}
                                    </div>
                                    <Progress
                                        percent={progress}
                                        strokeColor={progress === 100 ? '#52c41a' : '#5ec2c2'}
                                        showInfo={false}
                                    />
                                </div>
                            </Card>
                        </List.Item>
                    );
                }}
            />

            {/* 彈窗：還款表單 */}
            <Modal
                title={`執行還款 - ${selectedDebt?.title}`}
                open={isPayModalOpen}
                onOk={handlePaymentSubmit}
                onCancel={() => setIsPayModalOpen(false)}
                okText="確認送出"
                cancelText="取消"
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                    <Form.Item name="amount" label="本次還款金額" rules={[{ required: true, message: '請輸入金額' }]}>
                        <Input type="number" prefix="$" size="large" />
                    </Form.Item>
                    <Form.Item name="payment_date" label="還款日期" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} size="large" />
                    </Form.Item>
                    <Form.Item name="note" label="備註">
                        <Input.TextArea placeholder="選填，例如：現金還款" rows={2} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 抽屜：查看還款歷史紀錄 */}
            <Drawer
                title={`${selectedDebt?.title} - 還款歷史明細`}
                placement="right"
                width={400}
                onClose={() => setIsHistoryOpen(false)}
                open={isHistoryOpen}
            >
                {selectedDebt?.payments && selectedDebt.payments.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={selectedDebt.payments}
                        renderItem={p => (
                            <List.Item
                                extra={<Text strong style={{ color: '#ff4d4f' }}>-${Number(p.amount).toLocaleString()}</Text>}
                            >
                                <List.Item.Meta
                                    avatar={<ArrowDownOutlined style={{ color: '#52c41a' }} />}
                                    title={<Text>{dayjs(p.payment_date).format('YYYY-MM-DD')}</Text>}
                                    description={p.note || "無備註"}
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="尚無任何還款紀錄" />
                )}
                <Divider />
                <div style={{ textAlign: 'right' }}>
                    <Text type="secondary">初始總債務：${Number(selectedDebt?.total_amount).toLocaleString()}</Text>
                </div>
            </Drawer>
        </div>
    );
};

export default DebtSection;