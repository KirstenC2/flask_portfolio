import React, { useState } from 'react';
import { History, DollarSign, Calendar, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { StatRow } from './StatRow';

const ExpenseSection = ({
    expenses = [],
    categories = [],
    stats = { monthly: [], daily: [] },
    selectedYear,
    setSelectedYear,
    newExpense = { title: '', amount: '', category_id: '', expense_date: '' },
    setNewExpense,
    onCreate
}) => {
const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // 二次防禦：確保 stats 結構完整
    const safeStats = {
        monthly: Array.isArray(stats?.monthly) ? stats.monthly : [],
        daily: Array.isArray(stats?.daily) ? stats.daily : []
    };

    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const chartData = safeStats.monthly;
    console.log(chartData);
    // 取得在地月份標籤 (如: "2026-01")
    const now = new Date();
    const currentLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 比對當月資料
    const thisMonthData = chartData.find(item => item.month === currentLabel);
    const currentMonthTotal = thisMonthData ? thisMonthData.total : 0;

    // 分頁邏輯
    const totalPages = Math.ceil(safeExpenses.length / itemsPerPage);
    const currentItems = safeExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 累積總支出
    const totalExpense = safeExpenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);

    const statItems = [
        { icon: History, label: "項目總計", value: safeExpenses.length, unit: "筆", colorStyle: { background: '#fdf2f8', color: '#ec4899' } },
        { icon: DollarSign, label: "累積支出", value: totalExpense, unit: "元", colorStyle: { background: '#fdf2f8', color: '#ec4899' } },
        { icon: Calendar, label: "本月支出", value: currentMonthTotal, unit: "元", colorStyle: { background: '#fff7ed', color: '#ea580c' } }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <section>
            <div className="debt-header-section">
                <h1>日常支出紀錄</h1>
                <form onSubmit={onCreate} className="debt-form-inline">
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

            {safeExpenses.length > 0 && <StatRow items={statItems} />}

            {/* 月份對比圖表 */}
            <div className="chart-container" style={{ minHeight: '350px' }}>
                <div className="chart-header">
                    <BarChart3 size={18} />
                    <h3>每月支出趨勢對比</h3>
                    {/* 年份切換選單 */}
                    <div className="year-filter">
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#475569'
                            }}
                        >
                            {years.map(y => <option key={y} value={y}>{y} 年</option>)}
                        </select>
                    </div>
                </div>
                {chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
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
                                            fill={index === chartData.length - 1 ? '#ec4899' : '#fbcfe8'}
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
                ) : (
                    <div className="chart-empty-state">
                        <p>尚無月份統計資料，請新增支出以生成圖表。</p>
                    </div>
                )}
            </div>

            {/* 表格內容 */}
            <div className="table-wrapper">
                <table className="debt-table">
                    <thead>
                        <tr>
                            <th>日期</th>
                            <th>分類</th>
                            <th>項目名稱</th>
                            <th className="text-right">金額</th>
                            <th className="text-center">備註</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((exp) => (
                            <tr key={exp.id}>
                                <td className="text-muted">{exp.expense_date?.split('T')[0]}</td>
                                <td>
                                    <span className="status-tag" style={{ background: '#fce7f3', color: '#be185d', border: 'none' }}>
                                        {exp.category_name || '未分類'}
                                    </span>
                                </td>
                                <td className="col-title">{exp.title}</td>
                                <td className="text-right" style={{ fontWeight: '600', color: '#e11d48' }}>
                                    ${(parseFloat(exp.amount) || 0).toLocaleString()}
                                </td>
                                <td className="text-center text-muted" style={{ fontSize: '0.85rem' }}>{exp.note || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 分頁按鈕 */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="pagination-btn">
                        <ChevronLeft size={18} /> 上一頁
                    </button>
                    <span className="pagination-info">第 <strong>{currentPage}</strong> 頁，共 {totalPages} 頁</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="pagination-btn">
                        下一頁 <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </section>
    );
};

export default ExpenseSection;