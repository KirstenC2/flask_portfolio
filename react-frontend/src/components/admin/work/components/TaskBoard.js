import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRectangleXmark, faCircle, faPlus, faTrashAlt, faEdit, faSave,
    faTimes, faBan, faCheck, faCommentDots, faChevronLeft, faChevronRight, faFilter, faSearch, faBug, faLightbulb, faCircleQuestion
} from '@fortawesome/free-solid-svg-icons';
import { useTaskManager } from '../../../../hooks/useTaskManager'; // 引入自定義 Hook
import TaskLogManager from './TaskLogManager';
import '../../../../common/filterBar.css';
import '../../../../common/global.css';
const TaskBoard = ({ feature_id, tasks, onUpdate }) => {
    // 使用 Hook 取得所有邏輯與狀態
    const { tasks: tData, params, actions } = useTaskManager(feature_id, tasks, onUpdate);

    // 本地 UI 狀態（僅限於目前編輯中或新增中的資料）
    const [newTask, setNewTask] = useState({ content: '', status: 'pending', priority: 4 });
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [cancelingId, setCancelingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [logModal, setLogModal] = useState({ visible: false, taskId: null, taskContent: '' });
    const onAddClick = async () => {
        const success = await actions.handleAdd(newTask);
        if (success) setNewTask({ content: '', status: 'pending', priority: 4 });
    };


    return (
        <div className="task-table-root">
            {/* --- Filter & Search Bar --- */}
            <div className="filter-bar">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        placeholder="搜尋任務..."
                        value={params.searchQuery}
                        onChange={(e) => params.setSearchQuery(e.target.value)}
                    />
                </div>
                <span className="filter-label"><FontAwesomeIcon icon={faFilter} /> Filter:</span>
                <div className="filter-options">
                    {['active', 'all', 'done', 'canceled'].map(type => (
                        <button
                            key={type}
                            className={params.filterType === type ? 'active' : ''}
                            onClick={() => params.setFilterType(type)}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Data Table --- */}
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
                    {tData.currentTasks.map(task => {
                        const isEditing = editingId === task.id;
                        const isCanceling = cancelingId === task.id;

                        return (
                            <tr
                                key={task.id}
                                className={`tr-row ${task.status} ${task.has_bugs ? 'row-has-bug' : ''}`}
                                style={task.has_bugs ? { borderLeft: '4px solid #ff4d4f' } : {}} // 在左側加一條紅線提醒
                            >
                                <td className="cell-center">
                                    <FontAwesomeIcon
                                        icon={task.status === 'done' ? faCheck : task.status === 'canceled' ? faRectangleXmark : faCircle}
                                        className={`status-icon-btn ${task.status}`}
                                        onClick={() => actions.handleUpdate(task.id, { status: task.status === 'done' ? 'pending' : 'done' })}
                                    />
                                </td>
                                <td>
                                    {isCanceling ? (
                                        <div className="table-inline-edit">
                                            <input className="table-input-text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="原因..." autoFocus />
                                            <button className="btn-save-sm" onClick={() => { actions.handleUpdate(task.id, { status: 'canceled', cancel_reason: cancelReason }); setCancelingId(null); }}>OK</button>
                                            <button className="btn-cancel-sm" onClick={() => setCancelingId(null)}><FontAwesomeIcon icon={faTimes} /></button>
                                        </div>
                                    ) : isEditing ? (
                                        <input className="table-input-text" value={editData.content} onChange={e => setEditData({ ...editData, content: e.target.value })} />
                                    ) : (
                                        <div className="table-content-text">
                                            <span className="main-content">{task.content}</span>

                                            {/* 💡 新增：情報標籤區塊 */}
                                            <div className="task-intel-tags" style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
                                                {/* 顯示取消原因 (原本就有的) */}
                                                {task.status === 'canceled' && task.cancel_reason && (
                                                    <div className="cancel-label"><FontAwesomeIcon icon={faCommentDots} /> {task.cancel_reason}</div>
                                                )}

                                                {/* 2. 顯示 Bug 狀態 (對應後端 has_bugs) */}
                                                {task.has_bugs && (
                                                    <span style={{
                                                        fontSize: '10px', color: '#ff4d4f', background: '#fff1f0',
                                                        border: '1px solid #ffccc7', padding: '0 5px', borderRadius: '4px',
                                                        display: 'inline-flex', alignItems: 'center'
                                                    }}>
                                                        <FontAwesomeIcon icon={faBug} style={{ marginRight: '3px' }} /> ISSUE
                                                    </span>
                                                )}


                                                {/* 3. 顯示解法狀態 (對應後端 has_solutions) */}
                                                {task.has_solutions && (
                                                    <span style={{
                                                        fontSize: '10px', color: '#52c41a', background: '#f6ffed',
                                                        border: '1px solid #b7eb8f', padding: '0 5px', borderRadius: '4px',
                                                        display: 'inline-flex', alignItems: 'center'
                                                    }}>
                                                        <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: '3px' }} /> SOLVED
                                                    </span>
                                                )}

                                                {task.has_questions && (
                                                    <span style={{
                                                        fontSize: '10px', color: '#faad14', background: '#fffbe6',
                                                        border: '1px solid #ffe58f', padding: '0 5px', borderRadius: '4px',
                                                        display: 'inline-flex', alignItems: 'center'
                                                    }}>
                                                        <FontAwesomeIcon icon={faCircleQuestion} style={{ marginRight: '3px' }} /> QUESTION
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="cell-center">
                                    {isEditing ? (
                                        <select className="table-select" value={editData.priority} onChange={e => setEditData({ ...editData, priority: Number(e.target.value) })}>
                                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>P{n}</option>)}
                                        </select>
                                    ) : (
                                        <span className={`p-badge p-${task.priority}`}>P{task.priority}</span>
                                    )}
                                </td>
                                <td className="cell-center">
                                    <div className="form-actions">
                                        {isEditing ? (
                                            /* 1. 編輯模式：只顯示儲存 */
                                            <button className="action-icon-btn save" onClick={() => { actions.handleUpdate(task.id, editData); setEditingId(null); }}>
                                                <FontAwesomeIcon icon={faSave} />
                                            </button>
                                        ) : isCanceling ? (
                                            /* 2. 取消中模式：隱藏所有按鈕，讓位給 OK/Cancel */
                                            null
                                        ) : (
                                            /* 3. 一般模式：顯示 匯報、禁止、編輯、刪除 */
                                            <>
                                                {/* 💡 匯報按鈕 (放在最前面，最常用) */}
                                                <button
                                                    className="action-icon-btn"
                                                    style={{ color: '#1890ff' }}
                                                    onClick={() => setLogModal({ visible: true, taskId: task.id, taskContent: task.content })}
                                                >
                                                    <FontAwesomeIcon icon={faCommentDots} />
                                                </button>

                                                {/* 禁止 (取消) 按鈕 */}
                                                <button className="action-icon-btn" title="取消任務" onClick={() => setCancelingId(task.id)}>
                                                    <FontAwesomeIcon icon={faBan} />
                                                </button>

                                                {/* 編輯按鈕 */}
                                                <button className="action-icon-btn" title="編輯內容" onClick={() => { setEditingId(task.id); setEditData(task); }}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>

                                                {/* 刪除按鈕 */}
                                                <button className="action-icon-btn del" title="永久刪除" onClick={() => actions.handleDelete(task.id)}>
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="table-footer-add">
                        <td className="cell-center"><FontAwesomeIcon icon={faPlus} /></td>
                        <td><input className="table-input-text" placeholder="新增任務..." value={newTask.content} onChange={e => setNewTask({ ...newTask, content: e.target.value })} onKeyPress={e => e.key === 'Enter' && onAddClick()} /></td>
                        <td className="cell-center">
                            <select className="table-select" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: Number(e.target.value) })}>
                                {[1, 2, 3, 4].map(n => <option key={n} value={n}>P{n}</option>)}
                            </select>
                        </td>
                        <td className="cell-center"><button className="table-add-btn" onClick={onAddClick}>Add</button></td>
                    </tr>
                </tfoot>
            </table>
            <TaskLogManager
                visible={logModal.visible}
                taskId={logModal.taskId}
                taskContent={logModal.taskContent}
                onClose={() => setLogModal({ ...logModal, visible: false })}
            />

            {/* --- Pagination --- */}
            {tData.totalPages > 1 && (
                <div className="pagination-controls">
                    <button className="pagination-btn" disabled={params.currentPage === 1} onClick={() => params.setCurrentPage(params.currentPage - 1)}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    {[...Array(tData.totalPages)].map((_, i) => (
                        <button key={i} className={`pagination-btn ${params.currentPage === i + 1 ? 'active' : ''}`} onClick={() => params.setCurrentPage(i + 1)}>
                            {i + 1}
                        </button>
                    ))}
                    <button className="pagination-btn" disabled={params.currentPage === tData.totalPages} onClick={() => params.setCurrentPage(params.currentPage + 1)}>
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskBoard;