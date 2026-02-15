import { useState, useEffect, useCallback, useMemo } from 'react';
import { financeApi } from '../services/financeApi';
import dayjs from 'dayjs'; // 建議引入 dayjs 處理時間比較方便

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
            console.log(`開始執行 refreshAll... (${selectedYear}-${selectedMonth})`);
            
            const d = await financeApi.getDebts();
            setRawDebts(Array.isArray(d) ? d : (d?.data || []));

            try {
                const [c, ic, i, sg, dh] = await Promise.all([
                    financeApi.getCategories(),
                    financeApi.getIncomeCategories(),
                    // 💡 修正：必須傳入兩個參數
                    financeApi.getIncomes(selectedYear, selectedMonth), 
                    financeApi.getSavingGoals(selectedYear, selectedMonth),
                    financeApi.getDepositHistory(selectedYear, selectedMonth),
                ]);
                setCategories(Array.isArray(c) ? c : []);
                setIncomeCategories(Array.isArray(ic) ? ic : []);
                setIncomes(Array.isArray(i) ? i : []);
                setSavingGoals(Array.isArray(sg) ? sg : []);
                setSavingHistory(Array.isArray(dh) ? dh : []);
            } catch (subErr) {
                console.warn("部分分頁 API 載入失敗", subErr);
            }
        } catch (err) {
            console.error("refreshAll 核心錯誤:", err);
        }
    }, [selectedYear, selectedMonth]); // 💡 修正：依賴項必須包含 selectedMonth

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
        stats, 
        selectedYear, 
        setSelectedYear, 
        selectedMonth,      // 已新增
        setSelectedMonth,    // 已新增
        refreshAll, 
        setDebts: setRawDebts, 
        setExpenses, 
        setIncomes,
        setIncomeCategories,
        setSavingGoals,
        filterStatus, 
        setFilterStatus 
    };
};