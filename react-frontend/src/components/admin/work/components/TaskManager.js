import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRectangleXmark, faCircle, faPlus, faTrashAlt, 
    faEdit, faSave, faTimes, faBan, faCheck, faCommentDots,
    faChevronLeft, faChevronRight , faFilter, faSearch
} from '@fortawesome/free-solid-svg-icons';
import '../../../../common/pagination.css';
import '../../../../common/filterBar.css';

const TaskManager = ({ feature_id, tasks, onUpdate }) => {
    const [newTask, setNewTask] = useState({ content: '', status: 'todo', priority: 4 });
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [cancelingId, setCancelingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [filterType, setFilterType] = useState('active'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const token = localStorage.getItem('adminToken');
    const filteredTasks = useMemo(() => {
        let result = tasks;

        // 1. 狀態過濾
        if (filterType === 'active') {
            result = result.filter(t => t.status === 'todo' || t.status === 'doing');
        } else if (filterType === 'done') {
            result = result.filter(t => t.status === 'done');
        } else if (filterType === 'canceled') {
            result = result.filter(t => t.status === 'canceled');
        }

        // 2. 關鍵字搜尋
        if (searchQuery.trim()) {
            result = result.filter(t => 
                t.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return result;
    }, [tasks, filterType, searchQuery]);


    // --- 【修正 2】基於過濾後的清單計算分頁 ---
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    // 注意這裡：是從 filteredTasks 進行 slice，而不是 tasks
    const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

    const updateTaskAPI = async (taskId, fields) => {
        try {
            const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(fields)
            });
            if (res.ok) {
                onUpdate();
                setEditingId(null);
                setCancelingId(null);
                setCancelReason('');
            }
        } catch (err) { console.error(err); }
    };

    const handleAdd = async () => {
        if (!newTask.content.trim()) return;
        try {
            const res = await fetch(`http://localhost:5001/api/admin/features/${feature_id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...newTask, feature_id })
            });
            if (res.ok) {
                onUpdate();
                setNewTask({ content: '', status: 'todo', priority: 4 });
                setCurrentPage(1); // 新增後跳回第一頁查看
            }
        } catch (err) { console.error(err); }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm("確定刪除？")) return;
        try {
            await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onUpdate();
            // 修正：如果該頁最後一筆被刪除，自動回前一頁
            if (currentTasks.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (err) { console.error(err); }
    };

    // 當切換 Filter 時，強制回到第一頁
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType]);
    return (
        <div className="task-table-root">
            <div className="filter-bar">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="搜尋任務內容..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <span className="filter-label"><FontAwesomeIcon icon={faFilter} /> Filter:</span>
                <div className="filter-options">
                    <button className={filterType === 'active' ? 'active' : ''} onClick={() => setFilterType('active')}>Active (To Do / In Progress)</button>
                    <button className={filterType === 'all' ? 'active' : ''} onClick={() => setFilterType('all')}>All Tasks</button>
                    <button className={filterType === 'done' ? 'active' : ''} onClick={() => setFilterType('done')}>Completed</button>
                    <button className={filterType === 'canceled' ? 'active' : ''} onClick={() => setFilterType('canceled')}>Canceled</button>
                </div>
            </div>
            <table className="fixed-task-table">
                <thead>
                    <tr>
                        <th style={{ width: '60px' }}>Status</th>
                        <th style={{ width: 'auto' }}>Task Content</th>
                        <th style={{ width: '100px' }}>Priority</th>
                        <th style={{ width: '140px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* 注意：這裡改用 currentTasks 進行 map */}
                    {currentTasks.map(task => {
                        const isEditing = editingId === task.id;
                        const isCanceling = cancelingId === task.id;

                        return (
                            <tr key={task.id} className={`tr-row ${task.status}`}>
                                <td className="cell-center">
                                    <FontAwesomeIcon
                                        icon={task.status === 'done' ? faCheck : task.status === 'canceled' ? faRectangleXmark : faCircle}
                                        className={`status-icon-btn ${task.status}`}
                                        onClick={() => updateTaskAPI(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                                    />
                                </td>
                                <td>
                                    {isCanceling ? (
                                        <div className="table-inline-edit">
                                            <input className="table-input-text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="原因..." autoFocus />
                                            <button className="btn-save-sm" onClick={() => updateTaskAPI(task.id, { status: 'canceled', cancel_reason: cancelReason })}>OK</button>
                                            <button className="btn-cancel-sm" onClick={() => setCancelingId(null)}><FontAwesomeIcon icon={faTimes} /></button>
                                        </div>
                                    ) : isEditing ? (
                                        <input className="table-input-text" value={editData.content} onChange={e => setEditData({...editData, content: e.target.value})} />
                                    ) : (
                                        <div className="table-content-text">
                                            <span className="main-content">{task.content}</span>
                                            {task.status === 'canceled' && task.cancel_reason && (
                                                <div className="cancel-label"><FontAwesomeIcon icon={faCommentDots} /> {task.cancel_reason}</div>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="cell-center">
                                    {isEditing ? (
                                        <select className="table-select" value={editData.priority} onChange={e => setEditData({...editData, priority: Number(e.target.value)})}>
                                            {[1,2,3,4].map(n => <option key={n} value={n}>P{n}</option>)}
                                        </select>
                                    ) : (
                                        <span className={`p-badge p-${task.priority}`}>P{task.priority}</span>
                                    )}
                                </td>
                                <td className="cell-center">
                                    <div className="table-action-group">
                                        {isEditing ? (
                                            <button className="action-icon-btn save" onClick={() => updateTaskAPI(task.id, editData)}><FontAwesomeIcon icon={faSave} /></button>
                                        ) : !isCanceling ? (
                                            <>
                                                <button className="action-icon-btn" onClick={() => setCancelingId(task.id)}><FontAwesomeIcon icon={faBan} /></button>
                                                <button className="action-icon-btn" onClick={() => { setEditingId(task.id); setEditData(task); }}><FontAwesomeIcon icon={faEdit} /></button>
                                                <button className="action-icon-btn del" onClick={() => handleDelete(task.id)}><FontAwesomeIcon icon={faTrashAlt} /></button>
                                            </>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="table-footer-add">
                        <td className="cell-center"><FontAwesomeIcon icon={faPlus} /></td>
                        <td><input className="table-input-text" placeholder="新增任務..." value={newTask.content} onChange={e => setNewTask({...newTask, content: e.target.value})} /></td>
                        <td className="cell-center">
                            <select className="table-select" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: Number(e.target.value)})}>
                                {[1,2,3,4].map(n => <option key={n} value={n}>P{n}</option>)}
                            </select>
                        </td>
                        <td className="cell-center"><button className="table-add-btn" onClick={handleAdd}>Add</button></td>
                    </tr>
                </tfoot>
            </table>

            {/* --- Pagination Controls --- */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button 
                        className="pagination-btn" 
                        disabled={currentPage === 1} 
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    
                    {[...Array(totalPages)].map((_, index) => (
                        <button 
                            key={index + 1} 
                            className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                            onClick={() => handlePageChange(index + 1)}
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button 
                        className="pagination-btn" 
                        disabled={currentPage === totalPages} 
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskManager;