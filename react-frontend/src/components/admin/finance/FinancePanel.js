import React, { useState } from 'react';
import { Tabs, Dropdown, Space, ConfigProvider } from 'antd';
import {
    SettingOutlined, TagOutlined,
    BankOutlined, WalletOutlined,
    DownOutlined, DollarCircleOutlined
} from '@ant-design/icons';
import { useFinanceData } from '../../../hooks/useFinanceData';
import { financeApi } from '../../../services/financeApi';
import DebtSection from './DebtSection';
import ExpenseSection from './ExpenseSection';
import ExpenseCategorySection from './ExpenseCategorySection';
import IncomeSection from './IncomeSection';
import './styles/DebtPanel.css';

const FinancePanel = () => {
    const {
        debts, categories, refreshAll,
        filterStatus, setFilterStatus, stats,
        selectedYear, setSelectedYear,
        incomes, setIncomes,
        incomeCategories, setIncomeCategories
    } = useFinanceData();

    const [newDebt, setNewDebt] = useState({ title: '', total_amount: '' });
    const [newExpense, setNewExpense] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        title: '', amount: '', category_id: ''
    });

    const [activeTab, setActiveTab] = useState('debt');

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

    // --- 下拉選單項目定義 ---
    const managementItems = [
        {
            key: 'category-mgmt',
            label: '支出類別管理',
            icon: <TagOutlined />,
            onClick: () => setActiveTab('category-mgmt'),
        }
    ];

    // --- 分頁與組件對照表 ---
    // 將標籤與內容邏輯完全分離
    const tabComponents = {
        'debt': (
            
            <DebtSection
                debts={debts} // 這裡傳入的是 Hook 過濾後的 filteredDebts
                newDebt={newDebt}
                setNewDebt={setNewDebt}
                onCreate={handleCreateDebt}
                onAddPayment={async (id, data) => {
                    await financeApi.addPayment(id, data);
                    refreshAll();
                }}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
            />
        ),
        'expense': (
            <ExpenseSection
                // expenses={expenses}
                categories={categories}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                newExpense={newExpense}
                setNewExpense={setNewExpense}
                onCreate={handleCreateExpense}
                stats={stats}
            />
        ),
        'income': (
            <IncomeSection
                incomes={incomes}
                incomeCategories={incomeCategories}
            />
        ),
        'category-mgmt': (
            <ExpenseCategorySection
                categories={categories}
                refreshAll={refreshAll}
            />
        )
    };

    // Tabs 條上要顯示的標籤項目 (排除掉管理分頁，管理分頁由下拉選單觸發)
    const navItems = [
        {
            key: 'debt',
            label: (
                <span>
                    <BankOutlined /> 債務管理
                </span>
            ),
        },
        {
            key: 'expense',
            label: (
                <span>
                    <WalletOutlined /> 支出紀錄
                </span>
            ),
        },
        {
            key: 'income',
            label: (
                <span>
                    <DollarCircleOutlined /> 收入管理
                </span>
            ),
        }
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#5ec2c2',
                    borderRadius: 8,
                },
            }}
        >
            <div className="container" style={{ padding: '20px' }}>
                {/* 導覽列容器 */}
                <div className="finance-nav-wrapper" style={{
                    background: '#fff',
                    padding: '0 20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key)}
                        items={navItems}
                        size="large"
                        tabBarExtraContent={
                            <Dropdown menu={{ items: managementItems }} placement="bottomRight">
                                <span
                                    className={`mgmt-dropdown-trigger ${activeTab === 'category-mgmt' ? 'active' : ''}`}
                                    style={{
                                        color: activeTab === 'category-mgmt' ? '#5ec2c2' : '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '12px 0',
                                        fontWeight: activeTab === 'category-mgmt' ? '600' : 'normal'
                                    }}
                                >
                                    <SettingOutlined />
                                    管理
                                    <DownOutlined style={{ fontSize: '10px' }} />
                                </span>
                            </Dropdown>
                        }
                    />
                </div>

                {/* 獨立的內容顯示區 (確保唯一來源) */}
                <div className="finance-content-area" style={{ marginTop: '20px' }}>
                    {tabComponents[activeTab]}
                </div>
            </div>
        </ConfigProvider>
    );
};

export default FinancePanel;