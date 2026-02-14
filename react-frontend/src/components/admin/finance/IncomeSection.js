import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, DollarSign, Wallet, Calendar as CalendarIcon, ListFilter, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Card, Table, Tag, Typography, DatePicker, Space, Row, Col, Spin, Button, Form, Select, Input, InputNumber, message } from 'antd';
import dayjs from 'dayjs';
import { StatRow } from './StatRow'; // 延用你的 StatRow
import { financeApi } from '../../../services/financeApi';
import './styles/IncomeSection.css'; // 建議建立專屬 CSS

const { Text, Title } = Typography;

const IncomeSection = ({ incomes: initialIncomes = [], incomeCategories = [] }) => {
    const [currentViewDate, setCurrentViewDate] = useState(dayjs());
    const [incomes, setIncomes] = useState(initialIncomes);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // 1. 格式化下拉選單選項
    const sourceOptions = useMemo(() =>
        incomeCategories.map(s => ({ label: s.name, value: s.id })),
        [incomeCategories]);

    // 2. 獲取數據
    const refreshData = useCallback(async (date) => {
        setLoading(true);
        try {
            const year = date.year();
            const month = date.month() + 1;
            // 假設你後端有對應的 getIncomes API
            const data = await financeApi.getIncomes(year, month);
            setIncomes(data || []);
        } catch (error) {
            console.error("抓取收入數據失敗:", error);
            message.error("無法載入收入資料");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData(currentViewDate);
    }, [currentViewDate, refreshData]);

    // 3. 表格欄位定義
    const columns = [
        {
            title: '日期',
            dataIndex: 'income_date',
            key: 'date',
            width: 120,
            render: (text) => <Text type="secondary">{text?.split('T')[0]}</Text>,
        },
        {
            title: '來源',
            dataIndex: 'source_name',
            key: 'source',
            render: (text) => <Tag color="green">{text || '其他收入'}</Tag>,
        },
        {
            title: '項目',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: '金額',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (val) => (
                <Text strong style={{ color: '#059669' }}>
                    + ${(parseFloat(val) || 0).toLocaleString()}
                </Text>
            ),
        }
    ];

    // 4. 新增收入處理
    const onFinish = async (values) => {
        try {
            const payload = {
                ...values,
                income_date: values.income_date.format('YYYY-MM-DD'),
                transaction_type: 'INCOME'
            };
            await financeApi.createIncome(payload);
            message.success('收入已登記');
            form.resetFields();
            refreshData(currentViewDate);
        } catch (error) {
            message.error('新增失敗');
        }
    };

    return (
        <section className="income-section">
            <Card bordered={false} className="main-card">
                <Title level={2} style={{ margin: 0, padding: '20px 0', color: '#065f46' }}>收入來源管理</Title>
                {/* 控制與統計區 */}
                <div className="control-panel" style={{ marginBottom: 24 }}>
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                        <Col xs={24} md={12}>
                            <Space size="middle">
                                <Button 
                                    icon={<ChevronLeft size={16} />} 
                                    onClick={() => setCurrentViewDate(prev => prev.subtract(1, 'month'))} 
                                />
                                <DatePicker 
                                    picker="month" 
                                    value={currentViewDate} 
                                    onChange={date => date && setCurrentViewDate(date)}
                                    format="YYYY-MM"
                                    allowClear={false}
                                />
                                <Button 
                                    icon={<ChevronRight size={16} />} 
                                    onClick={() => setCurrentViewDate(prev => prev.add(1, 'month'))} 
                                />
                            </Space>
                        </Col>
                        <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                            <Text type="secondary">本月進度目標：</Text>
                            <Text strong style={{ color: '#059669', fontSize: 18, marginLeft: 8 }}>
                                ${incomes.reduce((acc, cur) => acc + parseFloat(cur.amount), 0).toLocaleString()}
                            </Text>
                        </Col>
                    </Row>
                </div>

                <Spin spinning={loading}>
                    <StatRow items={[
                        {
                            icon: TrendingUp,
                            label: `${currentViewDate.format('M')}月 總進帳`,
                            value: incomes.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0),
                            unit: "元",
                            colorStyle: { background: '#ecfdf5', color: '#059669' }
                        },
                        {
                            icon: Wallet,
                            label: "入帳次數",
                            value: incomes.length,
                            unit: "次",
                            colorStyle: { background: '#f0fdf4', color: '#16a34a' }
                        }
                    ]} />
                </Spin>

                <Row gutter={[24, 24]} style={{ marginTop: 24, height: '100%' }}>
                    {/* 左側：快速新增 */}
                    <Col xs={24} lg={8}>
                        <Card title={<Space><PlusCircle size={18} />登記新收入</Space>} size="small">
                            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ income_date: dayjs() }}>
                                <Form.Item name="income_date" label="入帳日期" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                                <Form.Item name="source_id" label="收入來源" rules={[{ required: true }]}>
                                    <Select options={sourceOptions} placeholder="選擇來源" />
                                </Form.Item>
                                <Form.Item name="title" label="項目名稱" rules={[{ required: true }]}>
                                    <Input placeholder="例如：1月薪資、股息收入" />
                                </Form.Item>
                                <Form.Item name="amount" label="金額" rules={[{ required: true }]}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        prefix="$"
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" block style={{ background: '#059669', borderColor: '#059669' }}>
                                    確認入帳
                                </Button>
                            </Form>
                        </Card>
                    </Col>

                    {/* 右側：明細列表 */}
                    <Col xs={24} lg={16}>
                        <Card title={<Space><ListFilter size={18} /> 收入明細</Space>} size="small">
                            <Table
                                dataSource={incomes}
                                columns={columns}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 8 }}
                                size="middle"
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>
        </section>
    );
};

export default IncomeSection;