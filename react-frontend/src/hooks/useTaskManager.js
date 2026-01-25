// src/hooks/useTaskManager.js
import { useState, useMemo, useEffect } from 'react';
import { taskApi } from '../services/taskApi';

export const useTaskManager = (feature_id, tasks, onUpdate) => {
    const [filterType, setFilterType] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 1. 過濾與搜尋邏輯
    const filteredTasks = useMemo(() => {
        let result = tasks || [];
        if (filterType === 'active') {
            result = result.filter(t => t.status === 'todo' || t.status === 'doing');
        } else if (filterType === 'done') {
            result = result.filter(t => t.status === 'done');
        } else if (filterType === 'canceled') {
            result = result.filter(t => t.status === 'canceled');
        }

        if (searchQuery.trim()) {
            result = result.filter(t => t.content.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return result;
    }, [tasks, filterType, searchQuery]);

    // 2. 分頁數據計算
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
    const currentTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 3. API 操作封裝
    const handleUpdate = async (taskId, fields) => {
        const res = await taskApi.update(taskId, fields);
        if (res.ok) onUpdate();
    };

    const handleAdd = async (taskData) => {
        const res = await taskApi.create(feature_id, taskData);
        if (res.ok) {
            onUpdate();
            setCurrentPage(1);
            return true; // 回傳成功以便 UI 重置輸入框
        }
        return false;
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm("確定刪除？")) return;
        const res = await taskApi.delete(taskId);
        if (res.ok) {
            onUpdate();
            if (currentTasks.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
        }
    };

    // 切換過濾/搜尋時重置頁碼
    useEffect(() => { setCurrentPage(1); }, [filterType, searchQuery]);

    return {
        tasks: { currentTasks, filteredTasks, totalPages },
        params: { filterType, setFilterType, searchQuery, setSearchQuery, currentPage, setCurrentPage },
        actions: { handleUpdate, handleAdd, handleDelete }
    };
};