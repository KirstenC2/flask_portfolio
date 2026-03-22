import { useState, useEffect, useCallback, useMemo } from 'react';
import { financeApi } from '../services/financeApi';

export const useFinanceData = () => {
    const [rawDebts, setRawDebts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [savingGoals, setSavingGoals] = useState([]);
    const [savingHistory, setSavingHistory] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [stats, setStats] = useState({ monthly: [], daily: [] });
    const [filterStatus, setFilterStatus] = useState('all');
    const [recurringExpenses, setRecurringExpenses] = useState([]);
    const filteredDebts = useMemo(() => {
        return rawDebts.filter(debt => {
            const balance = parseFloat(debt.current_balance) || 0;
            if (filterStatus === 'active') return balance > 0;
            if (filterStatus === 'paid') return balance <= 0;
            return true;
        });
    }, [rawDebts, filterStatus]);

    // 2. 核心刷新函數
    const refreshAll = useCallback(async () => {
        try {
            const d = await financeApi.getDebts();
            setRawDebts(Array.isArray(d) ? d : (d?.data || []));

            try {
                const [c, ic, i, sg, dh, recurringExpenses] = await Promise.all([
                    financeApi.getCategories(),
                    financeApi.getIncomeCategories(),
                    financeApi.getIncomes(selectedYear, selectedMonth),
                    financeApi.getSavingGoals(selectedYear, selectedMonth),
                    financeApi.getSavingGoalHistory(selectedYear, selectedMonth),
                    financeApi.getRecurringExpenses(),
                ]);

                // 💡 關鍵修正：統一提取 Data 並直接更新 State
                const categoryList = Array.isArray(c) ? c : (c?.data || []);
                const incomeCategoryList = Array.isArray(ic) ? ic : (ic?.data || []);
                const incomeList = Array.isArray(i) ? i : (i?.data || []);
                const goalList = Array.isArray(sg) ? sg : (sg?.data || []);
                const historyList = Array.isArray(dh) ? dh : (dh?.data || []);
                const recurringList = Array.isArray(recurringExpenses) ? recurringExpenses : (recurringExpenses?.data || []);

                setCategories(categoryList);
                setIncomeCategories(incomeCategoryList);
                setIncomes(incomeList);
                setSavingGoals(goalList);
                setSavingHistory(historyList);
                setRecurringExpenses(recurringList);
            } catch (subErr) {
                console.warn("部分分頁 API 載入失敗", subErr);
            }
        } catch (err) {
            console.error("refreshAll 核心錯誤:", err);
        }
    }, [selectedYear, selectedMonth]);
    // 3. 統計與支出刷新
    const refreshPeriodic = useCallback(async (year, month) => {
        try {
            const [s, e] = await Promise.all([
                financeApi.getExpenseStats(year),
                // 💡 修正：必須傳入 month
                financeApi.getExpenses(year, month)
            ]);
            setStats(s && s.monthly ? s : { monthly: [], daily: [] });
            setExpenses(Array.isArray(e) ? e : []);
        } catch (err) {
            console.error("Periodic Refresh Error:", err);
        }
    }, []);

    // 建立債務
    const createDebt = useCallback(async (debtData) => {
        try {
            await financeApi.createDebt(debtData);
            await refreshAll(); // 成功後自動刷新列表
            return { success: true };
        } catch (err) {
            console.error("建立債務失敗:", err);
            return { success: false, error: err };
        }
    }, [refreshAll]);

    // 新增還款紀錄
    const addPayment = useCallback(async (debtId, paymentData) => {
        try {
            await financeApi.addPayment(debtId, paymentData);
            await refreshAll();
            return { success: true };
        } catch (err) {
            console.error("新增還款失敗:", err);
            return { success: false, error: err };
        }
    }, [refreshAll]);

    // 建立支出
    const createExpense = useCallback(async (expenseData) => {
        try {
            await financeApi.createExpense(expenseData);
            // 支出通常影響統計，所以建議 refreshPeriodic 也要跑
            await refreshAll();
            await refreshPeriodic(selectedYear, selectedMonth);
            return { success: true };
        } catch (err) {
            console.error("建立支出失敗:", err);
            return { success: false, error: err };
        }
    }, [refreshAll, refreshPeriodic, selectedYear, selectedMonth]);

    // 當年份或月份改變時，觸發刷新
    useEffect(() => {
        refreshPeriodic(selectedYear, selectedMonth); // 💡 修正：傳入兩個參數
    }, [selectedYear, selectedMonth, refreshPeriodic]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return {
        debts: filteredDebts,
        rawDebts,
        expenses,
        categories,
        incomes,
        incomeCategories,
        savingGoals,
        savingHistory,
        recurringExpenses,
        stats,
        selectedYear,
        setSelectedYear,
        selectedMonth,      // 已新增
        setSelectedMonth,    // 已新增
        refreshAll,
        createDebt,
        addPayment,
        createExpense,
        setDebts: setRawDebts,
        setExpenses,
        setIncomes,
        setIncomeCategories,
        setSavingGoals,
        setRecurringExpenses,
        filterStatus,
        setFilterStatus
    };
};