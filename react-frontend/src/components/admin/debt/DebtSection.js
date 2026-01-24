import React, { useState } from 'react'; // 必須導入 useState
import { History, DollarSign, ChevronUp } from 'lucide-react';

const DebtSection = ({
    debts = [],
    newDebt,
    setNewDebt,
    onCreate,      // 對應父層的 handleCreateDebt
    onAddPayment,   // 對應父層的 handleAddPayment
    filterStatus,
    setFilterStatus
}) => {
    // 1. 內部狀態管理
    const [expandedId, setExpandedId] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    // 2. 安全計算 (防止 debts 為 undefined)
    const safeDebts = Array.isArray(debts) ? debts : [];

    const totalRemaining = safeDebts.reduce((acc, d) => acc + (Number(d.current_balance) || 0), 0);

    // 3. 處理還款送出
    const handlePaymentSubmit = async (debtId) => {
        if (!paymentData.amount) return;
        await onAddPayment(debtId, paymentData);
        // 清空還款表單
        setPaymentData({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    };

    return (
        <section>

            <div className="debt-header-section">
                <h1>財務債務清單</h1>

                <form onSubmit={onCreate} className="debt-form-inline">
                    <div className="form-row">
                        <input
                            type="text" placeholder="債務名稱"
                            value={newDebt.title || ''}
                            onChange={e => setNewDebt({ ...newDebt, title: e.target.value })}
                        />
                        <input
                            type="number" placeholder="金額"
                            className="w-small"
                            value={newDebt.total_amount || ''}
                            onChange={e => setNewDebt({ ...newDebt, total_amount: e.target.value })}
                        />
                        <button type="submit" className="btn-add-main">新增項目</button>
                    </div>
                </form>
            </div>
            <div className="filter-bar">
                <button
                    className={filterStatus === 'all' ? 'active' : ''}
                    onClick={() => setFilterStatus('all')}
                >全部</button>
                <button
                    className={filterStatus === 'active' ? 'active' : ''}
                    onClick={() => setFilterStatus('active')}
                >待還款</button>
                <button
                    className={filterStatus === 'paid' ? 'active' : ''}
                    onClick={() => setFilterStatus('paid')}
                >已結清</button>
            </div>

            {safeDebts.length > 0 && (
                <div className="stat-row">
                    <div className="stat-item-card">
                        <div className="stat-icon-wrapper">
                            <History size={20} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">債務項目數量</p>
                            <p className="stat-value">{safeDebts.length} <span className="stat-unit">筆</span></p>
                        </div>
                    </div>

                    <div className="stat-item-card">
                        <div className="stat-icon-wrapper secondary">
                            <DollarSign size={20} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">剩餘總負債</p>
                            <p className="stat-value">
                                {totalRemaining.toLocaleString()}
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
                        {safeDebts.map((debt) => (
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
                                                                value={paymentData.amount}
                                                                onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                                            />
                                                            <input
                                                                type="date"
                                                                value={paymentData.date}
                                                                onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                                            />
                                                        </div>
                                                        <input
                                                            type="text" placeholder="備註"
                                                            value={paymentData.note}
                                                            onChange={e => setPaymentData({ ...paymentData, note: e.target.value })}
                                                        />
                                                        <button onClick={() => handlePaymentSubmit(debt.id)} className="btn-submit-payment">
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
                                                                {debt.payments && debt.payments.map(p => (
                                                                    <tr key={p.id}>
                                                                        <td>{p.payment_date?.split(' ')[0]}</td>
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
        </section>
    );
};

export default DebtSection;