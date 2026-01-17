import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './BlogPanel.css'; // Import the CSS file below
import ReactMarkdown from 'react-markdown';
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

  useEffect(() => {
    // 只有在「新建」且 Slug 尚未手動修改過時才自動生成
    if (!editingId && form.title) {
      const generatedSlug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setForm(f => ({ ...f, slug: generatedSlug }));
    }
  }, [form.title, editingId]);

  const insertText = (before, after = '') => {
    const textarea = document.querySelector('.markdown-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

    setForm(f => ({ ...f, content_md: newText }));
    // 重新聚焦並選取
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

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
        <div className="editor-sidepanel professional-editor">
          <div className="sidepanel-header">
            <h2>{editingId ? '✍️ Edit Post' : '🚀 Create New Post'}</h2>
            <div className="header-actions">
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="form">
            {/* 標題與 Slug */}
            <div className="editor-meta-grid">
              <div className="form-row">
                <label>Post Title</label>
                <input className="form-control title-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Enter an engaging title..." />
              </div>
              <div className="form-row">
                <label>Slug (URL Path)</label>
                <div className="slug-input-wrapper">
                  <span>your-blog.com/post/</span>
                  <input className="form-control" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="slug-name" />
                </div>
              </div>
            </div>

            <div className="form-row">
              <label>Tags</label>
              <input className="form-control" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Separate tags with commas (e.g. React, CSS, Node)" />
            </div>

            {/* Markdown 編輯器工具列 */}
            <div className="markdown-section">
              <div className="editor-toolbar">
                <button type="button" onClick={() => insertText('**', '**')}><b>B</b></button>
                <button type="button" onClick={() => insertText('*', '*')}><i>I</i></button>
                <button type="button" onClick={() => insertText('# ')}>H1</button>
                <button type="button" onClick={() => insertText('[', '](url)')}>Link</button>
                <button type="button" onClick={() => insertText('```\n', '\n```')}>Code</button>
                <div className="toolbar-divider"></div>
                <span>Editor</span>
              </div>

              <div className="split-editor">
                <textarea
                  className="form-control markdown-editor"
                  value={form.content_md}
                  onChange={e => setForm(f => ({ ...f, content_md: e.target.value }))}
                  placeholder="Start writing in Markdown..."
                />
                <div className="markdown-preview">
                  <div className="preview-label">Live Preview</div>
                  <div className="preview-content">
                    <ReactMarkdown>{form.content_md || "*Preview will appear here...*"}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-footer">
              <div className="footer-left">
                <label className="btn-import">
                  📂 Import .md
                  <input type="file" accept=".md" style={{ display: 'none' }} onChange={e => onImportMd(e.target.files?.[0])} />
                </label>
              </div>
              <div className="footer-right">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-publish">
                  {editingId ? 'Save Changes' : 'Publish to Blog'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}