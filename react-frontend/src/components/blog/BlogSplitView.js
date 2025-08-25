import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import BlogList from './BlogList';
import BlogPost from './BlogPost';
import './BlogSplitView.css';

export default function BlogSplitView() {
  const { slug } = useParams();
  return (
    <div className="blog-split">
      <aside className="split-left">
        <BlogList selectedSlug={slug} />
      </aside>
      <main className="split-right">
        <Routes>
          <Route index element={<div className="placeholder">Select a post from the left</div>} />
          <Route path=":slug" element={<BlogPost />} />
        </Routes>
      </main>
    </div>
  );
}
