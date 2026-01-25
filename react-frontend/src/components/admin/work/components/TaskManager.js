import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRectangleXmark, faCircle, faPlus, faTrashAlt, 
    faEdit, faSave, faTimes , faBan, faCheck
} from '@fortawesome/free-solid-svg-icons';

const TaskManager = ({ feature_id, tasks, onUpdate }) => {
    const [newTask, setNewTask] = useState({ content: '', status: 'todo', priority: 4 });
    
    // --- New State for Editing ---
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ content: '', status: '', priority: 4 });
    const [cancelingId, setCancelingId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const token = localStorage.getItem('adminToken');

    // Generic Update API Call
    const updateTaskAPI = async (taskId, updatedFields) => {
        try {
            const res = await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedFields)
            });
            if (res.ok) {
                onUpdate();
                setEditingId(null);
                setCancelingId(null); // Reset cancel state
                setCancelReason('');   // Clear reason
            }
        } catch (err) { console.error("Update Error:", err); }
    };

    const handleConfirmCancel = (taskId) => {
        if (!cancelReason.trim()) {
            alert("Please provide a reason for cancellation.");
            return;
        }
        updateTaskAPI(taskId, { status: 'canceled', cancel_reason: cancelReason });
    };

    const handleAdd = async () => {
        if (!newTask.content || !newTask.content.trim()) return;
        try {
            const res = await fetch(`http://localhost:5001/api/admin/features/${feature_id}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...newTask, feature_id })
            });
            if (res.ok) {
                onUpdate();
                setNewTask({ content: '', status: 'todo', priority: 4 });
            }
        } catch (err) { console.error(err); }
    };

    // Trigger Edit Mode
    const startEditing = (task) => {
        setEditingId(task.id);
        setEditData({ 
            content: task.content, 
            status: task.status, 
            priority: task.priority 
        });
    };


    const toggleStatus = (task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        updateTaskAPI(task.id, { status: newStatus });
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await fetch(`http://localhost:5001/api/admin/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            onUpdate();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="task-manager">
            <div className="task-sub-list">
                {tasks.map(task => {
                    const isEditing = editingId === task.id;
                    const isCanceling = cancelingId === task.id;
                    return (
                        <div key={task.id} className={`task-status-row ${task.status} ${isEditing ? 'is-editing' : ''}`}>
                            <FontAwesomeIcon
                                icon={task.status === 'done' ? faCheck : faCircle}
                                className="status-icon"
                                onClick={() => toggleStatus(task)}
                            />
                            

                            {isCanceling ? (
                                /* --- CANCEL REASON UI --- */
                                <div className="cancel-reason-group">
                                    <input 
                                        type="text" 
                                        placeholder="Reason for cancellation..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="confirm-cancel-btn" onClick={() => handleConfirmCancel(task.id)}>Submit</button>
                                    <button className="abort-btn" onClick={() => setCancelingId(null)}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            ) : isEditing ? (
                                /* --- EDIT MODE UI --- */
                                <div className="edit-inline-group">
                                    <input 
                                        type="text"
                                        value={editData.content}
                                        onChange={(e) => setEditData({...editData, content: e.target.value})}
                                    />
                                    <div className="edit-actions">
                                        <button onClick={() => updateTaskAPI(task.id, editData)}><FontAwesomeIcon icon={faSave} /></button>
                                        <button onClick={() => setEditingId(null)}><FontAwesomeIcon icon={faTimes} /></button>
                                    </div>
                                </div>
                            ) : (
                                /* --- VIEW MODE UI --- */
                                <>
                                    <span className="task-content">{task.content}</span>
                                    <span className={`priority-tag p-${task.priority}`}>P{task.priority}</span>
                                    <div className="task-actions">
                                        <button className="cancel-task-btn" onClick={() => setCancelingId(task.id)} title="Cancel Task">
                                            <FontAwesomeIcon icon={faBan} />
                                        </button>
                                        <button className="edit-task-btn" onClick={() => startEditing(task)}>
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button className="delete-task-btn" onClick={() => handleDelete(task.id)}>
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ADD TASK SECTION */}
            <div className="add-task-input-group">
                <input
                    className="task-input-main"
                    value={newTask.content}
                    onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                    placeholder="What needs to be done?"
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                />
                <select
                    className="task-select-priority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                >
                    <option value="1">P1 - High</option>
                    <option value="2">P2 - Med</option>
                    <option value="3">P3 - Low</option>
                    <option value="4">P4 - None</option>
                </select>
                <button className="add-task-btn" onClick={handleAdd}>
                    <FontAwesomeIcon icon={faPlus} />
                </button>
            </div>
        </div>
    );
};

export default TaskManager;