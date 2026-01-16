import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircle, faCheckCircle, faPlus, faTrash, faEdit, 
  faCheck, faTimes, faChevronLeft, faChevronRight, faFilter 
} from '@fortawesome/free-solid-svg-icons';

const DescriptionManager = ({ experienceId, descriptions, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newDesc, setNewDesc] = useState({ category: 'General', version_name: 'Standard', content: '' });
  
  // Filter and Pagination State
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Get unique categories for the dropdown
  const categories = useMemo(() => {
    const unique = [...new Set(descriptions.map(d => d.category))];
    return ['All', ...unique];
  }, [descriptions]);

  // 2. Filter the list based on selection
  const filteredItems = useMemo(() => {
    return filterCategory === 'All' 
      ? descriptions 
      : descriptions.filter(d => d.category === filterCategory);
  }, [descriptions, filterCategory]);

  // 3. Paginate the filtered results
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

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
      
      {/* Header with Filter and Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <h5 style={{ margin: 0, fontSize: '1rem', color: '#444' }}>
          Variants ({filteredItems.length})
        </h5>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Category Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}>
            <FontAwesomeIcon icon={faFilter} style={{ fontSize: '11px', color: '#888', marginRight: '5px' }} />
            <select 
              value={filterCategory} 
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            {isEditing ? (
              <>
                <button className="btn btn-sm btn-outline-primary" onClick={() => setShowAddRow(true)}><FontAwesomeIcon icon={faPlus} /></button>
                <button className="btn btn-sm btn-success" onClick={() => { setIsEditing(false); setShowAddRow(false); }}><FontAwesomeIcon icon={faCheck} /> Done</button>
              </>
            ) : (
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setIsEditing(true)}><FontAwesomeIcon icon={faEdit} /> Edit</button>
            )}
          </div>
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
          {isEditing && showAddRow && (
            <tr style={{ background: '#fff9db' }}>
              <td style={{ textAlign: 'center' }}>-</td>
              <td><input className="form-control-sm" value={newDesc.category} onChange={e => setNewDesc({...newDesc, category: e.target.value})} style={{ width: '100%' }} /></td>
              <td><input className="form-control-sm" value={newDesc.version_name} onChange={e => setNewDesc({...newDesc, version_name: e.target.value})} style={{ width: '100%' }} /></td>
              <td><textarea className="form-control-sm" rows={2} value={newDesc.content} onChange={e => setNewDesc({...newDesc, content: e.target.value})} style={{ width: '100%' }} /></td>
              <td style={{ textAlign: 'center' }}>
                <button className="btn-icon text-success" onClick={handleAdd} style={{ border: 'none', background: 'none' }}><FontAwesomeIcon icon={faCheck} /></button>
              </td>
            </tr>
          )}

          {currentItems.length > 0 ? currentItems.map(d => (
            <tr key={d.id} style={{ borderBottom: '1px solid #eee', background: d.is_active ? '#f1f8ff' : 'transparent' }}>
              <td style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleToggleActive(d.id)}>
                <FontAwesomeIcon icon={d.is_active ? faCheckCircle : faCircle} color={d.is_active ? '#007bff' : '#ccc'} />
              </td>
              
              {isEditing ? (
                <>
                  <td><input className="form-control-sm" defaultValue={d.category} onBlur={(e) => handleUpdate(d.id, { category: e.target.value })} style={{ width: '100%' }} /></td>
                  <td><input className="form-control-sm" defaultValue={d.version_name} onBlur={(e) => handleUpdate(d.id, { version_name: e.target.value })} style={{ width: '100%' }} /></td>
                  <td><textarea className="form-control-sm" rows={2} defaultValue={d.content} onBlur={(e) => handleUpdate(d.id, { content: e.target.value })} style={{ width: '100%', resize: 'vertical' }} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon text-danger" onClick={() => handleDelete(d.id)} style={{ border: 'none', background: 'none' }}><FontAwesomeIcon icon={faTrash} /></button>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ padding: '8px' }}><b>{d.category}</b></td>
                  <td style={{ padding: '8px', color: '#666' }}>{d.version_name}</td>
                  <td style={{ padding: '8px', lineHeight: '1.4' }}>{d.content}</td>
                </>
              )}
            </tr>
          )) : (
            <tr><td colSpan={isEditing ? 5 : 4} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No variants found for this category.</td></tr>
          )}
        </tbody>
      </table>

      {/* Pagination (Only shows if total pages > 1) */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px', gap: '15px', fontSize: '13px' }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ border: 'none', background: 'none', color: currentPage === 1 ? '#ccc' : '#007bff', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span>Page <b>{currentPage}</b> of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ border: 'none', background: 'none', color: currentPage === totalPages ? '#ccc' : '#007bff', cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DescriptionManager;