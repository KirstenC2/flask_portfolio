import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { History, DollarSign, BarChart3, Calendar as CalendarIcon, ListFilter } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Card, Table, Tag, Typography, DatePicker, Space, Row, Col, Spin, Calendar } from 'antd';
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
    // 1. 內部 State 管理
    const [currentViewDate, setCurrentViewDate] = useState(dayjs());
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dailySummaries, setDailySummaries] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null); // 💡 新增：儲存選中的日期
    // 2. 獲取數據的邏輯 - 使用 useCallback 避免不必要的重渲染
    const fetchMonthlyData = useCallback(async (date) => {
        setLoading(true);
        try {
            const year = date.year();
            const month = date.month() + 1;
            // 呼叫 API：確保 financeApi.getExpenses 支援傳入 year, month
            const response = await financeApi.getExpenses(year, month);
            // 這裡根據你 API 回傳的格式調整，通常是 response.data 或 response
            setExpenses(Array.isArray(response) ? response : response.data || []);
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDailySummary = useCallback(async (date) => {
        setLoading(true);
        try {
            const year = date.year();
            const month = date.month() + 1;

            // 使用 Promise.all 同步執行，效率更高
            const [expenseList, summaryData] = await Promise.all([
                financeApi.getExpenses(year, month),
                financeApi.getDailySummary(year, month)
            ]);

            setExpenses(Array.isArray(expenseList) ? expenseList : []);
            setDailySummaries(summaryData || []);
        } catch (error) {
            console.error("Fetch failed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

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
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    const filteredExpenses = useMemo(() => {
        if (!selectedDate) return expenses;
        const dateStr = selectedDate.format('YYYY-MM-DD');
        return expenses.filter(e => e.expense_date.split('T')[0] === dateStr);
    }, [expenses, selectedDate]);

    // 3. 當日期改變或組件加載時觸發
    useEffect(() => {
        fetchMonthlyData(currentViewDate);
    }, [currentViewDate, fetchMonthlyData]);

    // 4. 當外部新增成功後，需要提供一個方法讓外部觸發重新整理
    // 在本例中，如果 onCreate 執行完畢，父組件應該要能通知這裡 refresh
    // 但更簡單的做法是：讓 onCreate 成功後直接在父層透過某些方式觸發更新，
    // 這裡我們假設 onCreate 完後會手動點擊或自動更新 viewDate
    // 💡 日曆格子的自定義渲染
    const dateCellRender = (value) => {
        // 只顯示目前檢視月份的金額，避免重疊
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

    useEffect(() => {
        refreshData(currentViewDate);
    }, [currentViewDate, refreshData]);
    // Table 欄位定義
    const columns = [
        {
            title: '日期',
            dataIndex: 'expense_date',
            key: 'date',
            width: 120,
            render: (text) => <Text type="secondary">{text?.split('T')[0]}</Text>,
            sorter: (a, b) => new Date(a.expense_date) - new Date(b.expense_date),
        },
        {
            title: '分類',
            dataIndex: 'category_name',
            key: 'category',
            width: 120,
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
            width: 120,
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

                <Title level={2} style={{ margin: 0, padding: '20px 0px 20px 0px' }}>日常支出紀錄</Title>
                {/* Header 與 月份切換 */}
                <div className="expense-header-section">

                    <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                        <Col>
                            <Space align="center">
                                <Text strong>檢視月份：</Text>
                                <DatePicker
                                    picker="month"
                                    value={currentViewDate}
                                    onChange={(date) => date && setCurrentViewDate(date)}
                                    allowClear={false}
                                    inputReadOnly // 避免手機端跳出鍵盤
                                />
                            </Space>
                        </Col>
                    </Row>

                    {/* 新增表單 */}
                    <form onSubmit={onCreate} className="expense-form-inline">
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

                {/* 統計數值 - 根據目前抓到的 expenses 即時計算 */}
                <Spin spinning={loading}>
                    <StatRow items={[
                        {
                            icon: History,
                            label: `${currentViewDate.format('M')}月項目數`,
                            value: expenses.length,
                            unit: "筆",
                            colorStyle: { background: '#fdf2f8', color: '#ec4899' }
                        },
                        {
                            icon: DollarSign,
                            label: `${currentViewDate.format('M')}月總金額`,
                            value: expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0),
                            unit: "元",
                            colorStyle: { background: '#fdf2f8', color: '#ec4899' }
                        }
                    ]} />
                </Spin>

                {/* 圖表 */}
                {/* <Card title={<Space><BarChart3 size={18} /> 年度每月趨勢</Space>} style={{ marginBottom: '24px', borderRadius: '12px' }}> */}
                {/* 圖表區塊 - 修正後的 CSS */}
                <div className="chart-container" style={{
                    background: '#fff',
                    padding: '24px',
                    marginBottom: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    minHeight: '350px' // 確保加載時高度不會塌陷
                }}>
                    <div className="chart-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={18} style={{ color: '#ec4899' }} />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>每月支出趨勢對比</h3>
                    </div>

                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10} // 微調標籤位移
                                />
                                <YAxis hide domain={[0, 'auto']} />
                                <Tooltip
                                    cursor={{ fill: '#fdf2f8' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.month === currentViewDate.format('YYYY-MM') ? '#ec4899' : '#fbcfe8'}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="total"
                                        position="top"
                                        formatter={(val) => `$${val.toLocaleString()}`}
                                        style={{ fill: '#be185d', fontSize: 11, fontWeight: 600 }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                    {/* 💡 左側：月度花費日曆概覽 */}
                    <Col xs={24} lg={10}>
                        <Card 
                            title={<Space><CalendarIcon size={18} style={{ color: '#ec4899' }} /> 每日總覽 (點擊查看詳情)</Space>}
                            style={{ borderRadius: '12px', height: '100%' }}
                            className="expense-calendar-card"
                        >
                            <Calendar 
                                fullscreen={false} 
                                headerRender={() => null}
                                value={selectedDate || currentViewDate}
                                cellRender={dateCellRender}
                                onSelect={(date) => {
                                    // 如果點擊的是不同月份，則切換月份
                                    if (date.month() !== currentViewDate.month()) {
                                        setCurrentViewDate(date);
                                    } else {
                                        // 點擊當月日期則切換篩選
                                        setSelectedDate(date);
                                    }
                                }}
                            />
                        </Card>
                    </Col>

                    {/* 💡 右側：支出明細表格 */}
                    <Col xs={24} lg={14}>
                        <Card
                            title={
                                <Space>
                                    <ListFilter size={18} style={{ color: '#ec4899' }} />
                                    {selectedDate 
                                        ? `${selectedDate.format('YYYY-MM-DD')} 每日明細` 
                                        : `${currentViewDate.format('YYYY-MM')} 月度全明細`}
                                </Space>
                            }
                            style={{ borderRadius: '12px', height: '100%' }}
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