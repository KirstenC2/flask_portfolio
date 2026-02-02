import React, { useState, useEffect, useCallback } from 'react';
import { History, DollarSign, BarChart3 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Card, Table, Tag, Typography, DatePicker, Space, Row, Col, Spin } from 'antd';
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

    // 3. 當日期改變或組件加載時觸發
    useEffect(() => {
        fetchMonthlyData(currentViewDate);
    }, [currentViewDate, fetchMonthlyData]);

    // 4. 當外部新增成功後，需要提供一個方法讓外部觸發重新整理
    // 在本例中，如果 onCreate 執行完畢，父組件應該要能通知這裡 refresh
    // 但更簡單的做法是：讓 onCreate 成功後直接在父層透過某些方式觸發更新，
    // 這裡我們假設 onCreate 完後會手動點擊或自動更新 viewDate

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

            {/* 表格明細 */}
            <Card
                title={`${currentViewDate.format('YYYY年MM月')} 支出明細`}
                size="small"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    marginTop: '20px',
                    height: '100%'
                }}
            >
                <Table
                    dataSource={expenses}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 5, position: ['bottomCenter'] }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </section>
    );
};

export default ExpenseSection;