import React, { useEffect, useState } from 'react';

const LifeEventsPanel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
    order: 0,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:5001/api/admin/life-events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch life events');
      const data = await res.json();
      setEvents(data);
    } catch (e) {
      console.error('Error fetching life events:', e);
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

  const onCancel = () => {
    if (current) onSelect(current);
    else setForm({ title: '', description: '', start_date: '', end_date: '', is_current: false, order: 0 });
    setEditMode(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const method = current ? 'PUT' : 'POST';
      const url = current
        ? `http://localhost:5001/api/admin/life-events/${current.id}`
        : 'http://localhost:5001/api/admin/life-events';
      const body = {
        ...form,
        // send empty strings as null for dates
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        order: Number(form.order) || 0,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save life event');
      await fetchEvents();
      setEditMode(false);
      if (!current) setCurrent(null);
    } catch (e) {
      console.error('Error saving life event:', e);
      setError('Failed to save life event.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!current) return;
    if (!window.confirm(`Delete life event: "${current.title}"?`)) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5001/api/admin/life-events/${current.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete life event');
      await fetchEvents();
      setCurrent(null);
    } catch (e) {
      console.error('Error deleting life event:', e);
      setError('Failed to delete life event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="life-events-panel">
      <div className="panel-header">
        <button className="btn" onClick={onCreateNew}>New Life Event</button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="panel-body" style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h3>Life Events</h3>
          {loading && !events.length ? (
            <p>Loading...</p>
          ) : events.length === 0 ? (
            <div>
              <p>No life events found.</p>
              <button onClick={onCreateNew}>Create your first life event</button>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {events.map((ev) => (
                <li key={ev.id}
                    onClick={() => onSelect(ev)}
                    style={{ padding: '8px 12px', border: '1px solid #eee', marginBottom: 8, cursor: 'pointer', background: current && current.id === ev.id ? '#f5f7ff' : '#fff' }}>
                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{ev.start_date?.slice(0,10)}{ev.end_date ? ` - ${ev.end_date.slice(0,10)}` : (ev.is_current ? ' - Present' : '')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ flex: 2 }}>
          {!editMode && !current ? (
            <div>Select an event or create a new one</div>
          ) : editMode ? (
            <form onSubmit={onSubmit}>
              <div style={{ display: 'grid', gap: 12 }}>
                <label>
                  Title*
                  <input name="title" value={form.title} onChange={onChange} required />
                </label>
                <label>
                  Description
                  <textarea name="description" value={form.description} onChange={onChange} rows={4} />
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ flex: 1 }}>
                    Start Date
                    <input type="date" name="start_date" value={form.start_date} onChange={onChange} />
                  </label>
                  <label style={{ flex: 1 }}>
                    End Date
                    <input type="date" name="end_date" value={form.end_date} onChange={onChange} disabled={form.is_current} />
                  </label>
                </div>
                <label>
                  <input type="checkbox" name="is_current" checked={form.is_current} onChange={onChange} /> Currently ongoing
                </label>
                <label>
                  Order
                  <input type="number" name="order" value={form.order} onChange={onChange} />
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                  <button type="button" onClick={onCancel}>Cancel</button>
                </div>
              </div>
            </form>
          ) : (
            <div>
              <h3>{current?.title}</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{current?.description}</p>
              <p>
                {current?.start_date?.slice(0,10)}
                {current?.end_date ? ` - ${current.end_date.slice(0,10)}` : (current?.is_current ? ' - Present' : '')}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setEditMode(true)}>Edit</button>
                <button onClick={onDelete}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LifeEventsPanel;
