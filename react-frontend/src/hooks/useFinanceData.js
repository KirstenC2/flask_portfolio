import { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../services/financeApi';

export const useFinanceData = () => {
    const [debts, setDebts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    
    // 1. 初始化年份狀態
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState({ monthly: [], daily: [] });
    const [filterStatus, setFilterStatus] = useState('all');

    // 債務過濾邏輯保持不變
    const filteredDebts = debts.filter(debt => {
        if (filterStatus === 'active') return debt.current_balance > 0;
        if (filterStatus === 'paid') return debt.current_balance <= 0;
        return true;
    });

    // 2. 獨立出獲取統計的函式，並帶入年份參數
    const refreshStats = useCallback(async (year) => {
        try {
            const s = await financeApi.getExpenseStats(year);
            if (s && s.monthly) {
                setStats(s);
            } else {
                setStats({ monthly: [], daily: [] });
            }
        } catch (err) {
            console.error("Stats API Error:", err);
        }
    }, []);

    const refreshExpenses = useCallback(async (year) => {
        try {
            const e = await financeApi.getExpenses(year);
            setExpenses(Array.isArray(e) ? e : []);
        } catch (err) {
            console.error("Expenses API Error:", err);
        }
    }, []);

    const refreshAll = async () => {
        try {
            // refreshAll 初始載入時使用當前 selectedYear
            const [d, e, c, s] = await Promise.all([
                financeApi.getDebts(),
                financeApi.getExpenses(selectedYear),
                financeApi.getCategories(),
                financeApi.getExpenseStats(selectedYear) 
            ]);

            setDebts(Array.isArray(d) ? d : []);
            setExpenses(Array.isArray(e) ? e : []);
            setCategories(Array.isArray(c) ? c : []);
            setStats(s && s.monthly ? s : { monthly: [], daily: [] });
        } catch (err) {
            console.error("API Error:", err);
        }
    };

    // 3. 當年份改變時，只更新統計數據 (圖表)
    useEffect(() => {
        refreshStats(selectedYear);
        refreshExpenses(selectedYear);
    }, [selectedYear, refreshStats, refreshExpenses]);

    // 初始載入
    useEffect(() => { refreshAll(); }, []);

    // 4. 記得回傳 selectedYear 和 setSelectedYear
    return { 
        debts: filteredDebts, 
        expenses, 
        categories, 
        stats, 
        selectedYear, 
        setSelectedYear, 
        refreshAll, 
        setDebts, 
        setExpenses, 
        filterStatus, 
        setFilterStatus 
    };
};