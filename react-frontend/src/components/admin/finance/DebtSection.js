import React, { useState } from 'react';
import { History, DollarSign, ChevronUp, ChevronDown, CheckCircle2, TrendingDown } from 'lucide-react';

const DebtSection = ({ debts = [], newDebt, setNewDebt, onCreate, onAddPayment, filterStatus, setFilterStatus }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    const safeDebts = Array.isArray(debts) ? debts : [];
    const totalRemaining = safeDebts.reduce((acc, d) => acc + (Number(d.current_balance) || 0), 0);

    const handlePaymentSubmit = async (debtId) => {
        if (!paymentData.amount) return;
        await onAddPayment(debtId, paymentData);
        setPaymentData({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    };

    // 根據百分比取得樣式配置
    const getProgressConfig = (percent) => {
        if (percent >= 100) return { color: '#22c55e', label: '已完款', bg: 'bg-green-50' }; // 100% 綠色
        if (percent >= 80) return { color: '#3b82f6', label: '即將完成', bg: 'bg-blue-50' };  // 80% 藍色
        if (percent >= 60) return { color: '#8b5cf6', label: '過半里程', bg: 'bg-purple-50' }; // 60% 紫色
        if (percent >= 40) return { color: '#f59e0b', label: '持續努力', bg: 'bg-amber-50' };  // 40% 橙色
        if (percent >= 20) return { color: '#f97316', label: '剛起步', bg: 'bg-orange-50' };   // 20% 橘色
        return { color: '#ef4444', label: '初始階段', bg: 'bg-red-50' };                      // <20% 紅色
    };

    return (
        <section className="debt-page-container">
            {/* Header & Stats 保持一致 */}
            <div className="debt-header-section">
                <h1>財務債務管理中心</h1>
                <form onSubmit={onCreate} className="debt-form-inline">
                    <div className="form-row">
                        <input type="text" placeholder="債務名稱" value={newDebt.title || ''} onChange={e => setNewDebt({ ...newDebt, title: e.target.value })} />
                        <input type="number" placeholder="總金額" value={newDebt.total_amount || ''} onChange={e => setNewDebt({ ...newDebt, total_amount: e.target.value })} />
                        <button type="submit" className="btn-add-main">新增項目</button>
                    </div>
                </form>
            </div>

            {/* 統計與篩選列 */}
            <div className="finance-summary-grid">
                <div className="stat-card">
                    <TrendingDown className="text-red" />
                    <div>
                        <p className="label">剩餘總負債</p>
                        <p className="value">${totalRemaining.toLocaleString()}</p>
                    </div>
                </div>
                <div className="filter-pills">
                    {['all', 'active', 'paid'].map(s => (
                        <button key={s} className={`pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                            {s === 'all' ? '全部' : s === 'active' ? '待還款' : '已結清'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 債務卡片清單 */}
            <div className="debt-cards-stack">
                {safeDebts.map((debt) => {
                    const progress = Math.min(100, Math.round(((debt.total_amount - debt.current_balance) / debt.total_amount) * 100));
                    const config = getProgressConfig(progress);

                    return (
                        <div key={debt.id} className={`debt-progress-card ${expandedId === debt.id ? 'expanded' : ''}`}>
                            <div className="card-main" onClick={() => setExpandedId(expandedId === debt.id ? null : debt.id)}>
                                <div className="card-info">
                                    <div className="title-area">
                                        <span className="debt-icon" style={{ backgroundColor: config.color }}>
                                            {progress === 100 ? <CheckCircle2 size={18} /> : <DollarSign size={18} />}
                                        </span>
                                        <div>
                                            <h3>{debt.title}</h3>
                                            <p className="subtitle">剩餘金額: ${debt.current_balance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="progress-area">
                                        <div className="progress-label">
                                            <span>{config.label}</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="progress-bar-outer">
                                            <div className="progress-bar-inner" style={{ width: `${progress}%`, backgroundColor: config.color }}></div>
                                        </div>
                                    </div>
                                    <div className="action-toggle">
                                        {expandedId === debt.id ? <ChevronUp /> : <ChevronDown />}
                                    </div>
                                </div>
                            </div>

                            {/* 展開的詳細細節 (還款表單與歷史) */}
                            {expandedId === debt.id && (
                                <div className="card-details">
                                    <div className="details-grid">
                                        <div className="payment-box">
                                            <h4>快速還款</h4>
                                            <div className="inline-form">
                                                <input type="number" placeholder="金額" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} />
                                                <input type="date" value={paymentData.date} onChange={e => setPaymentData({ ...paymentData, date: e.target.value })} />
                                                <button onClick={() => handlePaymentSubmit(debt.id)}>確認送出</button>
                                            </div>
                                        </div>
                                        <div className="history-box">
                                            <h4>歷史明細</h4>
                                            <div className="scroll-history">
                                                {debt.payments?.map(p => (
                                                    <div key={p.id} className="history-item">
                                                        <span>{p.payment_date?.split(' ')[0]}</span>
                                                        <span className="note">{p.note || '還款'}</span>
                                                        <span className="amount">-${p.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default DebtSection;