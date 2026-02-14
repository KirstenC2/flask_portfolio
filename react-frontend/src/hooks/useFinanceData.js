import { useState, useEffect, useCallback, useMemo } from 'react';
import { financeApi } from '../services/financeApi';

export const useFinanceData = () => {
    const [rawDebts, setRawDebts] = useState([]); // 改名避免與 filteredDebts 衝突
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [stats, setStats] = useState({ monthly: [], daily: [] });
    const [filterStatus, setFilterStatus] = useState('all');

    // 1. 強健的過濾邏輯
    const filteredDebts = useMemo(() => {
        return rawDebts.filter(debt => {
            const balance = parseFloat(debt.current_balance) || 0;
            if (filterStatus === 'active') return balance > 0;
            if (filterStatus === 'paid') return balance <= 0;
            return true; // 'all'
        });
    }, [rawDebts, filterStatus]);

    // 2. 核心刷新函數
    const refreshAll = useCallback(async () => {
        try {
            console.log("開始執行 refreshAll...");
            
            // 1. 先抓債務，確保它不被其他失敗的 API 影響
            const d = await financeApi.getDebts();
            const debtData = Array.isArray(d) ? d : (d?.data || []);
            setRawDebts(debtData);

            // 2. 其他 API 用個別處理，或者暫時註解掉
            // 如果 categories 或 expenses 還沒準備好，不要讓它們擋住 debts
            try {
                const [c] = await Promise.all([
                    financeApi.getCategories(),
                    // financeApi.getExpenses(selectedYear), // 如果沒寫好先註解
                ]);
                setCategories(Array.isArray(c) ? c : []);
                console.log("API 原始回傳的 Category:", c);
            } catch (subErr) {
                console.warn("部分 API 載入失敗，但不影響債務顯示", subErr);
            }

        } catch (err) {
            console.error("refreshAll 核心錯誤:", err);
        }
    }, [selectedYear]);

    // 3. 統計與支出刷新 (年份改變時觸發)
    const refreshPeriodic = useCallback(async (year) => {
        try {
            const [s, e] = await Promise.all([
                financeApi.getExpenseStats(year),
                financeApi.getExpenses(year)
            ]);
            setStats(s && s.monthly ? s : { monthly: [], daily: [] });
            setExpenses(Array.isArray(e) ? e : []);
        } catch (err) {
            console.error("Periodic Refresh Error:", err);
        }
    }, []);

    useEffect(() => {
        refreshPeriodic(selectedYear);
    }, [selectedYear, refreshPeriodic]);

    // 初始載入
    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return {
        // 修正：這裡要傳 filteredDebts 給 UI
        debts: filteredDebts, 
        rawDebts,            
        expenses, 
        categories, 
        stats, 
        selectedYear, 
        setSelectedYear, 
        refreshAll, 
        setDebts: setRawDebts, 
        setExpenses, 
        filterStatus, 
        setFilterStatus 
    };
};