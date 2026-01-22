import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, DollarSign, ChevronDown, ChevronUp, History } from 'lucide-react';
import '../../../common/global.css';
import './DebtPanel.css';

const API_BASE = "http://localhost:5001/api/debt";

const DebtTableApp = () => {
  const [debts, setDebts] = useState([]);
  const [newDebt, setNewDebt] = useState({ title: '', total_amount: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  const fetchDebts = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setDebts(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchDebts(); }, []);

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
    <div className="debt-container">
      <div className="debt-header-section">
        <h1>財務債務清單</h1>
        <form onSubmit={handleCreateDebt} className="debt-form-inline">
          <div className="form-row">
            <input 
                type="text" placeholder="債務名稱" 
                value={newDebt.title}
                onChange={e => setNewDebt({...newDebt, title: e.target.value})}
            />
            <input 
                type="number" placeholder="金額" 
                className="w-small"
                value={newDebt.total_amount}
                onChange={e => setNewDebt({...newDebt, total_amount: e.target.value})}
            />
            <button type="submit" className="btn-add-main">新增項目</button>
          </div>
        </form>
      </div>

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
                      {expandedId === debt.id ? <><ChevronUp size={16}/> 收合</> : <><History size={16}/> 還款紀錄</>}
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
                                value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                              />
                              <input 
                                type="date" 
                                value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})}
                              />
                            </div>
                            <input 
                              type="text" placeholder="備註" 
                              value={paymentData.note} onChange={e => setPaymentData({...paymentData, note: e.target.value})}
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
                                    <td>{p.payment_date.split('T')[0]}</td>
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
    </div>
  );
};

export default DebtTableApp;