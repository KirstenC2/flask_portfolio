// src/hooks/useTaskManager.js
import { useState, useMemo, useEffect } from 'react';
import { taskApi } from '../services/taskApi';

export const useTaskManager = (feature_id, tasks, onUpdate) => {
    const [filterType, setFilterType] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 2. 定義過濾邏輯 (useMemo)
    const filteredTasks = useMemo(() => {
        let result = tasks || [];
        if (filterType === 'active') {
            result = result.filter(t => t.status === 'pending' || t.status === 'doing');
        } else if (filterType === 'done') {
            result = result.filter(t => t.status === 'done');
        } else if (filterType === 'canceled') {
            result = result.filter(t => t.status === 'canceled');
        }

        if (searchQuery.trim()) {
            result = result.filter(t =>
                t.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return result;
    }, [tasks, filterType, searchQuery]);

    // 2. 分頁數據計算
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
    const currentTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 3. API 操作封裝
    const handleUpdate = async (taskId, fields) => {
        try {
            const res = await taskApi.update(taskId, fields);
            
            // 重要：判斷是否成功
            if (res.ok) {
                console.log("Update success, refreshing...");
                // 呼叫父組件的 fetchProjectDetail，傳入 true 避免 Loading 閃爍
                await onUpdate(true); 
            } else {
                console.error("Update failed with status:", res.status);
            }
        } catch (err) {
            console.error("Update task error:", err);
        }
    };

    const handleAdd = async (taskData) => {
        if (!taskData.content.trim()) return false;

        try {
            const res = await taskApi.create(feature_id, taskData);
            
            // Debug 用：確認 API 是否成功
            console.log("POST Task Status:", res.status);

            if (res.ok) {
                // 這裡最重要：一定要看到這個 console 執行
                console.log("Attempting to trigger onUpdate...");
                
                // 執行父組件傳進來的 fetchProjectDetail
                await onUpdate(true); 
                
                setCurrentPage(1);
                return true; 
            }
        } catch (err) {
            console.error("Add task failed:", err);
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