import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { History, DollarSign, BarChart3, Calendar as CalendarIcon, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Card, Table, Tag, Typography, DatePicker, Space, Row, Col, Spin, Calendar, Button } from 'antd';
import dayjs from 'dayjs';
import { StatRow } from './StatRow';
import { financeApi } from '../../../services/financeApi';
import './styles/ExpenseSection.css';
import '../../../common/global.css';

const { Text, Title } = Typography;

const ExpenseSection = ({
    categories = [],
    stats = { monthly: [] },
    newExpense,
    setNewExpense,
    onCreate
}) => {
    // 1. 狀態管理
    const [currentViewDate, setCurrentViewDate] = useState(dayjs()); // 當前顯示的月份
    const [selectedDate, setSelectedDate] = useState(null);       // 使用者點選的特定日期
    const [expenses, setExpenses] = useState([]);                 // 當月所有支出
    const [dailySummaries, setDailySummaries] = useState([]);     // 日曆用的每日加總
    const [loading, setLoading] = useState(false);

    // 2. 獲取數據邏輯 (單一來源)
    const refreshData = useCallback(async (date) => {
        setLoading(true);
        try {
            const year = date.year();
            const month = date.month() + 1;

            const [expenseList, summaryData] = await Promise.all([
                financeApi.getExpenses(year, month),
                financeApi.getDailySummary(year, month)
            ]);

            setExpenses(Array.isArray(expenseList) ? expenseList : expenseList.data || []);
            setDailySummaries(Array.isArray(summaryData) ? summaryData : []);
        } catch (error) {
            console.error("Failed to fetch finance data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. 監聽月份切換
    useEffect(() => {
        refreshData(currentViewDate);
        setSelectedDate(null); // 切換月份時，取消特定日期的選取，回到月檢視
    }, [currentViewDate, refreshData]);

    // 4. 計算屬性：根據選中日期過濾清單
    const filteredExpenses = useMemo(() => {
        if (!selectedDate) return expenses;
        const dateStr = selectedDate.format('YYYY-MM-DD');
        return expenses.filter(e => e.expense_date.split('T')[0] === dateStr);
    }, [expenses, selectedDate]);

    // 5. 日曆格子渲染
    const cellRender = (value) => {
        // 只渲染當前月份的金額
        if (value.month() !== currentViewDate.month()) return null;

        const dateStr = value.format('YYYY-MM-DD');
        const dayData = dailySummaries.find(item => item.date === dateStr);

        if (dayData && dayData.daily_total > 0) {
            return (
                <div className="calendar-amount-badge">
                    <Text style={{ fontSize: '10px', color: '#be185d', fontWeight: '800' }}>
                        ${Math.round(dayData.daily_total).toLocaleString()}
                    </Text>
                </div>
            );
        }
        return null;
    };

    const columns = [
        {
            title: '日期',
            dataIndex: 'expense_date',
            key: 'date',
            width: 110,
            render: (text) => <Text type="secondary">{text?.split('T')[0]}</Text>,
            sorter: (a, b) => new Date(a.expense_date) - new Date(b.expense_date),
        },
        {
            title: '分類',
            dataIndex: 'category_name',
            key: 'category',
            width: 100,
            render: (text) => <Tag color="pink">{text || '未分類'}</Tag>,
        },
        {
            title: '項目名稱',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: '金額',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            width: 100,
            render: (val) => (
                <Text strong style={{ color: '#e11d48' }}>
                    ${(parseFloat(val) || 0).toLocaleString()}
                </Text>
            ),
        }
    ];

    const chartData = stats?.monthly || [];

    return (
        <section>
            <Card bordered={false} className="full-calendar-card" style={{ height: '100%' }}>
                <Title level={2} style={{ margin: 0, padding: '20px 0' }}>財務支出管理</Title>

                {/* 控制區域 */}
                <div className="expense-header-section">
                    <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                        <Col>
                            <Space align="center">
                                <Text strong>檢視月份：</Text>
                                <Button
                                    icon={<ChevronLeft size={16} />}
                                    onClick={() => setCurrentViewDate(prev => prev.subtract(1, 'month'))}
                                    type="text"
                                />
                                <DatePicker
                                    picker="month"
                                    value={currentViewDate}
                                    onChange={(date) => date && setCurrentViewDate(date)}
                                    allowClear={false}
                                    format="YYYY-MM"
                                />
                                <Button
                                    icon={<ChevronRight size={16} />}
                                    onClick={() => setCurrentViewDate(prev => prev.add(1, 'month'))}
                                    type="text"
                                />
                                {selectedDate && (
                                    <Button size="small" onClick={() => setSelectedDate(null)} ghost type="primary">
                                        重置為整月檢視
                                    </Button>
                                )}
                            </Space>
                        </Col>
                    </Row>

                    {/* 新增表單 */}
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            await onCreate(e);
                            refreshData(currentViewDate); // 新增完畢刷新數據
                        }}
                        className="expense-form-inline"
                    >
                        <div className="form-row">
                            <select
                                required
                                value={newExpense.category_id || ''}
                                onChange={e => setNewExpense({ ...newExpense, category_id: e.target.value })}
                            >
                                <option value="">選擇分類</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <input
                                required
                                type="date"
                                value={newExpense.expense_date || ''}
                                onChange={e => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                            />
                            <input
                                required
                                type="text"
                                placeholder="項目名稱"
                                value={newExpense.title || ''}
                                onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                            />
                            <input
                                required
                                type="number"
                                placeholder="金額"
                                className="w-small"
                                value={newExpense.amount || ''}
                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                            />
                            <button type="submit" className="btn-add-main" style={{ background: '#ec4899' }}>新增支出</button>
                        </div>
                    </form>
                </div>

                

                <Spin spinning={loading}>
                    <StatRow items={[
                        {
                            icon: History,
                            label: selectedDate ? `${selectedDate.format('MM/DD')} 項目數` : `${currentViewDate.format('M')}月項目數`,
                            value: filteredExpenses.length,
                            unit: "筆",
                            colorStyle: { background: '#fdf2f8', color: '#ec4899' }
                        },
                        {
                            icon: DollarSign,
                            label: selectedDate ? `${selectedDate.format('MM/DD')} 總金額` : `${currentViewDate.format('M')}月總金額`,
                            value: filteredExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0),
                            unit: "元",
                            colorStyle: { background: '#fdf2f8', color: '#ec4899' }
                        }
                    ]} />
                </Spin>
                {/* 趨勢圖 */}
                <div className="chart-container" style={{ background: '#fff', padding: '24px', marginTop: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div className="chart-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} style={{ color: '#ec4899' }} />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>月度支出對比</h3>
                    </div>
                    <div style={{ width: '100%', height: '50vh' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#fdf2f8' }} />
                                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.month === currentViewDate.format('YYYY-MM') ? '#ec4899' : '#fbcfe8'} />
                                    ))}
                                    <LabelList dataKey="total" position="top" formatter={(val) => `$${val.toLocaleString()}`} style={{ fill: '#be185d', fontSize: 11 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 日曆與表格 */}
                <Row gutter={[24, 24]} align="stretch" style={{ marginTop: '24px' }}>
                    <Col xs={24} lg={10}>
                        <Card
                            style={{ height: '100%' }}
                            title={<Space><CalendarIcon size={18} style={{ color: '#ec4899' }} /> 每日總計 (點擊日期篩選)</Space>}
                            className="expense-calendar-card"
                        >
                            <Calendar
                                fullscreen={false}
                                headerRender={() => null} // 隱藏日曆內建 Header
                                value={selectedDate || currentViewDate}
                                cellRender={cellRender}
                                onSelect={(date) => {
                                    if (date.month() !== currentViewDate.month()) {
                                        // 點到非本月日期時，切換月份
                                        setCurrentViewDate(date);
                                    } else {
                                        // 點到本月日期，則過濾表格
                                        setSelectedDate(date);
                                    }
                                }}
                            />
                        </Card>
                    </Col>

                    <Col l={24} lg={13}>
                        <Card
                            style={{ height: '100%' }}
                            title={
                                <Space>
                                    <ListFilter size={18} style={{ color: '#ec4899' }} />
                                    {selectedDate
                                        ? `${selectedDate.format('YYYY-MM-DD')} 支出明細`
                                        : `${currentViewDate.format('YYYY-MM')} 月度明細`}
                                </Space>
                            }
                        >
                            <Table
                                dataSource={filteredExpenses}
                                columns={columns}
                                rowKey="id"
                                loading={loading}
                                pagination={{ pageSize: 6, position: ['bottomCenter'] }}
                                scroll={{ x: 'max-content' }}
                                size="small"
                            />
                        </Card>
                    </Col>
                </Row>

                
            </Card>
        </section>
    );
};

export default ExpenseSection;