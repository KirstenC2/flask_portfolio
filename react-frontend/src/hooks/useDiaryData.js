import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { diaryApi } from '../services/diaryApi';

export const useDiary = (activeDate) => {
    const [diaries, setDiaries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [displayUrls, setDisplayUrls] = useState({});

    // 獲取數據
    const loadDiaries = useCallback(async (year, month) => {
        setLoading(true);
        try {
            const y = year || dayjs(activeDate).year();
            const m = month || (dayjs(activeDate).month() + 1);
            const result = await diaryApi.fetchDiaries(y, m);
            setDiaries(result.data || []);
        } catch (err) {
            message.error("無法載入日記數據");
        } finally {
            setLoading(false);
        }
    }, [activeDate]);

    // 獲取圖片 URL
    const getImageUrl = useCallback(async (path) => {
        if (!path || displayUrls[path] || path === 'undefined') return;
        try {
            const data = await diaryApi.fetchImageUrl(path);
            if (data.url) setDisplayUrls(prev => ({ ...prev, [path]: data.url }));
        } catch (err) {
            console.error("圖片加載失敗", err);
        }
    }, [displayUrls]);

    // 刪除邏輯
    const removeDiary = async (id) => {
        try {
            await diaryApi.deleteDiary(id);
            message.success("已刪除日記");
            loadDiaries();
            return true;
        } catch (err) {
            message.error("刪除失敗");
            return false;
        }
    };

    return {
        diaries,
        loading,
        displayUrls,
        loadDiaries,
        getImageUrl,
        removeDiary,
        setDiaries
    };
};