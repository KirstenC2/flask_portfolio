import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Blog.css'; // 建議將樣式抽離
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
  const [wordCount, setWordCount] = useState(0);

  const textAreaRef = useRef(null);
  const api = useMemo(() => axios.create({ baseURL: 'http://localhost:5001' }), []);

  // 計算字數
  useEffect(() => {
    setWordCount(contentMd.trim().length);
  }, [contentMd]);

  useEffect(() => {
    if (autoSlug) setSlug(slugify(title));
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
    <div className="blog-editor-wrapper">
      {/* Top Navigation / Status Bar */}
      <nav className="editor-nav">
        <div className="nav-left">
          <span className="editor-status">{wordCount} characters</span>
          {message && <span className="save-message">{message}</span>}
        </div>
        <div className="nav-right">
          <label className="import-btn">
            Import .md
            <input type="file" accept=".md" style={{ display: 'none' }} />
          </label>
          <button className="btn-publish" onClick={submit}>Publish Post</button>
        </div>
      </nav>

      <main className="editor-main">
        {/* Left Side: Editor */}
        <section className="editor-pane">
          <input
            className="title-field"
            placeholder="Article Title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="meta-info">
            <div className="slug-group">
              <span className="prefix">/post/</span>
              <input value={slug} onChange={onSlugChange} placeholder="url-slug" />
              <label><input type="checkbox" checked={autoSlug} onChange={e => setAutoSlug(e.target.checked)} /> Auto</label>
            </div>
            <input
              className="tag-field"
              placeholder="Add tags (comma separated)..."
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <div style={{
            marginBottom: 8,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap', // 關鍵：允許按鈕換行
            background: '#2c3e50',
            padding: '8px',
            borderRadius: '4px 4px 0 0',
            alignItems: 'center'
          }}>
            {toolbar.map(btn => (
              <button
                key={btn.label}
                type="button"
                className="btn"
                onClick={btn.onClick}
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  backgroundColor: '#3e4f5f',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {btn.label}
              </button>
            ))}
            {/* 右側標籤 */}
            <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '12px', paddingRight: '8px' }}>Editor</span>
          </div>

          <textarea
            ref={textAreaRef}
            className="markdown-textarea"
            placeholder="Tell your story..."
            value={contentMd}
            onChange={e => setContentMd(e.target.value)}
          />
        </section>

        {/* Right Side: Live Preview */}
        <section className="preview-pane">
          <div className="preview-header">LIVE PREVIEW</div>
          <article className="prose">
            <h1>{title || "Untitled Post"}</h1>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {contentMd || "*Your content will appear here...*"}
            </ReactMarkdown>
          </article>
        </section>
      </main>
    </div>
  );
}