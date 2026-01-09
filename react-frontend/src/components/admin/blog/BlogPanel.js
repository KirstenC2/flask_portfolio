import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './BlogPanel.css'; // Import the CSS file below

const api = axios.create({ baseURL: 'http://localhost:5001' });

function TagsPills({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="tags-container">
      {tags.map((t, i) => (
        <span key={i} className="tag-pill">{t}</span>
      ))}
    </div>
  );
}

export default function BlogPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const emptyForm = useMemo(() => ({ id: null, title: '', slug: '', tags: '', content_md: '' }), []);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const authHeader = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadPosts = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/posts');
      setPosts(res.data || []);
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      content_md: form.content_md,
    };

    try {
      if (editingId) {
        await api.put(`/api/admin/posts/${editingId}`, payload, { headers: authHeader() });
      } else {
        await api.post('/api/admin/posts', payload, { headers: authHeader() });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadPosts();
    } catch (e) {
      setError('Save failed');
    }
  };

  const onEdit = (p) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      title: p.title || '',
      slug: p.slug || '',
      tags: (p.tags || []).join(', '),
      content_md: p.content_md || '',
    });
    setShowForm(true);
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/api/admin/posts/${id}`, { headers: authHeader() });
      await loadPosts();
    } catch (e) {
      setError('Delete failed');
    }
  };

  const onImportMd = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      setForm(f => ({ ...f, content_md: text }));
    } catch (e) {
      setError('Failed to read file');
    }
  };

  return (
    <div className="admin-container">
      {/* LEFT SIDE: POST LIST */}
      <div className={`list-section ${showForm ? 'shrink' : ''}`}>
        <div className="section-header">
          <h1>Blog Management</h1>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
              + Create New Post
            </button>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">Loading posts...</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Content</th>
                  {!showForm && <th>Slug</th>}
                  {!showForm && <th>Dates</th>}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="post-title-cell">{p.title}</div>
                      <TagsPills tags={p.tags} />
                    </td>
                    {!showForm && <td><code className="slug-text">/{p.slug}</code></td>}
                    {!showForm && (
                      <td className="date-text">
                        Updated: {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                    )}
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm" onClick={() => onEdit(p)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => onDelete(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: EDITOR PANEL */}
      {showForm && (
        <div className="editor-sidepanel">
          <div className="sidepanel-header">
            <h2>{editingId ? 'Edit Post' : 'Create Post'}</h2>
            <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
          </div>
          
          <form onSubmit={onSubmit} className="form">
            <div className="form-row">
              <label>Title</label>
              <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Post title..." />
            </div>
            
            <div className="form-row-group">
              <div className="form-row">
                <label>Slug</label>
                <input className="form-control" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-friendly-slug" />
              </div>
              <div className="form-row">
                <label>Tags</label>
                <input className="form-control" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="react, tutorial..." />
              </div>
            </div>

            <div className="form-row">
              <label>Content (Markdown)</label>
              <textarea className="form-control markdown-editor" rows={15} value={form.content_md} onChange={e => setForm(f => ({ ...f, content_md: e.target.value }))} placeholder="Write your content here..." />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Publish Post'}</button>
              <label className="btn">
                Import .md
                <input type="file" accept=".md" style={{ display: 'none' }} onChange={e => onImportMd(e.target.files?.[0])} />
              </label>
              {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(false); }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}