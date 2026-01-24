import { useState } from 'react';
import { useFinanceData } from '../../../hooks/useFinanceData';
import { financeApi } from '../../../services/financeApi';
import DebtSection from './DebtSection';
import ExpenseSection from './ExpenseSection';
import './DebtPanel.css';

const DebtTableApp = () => {
    const { debts, expenses, categories, refreshAll, filterStatus, setFilterStatus, stats, selectedYear, setSelectedYear } = useFinanceData();
    
    // 表單暫存狀態
    const [newDebt, setNewDebt] = useState({ title: '', total_amount: '' });
    const [newExpense, setNewExpense] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        title: '', amount: '', category_id: ''
    });
    const [activeTab, setActiveTab] = useState('debt');

    const handleCreateDebt = async (e) => {
        e.preventDefault();
        await financeApi.createDebt(newDebt);
        setNewDebt({ title: '', total_amount: '' });
        refreshAll(); // 重新整理
    };

    const handleAddPayment = async (debtId, paymentData) => {
        await financeApi.addPayment(debtId, paymentData);
        refreshAll();
    };

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        await financeApi.createExpense(newExpense);
        setNewExpense({ ...newExpense, title: '', amount: '' });
        refreshAll();
    };

    return (
        <div className="container">
            {/* 模組切換導覽列 */}
            <div className="finance-main-nav">
                <button 
                    className={`nav-btn ${activeTab === 'debt' ? 'active' : ''}`}
                    onClick={() => setActiveTab('debt')}
                >
                    債務管理
                </button>
                <button 
                    className={`nav-btn ${activeTab === 'expense' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    支出紀錄
                </button>
            </div>

            {/* 條件渲染：根據 activeTab 決定顯示哪個組件 */}
            <div className="finance-content-area">
                {activeTab === 'debt' ? (
                    <DebtSection 
                        debts={debts} 
                        newDebt={newDebt} 
                        setNewDebt={setNewDebt}
                        onCreate={handleCreateDebt} 
                        onAddPayment={handleAddPayment} 
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                    />
                ) : (
                    <ExpenseSection 
                        expenses={expenses} 
                        categories={categories} 
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        newExpense={newExpense}
                        setNewExpense={setNewExpense}
                        onCreate={handleCreateExpense}
                        stats={stats}
                    />
                )}
            </div>
        </div>
    );
};

export default DebtTableApp;