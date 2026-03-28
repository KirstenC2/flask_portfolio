import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck, faRectangleXmark, faCircle, faTimes, faSave,
    faCommentDots, faBan, faEdit, faTrashAlt, faBug, faLightbulb, faCircleQuestion
} from '@fortawesome/free-solid-svg-icons';
import { TASK_TYPE_CONFIG, PRIORITY_OPTIONS } from '../constants/task';

const TaskRow = ({ task, actions, onOpenLog }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...task });
    const [isCanceling, setIsCanceling] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const typeCfg = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.feature;
    const handleKeyDown = (e, type) => {
            if (e.key === 'Enter') {
                if (type === 'edit') handleSave();
                if (type === 'cancel') handleCancelSubmit();
            } else if (e.key === 'Escape') {
                if (type === 'edit') setIsEditing(false);
                if (type === 'cancel') setIsCanceling(false);
            }
        };
    const handleSave = async () => {
        try {
            // 1. 執行更新
            const success = await actions.handleUpdate(task.id, editData);

            // 2. 只有在成功時才關閉編輯模式
            // 注意：請確認你的 useTaskManager hook 中的 handleUpdate 是否有 return true
            if (success !== false) {
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Save failed:", err);
        }
    };

    const handleCancelSubmit = async () => {
        const success = await actions.handleUpdate(task.id, { 
            status: 'canceled', 
            cancel_reason: cancelReason 
        });
        if (success) setIsCanceling(false);
    };

    useEffect(() => {
        setEditData({ ...task });
    }, [task]);

    return (
        <tr className={`tr-row ${task.status} ${task.has_bugs ? 'row-has-bug' : ''}`}>
            {/* 狀態圖示 */}
            <td className="cell-center">
                <FontAwesomeIcon
                    icon={task.status === 'done' ? faCheck : task.status === 'canceled' ? faRectangleXmark : faCircle}
                    className={`status-icon-btn ${task.status}`}
                    onClick={() => actions.handleUpdate(task.id, { status: task.status === 'done' ? 'pending' : 'done' })}
                />
            </td>

            {/* 任務類型 */}
            <td className="cell-center">
                {isEditing ? (
                    <select
                        className="table-select-sm"
                        value={editData.task_type}
                        onChange={e => setEditData({ ...editData, task_type: e.target.value })}
                    >
                        {Object.entries(TASK_TYPE_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>
                ) : (
                    <span style={{ color: typeCfg.color, fontSize: '11px', fontWeight: 'bold' }}>
                        {typeCfg.label}
                    </span>
                )}
            </td>

            {/* 任務內容 */}
            <td>
                {isCanceling ? (
                    <div className="table-inline-edit">
                        <input 
                            className="table-input-text" 
                            value={cancelReason} 
                            onChange={e => setCancelReason(e.target.value)} 
                            placeholder="原因..." 
                            autoFocus 
                            onKeyDown={(e) => handleKeyDown(e, 'cancel')}
                        />
                        <button
                            className="btn-save-sm"
                            onClick={async () => {
                                const success = await actions.handleUpdate(task.id, { status: 'canceled', cancel_reason: cancelReason });
                                if (success) setIsCanceling(false); // 確保成功才關閉介面
                            }}
                        >
                            OK
                        </button>
                        <button className="btn-cancel-sm" onClick={() => setIsCanceling(false)}><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                ) : isEditing ? (
                    <input 
                        className="table-input-text" 
                        value={editData.content} 
                        onChange={e => setEditData({ ...editData, content: e.target.value })} 
                        onKeyDown={(e) => handleKeyDown(e, 'edit')}
                        autoFocus
                    />
                ) : (
                    <div className="table-content-text">
                        <span className="main-content">{task.content}</span>
                        <div className="task-intel-tags" style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                            {task.status === 'canceled' && <div className="cancel-label"><FontAwesomeIcon icon={faCommentDots} /> {task.cancel_reason}</div>}
                            {task.has_bugs && <span className="intel-tag bug"><FontAwesomeIcon icon={faBug} /> ISSUE</span>}
                            {task.has_solutions && <span className="intel-tag solved"><FontAwesomeIcon icon={faLightbulb} /> SOLVED</span>}
                            {task.has_questions && <span className="intel-tag question"><FontAwesomeIcon icon={faCircleQuestion} /> QUESTION</span>}
                        </div>
                    </div>
                )}
            </td>

            {/* 優先級 */}
            <td className="cell-center">
                {isEditing ? (
                    <select 
                        className="table-select" 
                        value={editData.priority} 
                        onChange={e => setEditData({ ...editData, priority: Number(e.target.value) })}
                        onKeyDown={(e) => handleKeyDown(e, 'edit')}
                    >
                        {PRIORITY_OPTIONS.map(n => <option key={n} value={n}>P{n}</option>)}
                    </select>
                ) : (
                    <span className={`p-badge p-${task.priority}`}>P{task.priority}</span>
                )}
            </td>

            {/* 操作按鈕 */}
            <td className="cell-center">
                <div className="form-actions">
                    {isEditing ? (
                        <button className="action-icon-btn save" onClick={handleSave} ><FontAwesomeIcon icon={faSave} /></button>
                    ) : isCanceling ? null : (
                        <>
                            <button className="action-icon-btn" style={{ color: '#1890ff' }} onClick={() => onOpenLog(task)}><FontAwesomeIcon icon={faCommentDots} /></button>
                            <button className="action-icon-btn" onClick={() => setIsCanceling(true)}><FontAwesomeIcon icon={faBan} /></button>
                            <button className="action-icon-btn" onClick={() => { setIsEditing(true); setEditData(task); }}><FontAwesomeIcon icon={faEdit} /></button>
                            <button className="action-icon-btn del" onClick={() => actions.handleDelete(task.id)}><FontAwesomeIcon icon={faTrashAlt} /></button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TaskRow;