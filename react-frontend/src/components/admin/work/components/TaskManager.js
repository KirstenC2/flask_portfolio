import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRectangleXmark, faCircle, faPlus, faTrashAlt, faEdit, faSave, 
    faTimes, faBan, faCheck, faCommentDots, faChevronLeft, faChevronRight, faFilter, faSearch 
} from '@fortawesome/free-solid-svg-icons';
import { useTaskManager } from '../../../../hooks/useTaskManager'; // 引入自定義 Hook
import '../../../../common/filterBar.css';
const TaskManager = ({ feature_id, tasks, onUpdate }) => {
    // 使用 Hook 取得所有邏輯與狀態
    const { tasks: tData, params, actions } = useTaskManager(feature_id, tasks, onUpdate);

    // 本地 UI 狀態（僅限於目前編輯中或新增中的資料）
    const [newTask, setNewTask] = useState({ content: '', status: 'todo', priority: 4 });
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [cancelingId, setCancelingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const onAddClick = async () => {
        const success = await actions.handleAdd(newTask);
        if (success) setNewTask({ content: '', status: 'todo', priority: 4 });
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
                            <tr key={task.id} className={`tr-row ${task.status}`}>
                                <td className="cell-center">
                                    <FontAwesomeIcon
                                        icon={task.status === 'done' ? faCheck : task.status === 'canceled' ? faRectangleXmark : faCircle}
                                        className={`status-icon-btn ${task.status}`}
                                        onClick={() => actions.handleUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
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
                                            <button className="action-icon-btn save" onClick={() => { actions.handleUpdate(task.id, editData); setEditingId(null); }}><FontAwesomeIcon icon={faSave} /></button>
                                        ) : !isCanceling ? (
                                            <>
                                                <button className="action-icon-btn" onClick={() => setCancelingId(task.id)}><FontAwesomeIcon icon={faBan} /></button>
                                                <button className="action-icon-btn" onClick={() => { setEditingId(task.id); setEditData(task); }}><FontAwesomeIcon icon={faEdit} /></button>
                                                <button className="action-icon-btn del" onClick={() => actions.handleDelete(task.id)}><FontAwesomeIcon icon={faTrashAlt} /></button>
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
                        <td><input className="table-input-text" placeholder="新增任務..." value={newTask.content} onChange={e => setNewTask({...newTask, content: e.target.value})} onKeyPress={e => e.key === 'Enter' && onAddClick()} /></td>
                        <td className="cell-center">
                            <select className="table-select" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: Number(e.target.value)})}>
                                {[1,2,3,4].map(n => <option key={n} value={n}>P{n}</option>)}
                            </select>
                        </td>
                        <td className="cell-center"><button className="table-add-btn" onClick={onAddClick}>Add</button></td>
                    </tr>
                </tfoot>
            </table>

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

export default TaskManager;