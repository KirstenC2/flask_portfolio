import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faCheckCircle, faPlus, faTrash, faEdit, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const DescriptionManager = ({ experienceId, descriptions, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newDesc, setNewDesc] = useState({ category: 'General', version_name: 'Standard', content: '' });

  const handleToggleActive = async (descId) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`http://localhost:5001/api/admin/experience/description/${descId}/activate`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    onRefresh();
  };

  const handleUpdate = async (descId, fields) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`http://localhost:5001/api/admin/experience/description/${descId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(fields)
    });
    onRefresh();
  };

  const handleDelete = async (descId) => {
    if (!window.confirm("Delete this version?")) return;
    const token = localStorage.getItem('adminToken');
    await fetch(`http://localhost:5001/api/admin/experience/description/${descId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    onRefresh();
  };

  const handleAdd = async () => {
    if (!newDesc.content.trim()) return alert("Content is required");
    const token = localStorage.getItem('adminToken');
    await fetch(`http://localhost:5001/api/admin/experience/${experienceId}/description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newDesc)
    });
    setShowAddRow(false);
    setNewDesc({ category: 'General', version_name: 'Standard', content: '' });
    onRefresh();
  };

  return (
    <div className="compact-description-manager" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h5 style={{ margin: 0, fontSize: '1rem', color: '#444' }}>Description Variants</h5>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isEditing ? (
            <>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setShowAddRow(true)}>
                <FontAwesomeIcon icon={faPlus} /> Add
              </button>
              <button className="btn btn-sm btn-success" onClick={() => { setIsEditing(false); setShowAddRow(false); }}>
                <FontAwesomeIcon icon={faCheck} /> Done
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setIsEditing(true)}>
              <FontAwesomeIcon icon={faEdit} /> Edit Versions
            </button>
          )}
        </div>
      </div>

      <table className="admin-table-compact" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
          <tr>
            <th style={{ padding: '8px', width: '40px' }}>Act</th>
            <th style={{ padding: '8px', width: '100px' }}>Category</th>
            <th style={{ padding: '8px', width: '100px' }}>Version</th>
            <th style={{ padding: '8px' }}>Content</th>
            {isEditing && <th style={{ padding: '8px', width: '40px' }}></th>}
          </tr>
        </thead>
        <tbody>
          {/* 新增行 (僅在編輯模式且點擊 Add 時顯示) */}
          {isEditing && showAddRow && (
            <tr style={{ background: '#fff9db' }}>
              <td style={{ textAlign: 'center' }}>-</td>
              <td><input className="form-control-sm" value={newDesc.category} onChange={e => setNewDesc({...newDesc, category: e.target.value})} style={{ width: '100%' }} /></td>
              <td><input className="form-control-sm" value={newDesc.version_name} onChange={e => setNewDesc({...newDesc, version_name: e.target.value})} style={{ width: '100%' }} /></td>
              <td><textarea className="form-control-sm" rows={2} value={newDesc.content} onChange={e => setNewDesc({...newDesc, content: e.target.value})} style={{ width: '100%' }} /></td>
              <td style={{ textAlign: 'center' }}>
                <button className="btn-icon" onClick={handleAdd} style={{ color: 'green', border: 'none', background: 'none' }}><FontAwesomeIcon icon={faCheck} /></button>
                <button className="btn-icon" onClick={() => setShowAddRow(false)} style={{ color: 'gray', border: 'none', background: 'none' }}><FontAwesomeIcon icon={faTimes} /></button>
              </td>
            </tr>
          )}

          {descriptions.map(d => (
            <tr key={d.id} style={{ borderBottom: '1px solid #eee', background: d.is_active ? '#f1f8ff' : 'transparent' }}>
              {/* 切換 Active 永遠可以點擊 */}
              <td style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleToggleActive(d.id)}>
                <FontAwesomeIcon icon={d.is_active ? faCheckCircle : faCircle} color={d.is_active ? '#007bff' : '#ccc'} />
              </td>
              
              {isEditing ? (
                /* 編輯模式：顯示 Input */
                <>
                  <td><input className="form-control-sm" defaultValue={d.category} onBlur={(e) => e.target.value !== d.category && handleUpdate(d.id, { category: e.target.value })} style={{ width: '100%' }} /></td>
                  <td><input className="form-control-sm" defaultValue={d.version_name} onBlur={(e) => e.target.value !== d.version_name && handleUpdate(d.id, { version_name: e.target.value })} style={{ width: '100%' }} /></td>
                  <td><textarea className="form-control-sm" rows={2} defaultValue={d.content} onBlur={(e) => e.target.value !== d.content && handleUpdate(d.id, { content: e.target.value })} style={{ width: '100%', resize: 'vertical' }} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(d.id)} style={{ border: 'none', background: 'none' }}><FontAwesomeIcon icon={faTrash} /></button>
                  </td>
                </>
              ) : (
                /* 瀏覽模式：純文字顯示 */
                <>
                  <td style={{ padding: '8px' }}><b>{d.category}</b></td>
                  <td style={{ padding: '8px', color: '#666' }}>{d.version_name}</td>
                  <td style={{ padding: '8px', lineHeight: '1.4' }}>{d.content}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DescriptionManager;