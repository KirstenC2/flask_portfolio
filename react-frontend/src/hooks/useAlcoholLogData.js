import { useState, useEffect, useMemo, useCallback } from 'react';
import { healthService } from '../services/healthApi';
import { message } from 'antd';

export const useAlcoholLogData = (initialMode = 'monthly') => {
    const [logs, setLogs] = useState([]);
    const [sobriety, setSobriety] = useState({ days_count: 0, encouragement: {} });
    const [viewMode, setViewMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);

    // 核心：抓取所有數據
    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const [logsData, sobrietyData] = await Promise.all([
                healthService.getLogs(viewMode),
                healthService.getSobrietyStatus()
            ]);
            setLogs(logsData);
            setSobriety(sobrietyData);
        } catch (err) {
            message.error("數據同步失敗");
        } finally {
            setLoading(false);
        }
    }, [viewMode]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // 統計計算
    const stats = useMemo(() => {
        const totalGrams = logs.reduce((sum, log) => sum + parseFloat(log.grams || 0), 0);
        return { totalGrams: totalGrams.toFixed(1), count: logs.length };
    }, [logs]);

    // 操作方法
    const saveLog = async (id, payload) => {
        try {
            if (id) await healthService.updateLog(id, payload);
            else await healthService.createLog(payload);
            await refreshData(); // 儲存後自動刷新天數與清單
            return true;
        } catch (err) {
            message.error("儲存失敗");
            return false;
        }
    };

    const removeLog = async (id) => {
        try {
            await healthService.deleteLog(id);
            await refreshData();
            return true;
        } catch (err) {
            message.error("刪除失敗");
            return false;
        }
    };

    return { 
        logs, sobriety, viewMode, setViewMode, 
        loading, stats, saveLog, removeLog, refreshData 
    };
};