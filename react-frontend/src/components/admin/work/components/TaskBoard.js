import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useTaskManager } from '../../../../hooks/useTaskManager';
import TaskRow from './TaskRow';
import TaskLogManager from './TaskLogManager';
import { TASK_TYPE_CONFIG, PRIORITY_OPTIONS } from '../constants/task';

const TaskBoard = ({ feature_id, tasks, onUpdate }) => {
    const { tasks: tData, params, actions } = useTaskManager(feature_id, tasks, onUpdate);
    const [newTask, setNewTask] = useState({ content: '', status: 'pending', priority: 1, task_type: 'feature' });
    const [logModal, setLogModal] = useState({ visible: false, taskId: null, taskContent: '' });

    const onAddClick = async () => {
        if (!newTask.content.trim()) return;
        const success = await actions.handleAdd(newTask);
        if (success) setNewTask({ content: '', status: 'pending', priority: 1, task_type: 'feature' });
    };

    return (
        <div className="task-table-root">
            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input placeholder="搜尋任務..." value={params.searchQuery} onChange={(e) => params.setSearchQuery(e.target.value)} />
                </div>
                <div className="filter-options">
                    {['active', 'all', 'done', 'canceled'].map(type => (
                        <button key={type} className={params.filterType === type ? 'active' : ''} onClick={() => params.setFilterType(type)}>
                            {type.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <table className="fixed-task-table">
                <thead>
                    <tr>
                        <th style={{ width: '60px' }}>Status</th>
                        <th style={{ width: '85px' }}>Type</th>
                        <th style={{ width: 'auto' }}>Content</th>
                        <th style={{ width: '100px' }}>Priority</th>
                        <th style={{ width: '140px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tData.currentTasks.map(task => (
                        <TaskRow 
                            key={task.id} 
                            task={task} 
                            actions={actions} 
                            config={TASK_TYPE_CONFIG}
                            onOpenLog={(t) => setLogModal({ visible: true, taskId: t.id, taskContent: t.content })}
                        />
                    ))}
                </tbody>
                <tfoot>
                    <tr className="table-footer-add">
                        <td className="cell-center"><FontAwesomeIcon icon={faPlus} /></td>
                        <td className="cell-center">
                            <select className="table-select-sm" value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})}>
                                {Object.entries(TASK_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </td>
                        <td>
                            <input className="table-input-text" placeholder="新增任務內容..." value={newTask.content} onChange={e => setNewTask({...newTask, content: e.target.value})} onKeyPress={e => e.key === 'Enter' && onAddClick()} />
                        </td>
                        <td className="cell-center">
                            <select className="table-select" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: Number(e.target.value)})}>
                                {PRIORITY_OPTIONS.map(n => <option key={n} value={n}>P{n}</option>)}
                            </select>
                        </td>
                        <td className="cell-center"><button className="table-add-btn" onClick={onAddClick}>Add</button></td>
                    </tr>
                </tfoot>
            </table>

            {/* Pagination & Modals */}
            <div className="pagination-wrapper">
                {tData.totalPages > 1 && (
                    <div className="pagination-controls">
                        <button onClick={() => params.setCurrentPage(p => Math.max(1, p - 1))}><FontAwesomeIcon icon={faChevronLeft} /></button>
                        <span>{params.currentPage} / {tData.totalPages}</span>
                        <button onClick={() => params.setCurrentPage(p => Math.min(tData.totalPages, p + 1))}><FontAwesomeIcon icon={faChevronRight} /></button>
                    </div>
                )}
            </div>

            <TaskLogManager
                visible={logModal.visible}
                taskId={logModal.taskId}
                taskContent={logModal.taskContent}
                onClose={() => setLogModal({ ...logModal, visible: false })}
            />
        </div>
    );
};

export default TaskBoard;