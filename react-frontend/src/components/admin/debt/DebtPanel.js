import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, DollarSign, ChevronDown, ChevronUp, History } from 'lucide-react';
import '../../../common/global.css';
import './DebtPanel.css';

const API_BASE = "http://localhost:5001/api/debt";
const EXPENSE_API = "http://localhost:5001/api/admin/expenses";
const CATEGORY_API = "http://localhost:5001/api/admin/expense-categories";
const PAYMENTS_PER_PAGE = 5;
const DebtTableApp = () => {
    const [debts, setDebts] = useState([]);
    const [newDebt, setNewDebt] = useState({ title: '', total_amount: '' });
    const [expandedId, setExpandedId] = useState(null);
    const [paymentData, setPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    // --- New Expense States ---
    const [expenses, setExpenses] = useState([]); // Ensure this is []
    const [categories, setCategories] = useState([]); // Ensure this is []
    const [newExpense, setNewExpense] = useState({
        title: '',
        amount: '',
        category_id: '',
        expense_date: new Date().toISOString().split('T')[0]
    });
    const fetchDebts = async () => {
        try {
            const res = await fetch(API_BASE);
            const data = await res.json();
            setDebts(data);
        } catch (err) { console.error(err); }
    };


    useEffect(() => {
        fetchData();
        fetchDebts();
    }, []);

    const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
    const fetchData = async () => {
        // Get the token from storage
        const token = localStorage.getItem('adminToken');
        const headers = {
            'Authorization': `Bearer ${token}`
        };

        try {
            // 1. Fetch Expenses
            const resExp = await fetch(EXPENSE_API, { headers });
            const dataExp = await resExp.json();
            setExpenses(Array.isArray(dataExp) ? dataExp : []);

            // 2. Fetch Categories
            const resCat = await fetch(CATEGORY_API, { headers });
            const dataCat = await resCat.json();
            setCategories(Array.isArray(dataCat) ? dataCat : []);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.title || !newExpense.amount || !newExpense.category_id) return;

        const token = localStorage.getItem('adminToken');

        await fetch(EXPENSE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Added this
            },
            body: JSON.stringify(newExpense),
        });
        setNewExpense({ title: '', amount: '', category_id: '', expense_date: new Date().toISOString().split('T')[0] });
        fetchData();
    };
    // 當展開不同的債務時，重置分頁到第一頁
    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
        setCurrentPaymentPage(1);
    };

    // 處理還款分頁邏輯
    const getPaginatedPayments = (payments) => {
        const startIndex = (currentPaymentPage - 1) * PAYMENTS_PER_PAGE;
        return payments.slice(startIndex, startIndex + PAYMENTS_PER_PAGE);
    };
    // 新增債務 API 調用
    const handleCreateDebt = async (e) => {
        e.preventDefault();
        if (!newDebt.title || !newDebt.total_amount) return;
        await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDebt),
        });
        setNewDebt({ title: '', total_amount: '' });
        fetchDebts();
    };

    const handleAddPayment = async (debtId) => {
        await fetch(`${API_BASE}/${debtId}/payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData),
        });
        setPaymentData({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
        fetchDebts();
    };

    return (
        <div className="container">
            <div className="debt-header-section">
                <h1>財務債務清單</h1>
                <form onSubmit={handleCreateDebt} className="debt-form-inline">
                    <div className="form-row">
                        <input
                            type="text" placeholder="債務名稱"
                            value={newDebt.title}
                            onChange={e => setNewDebt({ ...newDebt, title: e.target.value })}
                        />
                        <input
                            type="number" placeholder="金額"
                            className="w-small"
                            value={newDebt.total_amount}
                            onChange={e => setNewDebt({ ...newDebt, total_amount: e.target.value })}
                        />
                        <button type="submit" className="btn-add-main">新增項目</button>
                    </div>
                </form>
            </div>
            {debts.length > 0 && (
                <div className="stat-row">
                    <div className="stat-item-card">
                        <div className="stat-icon-wrapper">
                            <History size={20} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">債務項目數量</p>
                            <p className="stat-value">{debts.length} <span className="stat-unit">筆</span></p>
                        </div>
                    </div>

                    {/* 建議可以多加一個總金額顯示，會更完整 */}
                    <div className="stat-item-card">
                        <div className="stat-icon-wrapper secondary">
                            <DollarSign size={20} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">剩餘總負債</p>
                            <p className="stat-value">
                                {debts.reduce((acc, d) => acc + d.current_balance, 0).toLocaleString()}
                                <span className="stat-unit">元</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-wrapper">
                <table className="debt-table">
                    <thead>
                        <tr>
                            <th>項目名稱</th>
                            <th className="text-right">總金額</th>
                            <th className="text-right">剩餘餘額</th>
                            <th>狀態</th>
                            <th className="text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {debts.map((debt) => (
                            <React.Fragment key={debt.id}>
                                <tr className={expandedId === debt.id ? 'row-expanded' : ''}>
                                    <td className="col-title">{debt.title}</td>
                                    <td className="text-right">${debt.total_amount}</td>
                                    <td className="text-right">
                                        <span className={debt.current_balance > 0 ? 'balance-due' : 'balance-paid'}>
                                            ${debt.current_balance}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={debt.current_balance <= 0 ? 'status-tag paid' : 'status-tag pending'}>
                                            {debt.current_balance <= 0 ? '已結清' : '待還款'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <button
                                            onClick={() => setExpandedId(expandedId === debt.id ? null : debt.id)}
                                            className="btn-history"
                                        >
                                            {expandedId === debt.id ? <><ChevronUp size={16} /> 收合</> : <><History size={16} /> 還款紀錄</>}
                                        </button>
                                    </td>
                                </tr>

                                {expandedId === debt.id && (
                                    <tr className="detail-row">
                                        <td colSpan="5">
                                            <div className="detail-container">
                                                <div className="detail-col">
                                                    <h4>新增還款紀錄</h4>
                                                    <div className="payment-form">
                                                        <div className="input-row">
                                                            <input
                                                                type="number" placeholder="金額"
                                                                value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                                            />
                                                            <input
                                                                type="date"
                                                                value={paymentData.date} onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                                            />
                                                        </div>
                                                        <input
                                                            type="text" placeholder="備註"
                                                            value={paymentData.note} onChange={e => setPaymentData({ ...paymentData, note: e.target.value })}
                                                        />
                                                        <button onClick={() => handleAddPayment(debt.id)} className="btn-submit-payment">
                                                            確認送出
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="detail-col">
                                                    <h4>歷史明細</h4>
                                                    <div className="history-list-wrapper">
                                                        <table className="history-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>日期</th>
                                                                    <th>備註</th>
                                                                    <th className="text-right">金額</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {debt.payments.map(p => (
                                                                    <tr key={p.id}>
                                                                        <td>{p.payment_date.split(' ')[0]}</td>
                                                                        <td className="text-muted">{p.note || '-'}</td>
                                                                        <td className="text-right text-success">-${p.amount}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            <hr className="section-divider" style={{ margin: '40px 0', opacity: 0.2 }} />
            {/* --- START EXPENSE SECTION --- */}
            <div className="debt-header-section">
                <h1>日常支出紀錄</h1>
                <form onSubmit={handleCreateExpense} className="debt-form-inline">
                    <div className="form-row">
                        <select
                            value={newExpense.category_id}
                            onChange={e => setNewExpense({ ...newExpense, category_id: e.target.value })}
                        >
                            <option value="">選擇分類</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <input
                            type="text" placeholder="支出項目 (如: 午餐)"
                            value={newExpense.title}
                            onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                        />
                        <input
                            type="number" placeholder="金額"
                            className="w-small"
                            value={newExpense.amount}
                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                        <button type="submit" className="btn-add-main" style={{ background: '#ec4899' }}>
                            新增支出
                        </button>
                    </div>
                </form>
            </div>

            {expenses.length > 0 && (
                <div className="stat-row">
                    <div className="stat-item-card">
                        <div className="stat-icon-wrapper" style={{ background: '#fdf2f8', color: '#ec4899' }}>
                            <History size={20} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">累積支出項目</p>
                            <p className="stat-value">{expenses.length} <span className="stat-unit">筆</span></p>
                        </div>
                    </div>

                    <div className="stat-item-card">
                        <div className="stat-icon-wrapper secondary" style={{ background: '#fdf2f8', color: '#ec4899' }}>
                            <DollarSign size={20} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">總支出金額</p>
                            <p className="stat-value">
                                {expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}
                                <span className="stat-unit">元</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                        {expenses.map((exp) => (
                            <tr key={exp.id}>
                                <td className="text-muted">{exp.expense_date.split('T')[0]}</td>
                                <td>
                                    <span className="status-tag" style={{ background: '#fce7f3', color: '#be185d', border: 'none' }}>
                                        {exp.category_name}
                                    </span>
                                </td>
                                <td className="col-title">{exp.title}</td>
                                <td className="text-right" style={{ fontWeight: '600', color: '#e11d48' }}>
                                    ${exp.amount.toLocaleString()}
                                </td>
                                <td className="text-center text-muted" style={{ fontSize: '0.85rem' }}>
                                    {exp.note || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

    );
};

export default DebtTableApp;