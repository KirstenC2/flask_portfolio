import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircle, faCheckCircle, faPlus, faTrash, faEdit, 
  faCheck, faTimes, faChevronLeft, faChevronRight, faFilter 
} from '@fortawesome/free-solid-svg-icons';

const TaskManager = ({ experienceId, tasks, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTask, setNewTask] = useState({ category: 'General', version_name: 'Standard', content: '' });
  
  // Filter and Pagination State
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. 取得唯一類別 (用於下拉選單)
  const categories = useMemo(() => {
    if (!tasks) return ['All'];
    const unique = [...new Set(tasks.map(t => t.category))];
    return ['All', ...unique];
  }, [tasks]);

  // 2. 根據選擇過濾列表
  const filteredItems = useMemo(() => {
    if (!tasks) return [];
    return filterCategory === 'All' 
      ? tasks 
      : tasks.filter(t => t.category === filterCategory);
  }, [tasks, filterCategory]);

  // 3. 分頁邏輯
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleToggleActive = async (taskId) => {
    const token = localStorage.getItem('adminToken');
    // 確認後端 API 為 /api/admin/experience/task/<id>/activate
    await fetch(`http://localhost:5001/api/admin/experience/task/${taskId}/activate`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    onRefresh();
  };

  const handleUpdate = async (taskId, fields) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`http://localhost:5001/api/admin/experience/task/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(fields)
    });
    onRefresh();
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task variant?")) return;
    const token = localStorage.getItem('adminToken');
    await fetch(`http://localhost:5001/api/admin/experience/task/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    onRefresh();
  };

  const handleAdd = async () => {
    if (!newTask.content.trim()) return alert("Content is required");
    const token = localStorage.getItem('adminToken');
    // 注意：路徑從 /description 改為 /task
    await fetch(`http://localhost:5001/api/admin/experience/${experienceId}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newTask)
    });
    setShowAddRow(false);
    setNewTask({ category: 'General', version_name: 'Standard', content: '' });
    onRefresh();
  };

  return (
    <div className="task-manager-container" style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
      
      {/* Header 與 過濾控制器 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#333' }}>
          Work Tasks & Variants ({filteredItems.length})
        </h5>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8f9fa', padding: '4px 8px', borderRadius: '6px', border: '1px solid #eee' }}>
            <FontAwesomeIcon icon={faFilter} style={{ fontSize: '10px', color: '#999', marginRight: '6px' }} />
            <select 
              value={filterCategory} 
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none', fontWeight: '500' }}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            {isEditing ? (
              <>
                <button className="btn btn-sm btn-primary" onClick={() => setShowAddRow(true)} title="Add Task"><FontAwesomeIcon icon={faPlus} /></button>
                <button className="btn btn-sm btn-success" onClick={() => { setIsEditing(false); setShowAddRow(false); }}><FontAwesomeIcon icon={faCheck} /> Done</button>
              </>
            ) : (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setIsEditing(true)}><FontAwesomeIcon icon={faEdit} /> Manage Tasks</button>
            )}
          </div>
        </div>
      </div>

      <table className="admin-table-compact" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
          <tr style={{ textAlign: 'left', color: '#888' }}>
            <th style={{ padding: '10px', width: '40px' }}>Active</th>
            <th style={{ padding: '10px', width: '100px' }}>Category</th>
            <th style={{ padding: '10px', width: '100px' }}>Version</th>
            <th style={{ padding: '10px' }}>Content</th>
            {isEditing && <th style={{ padding: '10px', width: '40px' }}></th>}
          </tr>
        </thead>
        <tbody>
          {isEditing && showAddRow && (
            <tr style={{ background: '#fffbeb' }}>
              <td style={{ textAlign: 'center' }}>-</td>
              <td><input className="form-control-sm" value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value})} style={{ width: '90%' }} /></td>
              <td><input className="form-control-sm" value={newTask.version_name} onChange={e => setNewTask({...newTask, version_name: e.target.value})} style={{ width: '90%' }} /></td>
              <td><textarea className="form-control-sm" rows={2} value={newTask.content} onChange={e => setNewTask({...newTask, content: e.target.value})} style={{ width: '100%' }} /></td>
              <td style={{ textAlign: 'center' }}>
                <button className="btn-icon text-success" onClick={handleAdd} style={{ border: 'none', background: 'none' }}><FontAwesomeIcon icon={faCheck} /></button>
              </td>
            </tr>
          )}

          {currentItems.length > 0 ? currentItems.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #f9f9f9', background: t.is_active ? '#f0f7ff' : 'transparent' }}>
              <td style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleToggleActive(t.id)}>
                <FontAwesomeIcon icon={t.is_active ? faCheckCircle : faCircle} color={t.is_active ? '#3b82f6' : '#e2e8f0'} />
              </td>
              
              {isEditing ? (
                <>
                  <td><input className="form-control-sm" defaultValue={t.category} onBlur={(e) => handleUpdate(t.id, { category: e.target.value })} style={{ width: '90%' }} /></td>
                  <td><input className="form-control-sm" defaultValue={t.version_name} onBlur={(e) => handleUpdate(t.id, { version_name: e.target.value })} style={{ width: '90%' }} /></td>
                  <td><textarea className="form-control-sm" rows={2} defaultValue={t.content} onBlur={(e) => handleUpdate(t.id, { content: e.target.value })} style={{ width: '100%', resize: 'vertical' }} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(t.id)} style={{ border: 'none', background: 'none' }}><FontAwesomeIcon icon={faTrash} /></button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: '10px' }}><b>{t.category}</b></td>
                  <td style={{ padding: '10px', color: '#777' }}>{t.version_name}</td>
                  <td style={{ padding: '10px', lineHeight: '1.5', color: '#444' }}>{t.content}</td>
                </>
              )}
            </tr>
          )) : (
            <tr><td colSpan={isEditing ? 5 : 4} style={{ textAlign: 'center', padding: '30px', color: '#bbb' }}>No tasks found. Click "Edit" to add one.</td></tr>
          )}
        </tbody>
      </table>

      {/* Pagination (分頁) */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px', gap: '15px', fontSize: '12px', color: '#666' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ border: 'none', background: 'none', color: currentPage === 1 ? '#ddd' : '#3b82f6', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span>Page <b>{currentPage}</b> / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ border: 'none', background: 'none', color: currentPage === totalPages ? '#ddd' : '#3b82f6', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskManager;