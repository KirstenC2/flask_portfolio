import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BlogEditor() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [contentMd, setContentMd] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const textAreaRef = useRef(null);
  const api = useMemo(() => axios.create({ baseURL: 'http://localhost:5001' }), []);

  useEffect(() => {
    if (autoSlug) {
      setSlug(slugify(title));
    }
  }, [title, autoSlug]);

  const onSlugChange = (e) => {
    setSlug(e.target.value);
    setAutoSlug(false);
  };

  const applyWrap = useCallback((before, after = before) => {
    const ta = textAreaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = contentMd.substring(start, end) || 'text';
    const next = contentMd.substring(0, start) + before + sel + after + contentMd.substring(end);
    setContentMd(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  }, [contentMd]);

  const insertAtCursor = useCallback((text) => {
    const ta = textAreaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = contentMd.substring(0, start) + text + contentMd.substring(end);
    setContentMd(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, [contentMd]);

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      submit(e);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await api.post('/api/admin/posts', {
        title,
        slug: slug || undefined,
        content_md: contentMd,
        tags: tags.split(',').map(s => s.trim()).filter(Boolean)
      }, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setMessage(`Created: ${res.data.title}`);
      setTitle(''); setSlug(''); setContentMd(''); setTags(''); setAutoSlug(true);
    } catch (e) {
      console.error(e);
      setMessage('Failed to create post');
    }
  };

  const toolbar = useMemo(() => ([
    { label: 'H1', onClick: () => insertAtCursor('\n# ') },
    { label: 'H2', onClick: () => insertAtCursor('\n## ') },
    { label: 'Bold', onClick: () => applyWrap('**') },
    { label: 'Italic', onClick: () => applyWrap('*') },
    { label: 'Code', onClick: () => applyWrap('`') },
    { label: 'Link', onClick: () => applyWrap('[', '](https://)') },
    { label: 'List', onClick: () => insertAtCursor('\n- ') },
    { label: 'Code Block', onClick: () => applyWrap('\n```\n', '\n```\n') },
  ]), [applyWrap, insertAtCursor]);

  return (
    <div className="container" style={{ padding: '5rem 1.5rem' }}>
      <h1>New Blog Post</h1>
      {message && <p>{message}</p>}
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="form-control" />
            </div>
            <div style={{ marginBottom: '0.5rem', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label>Slug</label>
                <input value={slug} onChange={onSlugChange} className="form-control" />
              </div>
              <label style={{ whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={autoSlug} onChange={e => setAutoSlug(e.target.checked)} /> Auto
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Tags (comma separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} className="form-control" />
            </div>

            <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {toolbar.map(btn => (
                <button key={btn.label} type="button" className="btn" onClick={btn.onClick}>{btn.label}</button>
              ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Content (Markdown)</label>
              <textarea ref={textAreaRef} onKeyDown={onKeyDown} value={contentMd} onChange={e => setContentMd(e.target.value)} className="form-control" rows={18} />
            </div>
            <button type="submit" className="btn btn-primary">Create (Ctrl/Cmd+S)</button>
          </div>

          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label>Preview</label>
            </div>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 16, minHeight: 300, background: '#fff' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentMd || '*Nothing to preview yet*'}</ReactMarkdown>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
