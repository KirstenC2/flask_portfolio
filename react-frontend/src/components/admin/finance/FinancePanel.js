import React, { useState } from 'react';
import { useFinanceData } from '../../../hooks/useFinanceData';
import { financeApi } from '../../../services/financeApi';
import DebtSection from './DebtSection';
import ExpenseSection from './ExpenseSection';
import ExpenseCategorySection from './ExpenseCategorySection'; // 記得引入這個新組件
import './DebtPanel.css';
import './topnav.css';
import { Dropdown } from 'antd';
import { SettingOutlined, TagOutlined, UserOutlined } from '@ant-design/icons';

const FinancePanel = () => {
    const { 
        debts, expenses, categories, refreshAll, 
        filterStatus, setFilterStatus, stats, 
        selectedYear, setSelectedYear 
    } = useFinanceData();

    // 表單暫存狀態
    const [newDebt, setNewDebt] = useState({ title: '', total_amount: '' });
    const [newExpense, setNewExpense] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        title: '', amount: '', category_id: ''
    });
    
    // 目前活動的標籤：'debt', 'expense', 'category-mgmt'
    const [activeTab, setActiveTab] = useState('debt');

    // 下拉選單項目定義
    const managementItems = [
        {
            key: 'category',
            label: '支出類別管理',
            icon: <TagOutlined />,
            onClick: () => setActiveTab('category-mgmt'),
        }
    ];

    // --- Action Handlers ---
    const handleCreateDebt = async (e) => {
        e.preventDefault();
        await financeApi.createDebt(newDebt);
        setNewDebt({ title: '', total_amount: '' });
        refreshAll();
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

    // --- 渲染內容判斷 ---
    const renderContent = () => {
        switch (activeTab) {
            case 'debt':
                return (
                    <DebtSection
                        debts={debts}
                        newDebt={newDebt}
                        setNewDebt={setNewDebt}
                        onCreate={handleCreateDebt}
                        onAddPayment={handleAddPayment}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                    />
                );
            case 'expense':
                return (
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
                );
            case 'category-mgmt':
                return (
                    <ExpenseCategorySection 
                        categories={categories} 
                        refreshAll={refreshAll} 
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="container">
            {/* 模組切換導覽列 */}
            <div className="finance-main-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

                {/* 後台管理下拉菜單 */}
                <Dropdown menu={{ items: managementItems }} placement="bottomRight">
                    <button
                        className={`nav-btn ${activeTab === 'category-mgmt' ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <SettingOutlined />
                        管理
                    </button>
                </Dropdown>
            </div>

            {/* 主要內容顯示區 */}
            <div className="finance-content-area" style={{ marginTop: '20px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default FinancePanel;