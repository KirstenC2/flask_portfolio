import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar, faPlus, faEdit, faTrash, faCalendarAlt, 
  faHistory, faTimes, faSave
} from '@fortawesome/free-solid-svg-icons';
import '../../../common/global.css';
// Assuming you are reusing the same CSS file or similar styles
import '../../../common/global.css'; 

const LifeEventsPanel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', start_date: '', end_date: '', is_current: false, order: 0,
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5001/api/admin/life-events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      setError('Failed to load life events.');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSelect = (ev) => {
    setCurrent(ev);
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      start_date: ev.start_date ? ev.start_date.substring(0, 10) : '',
      end_date: ev.end_date ? ev.end_date.substring(0, 10) : '',
      is_current: !!ev.is_current,
      order: ev.order ?? 0,
    });
    setEditMode(false);
  };

  const onCreateNew = () => {
    setCurrent(null);
    setForm({ title: '', description: '', start_date: '', end_date: '', is_current: false, order: 0 });
    setEditMode(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const method = current ? 'PUT' : 'POST';
      const url = current
        ? `http://localhost:5001/api/admin/life-events/${current.id}`
        : 'http://localhost:5001/api/admin/life-events';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, order: Number(form.order) }),
      });
      
      setEditMode(false);
      fetchEvents();
    } catch (e) {
      setError('Failed to save life event.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!current || !window.confirm(`Delete: "${current.title}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`http://localhost:5001/api/admin/life-events/${current.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrent(null);
      fetchEvents();
    } catch (e) {
      setError('Delete failed.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="admin-container">
      {/* LEFT SIDE: LIST */}
      <div className={`list-section ${editMode || current ? 'shrink' : ''}`}>
        <div className="section-header">
          <h1>Life Events</h1>
          <button className="btn btn-primary" onClick={onCreateNew}>
            <FontAwesomeIcon icon={faPlus} /> New Event
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="experience-items-list">
          {[...events].sort((a,b) => b.order - a.order).map((ev) => (
            <div
              key={ev.id}
              className={`experience-card-item ${current?.id === ev.id ? 'active' : ''}`}
              onClick={() => onSelect(ev)}
            >
              <div className="card-main">
                <div className="card-icon"><FontAwesomeIcon icon={faStar} /></div>
                <div className="card-info">
                  <div className="post-title-cell">{ev.title}</div>
                  <div className="date-text">{formatDate(ev.start_date)}</div>
                </div>
                {ev.is_current && <span className="tag-pill">Ongoing</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: SIDEBAR EDITOR */}
      {(editMode || current) && (
        <div className="editor-sidepanel">
          <div className="sidepanel-header">
            <h2>{editMode ? (current ? 'Edit Event' : 'New Event') : 'Event Details'}</h2>
            <button className="btn-close" onClick={() => { setEditMode(false); setCurrent(null); }}>✕</button>
          </div>

          {editMode ? (
            <form onSubmit={onSubmit} className="form">
              <div className="form-row">
                <label>Title</label>
                <input 
                  className="form-control" 
                  name="title" 
                  value={form.title} 
                  onChange={onChange} 
                  required 
                />
              </div>

              <div className="form-row-group">
                <div className="form-row">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="start_date" 
                    value={form.start_date} 
                    onChange={onChange} 
                  />
                </div>
                <div className="form-row">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="end_date" 
                    value={form.end_date} 
                    onChange={onChange} 
                    disabled={form.is_current} 
                  />
                </div>
              </div>

              <div className="form-check-row">
                <input 
                  type="checkbox" 
                  id="is_current" 
                  name="is_current" 
                  checked={form.is_current} 
                  onChange={onChange} 
                />
                <label htmlFor="is_current">Currently ongoing</label>
              </div>

              <div className="form-row">
                <label>Description</label>
                <textarea 
                  className="form-control markdown-editor" 
                  name="description" 
                  rows={8} 
                  value={form.description} 
                  onChange={onChange} 
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  <FontAwesomeIcon icon={faSave} /> Save Event
                </button>
                <button type="button" className="btn" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="experience-view">
              <div className="view-header">
                <h3>{current.title}</h3>
                <p className="date-display">
                  <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(current.start_date)} — {current.is_current ? 'Present' : formatDate(current.end_date)}
                </p>
              </div>

              <div className="view-content">
                <label>Description</label>
                <p className="description-text" style={{ whiteSpace: 'pre-wrap' }}>{current.description}</p>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                  <FontAwesomeIcon icon={faEdit} /> Edit Event
                </button>
                <button className="btn btn-danger" onClick={onDelete}>
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LifeEventsPanel;