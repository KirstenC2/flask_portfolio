import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSave, faTimes,
  faSun, faCloud, faCloudRain, faCloudSun, faCalendarDay, faQuoteLeft,
  faFaceSmileWink, faFaceFrown, faFaceAngry, faMeh
} from '@fortawesome/free-solid-svg-icons';
import './DiaryPanel.css'; // Standardized admin styles
import '../../../common/global.css';
import Calendar from 'react-calendar';
const getStatusColor = (status) => {
  const colors = { sunny: '#FFD700', cloudy: '#A9A9A9', rainy: '#1E90FF', default: '#6c757d' };
  return colors[status?.toLowerCase()] || colors.default;
};

const getWeatherIcon = (weather) => {
  const icons = { sunny: faSun, cloudy: faCloud, rainy: faCloudRain, default: faCloudSun };
  return icons[weather?.toLowerCase()] || icons.default;
};

const getEmotionIcon = (emotion) => {
  const icons = {
    happy: faFaceSmileWink,
    sad: faFaceFrown,
    angry: faFaceAngry,
    neutral: faMeh  // Changed from faFaceNeutral to faMeh
  };
  return icons[emotion?.toLowerCase()] || icons.neutral;
};
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const Diary = () => {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentDiary, setCurrentDiary] = useState(null);

  const [formData, setFormData] = useState({
    weather: 'sunny',
    date: new Date().toISOString().split('T')[0],
    content: '',
    emotion: 'happy'
  });

  const weatherOptions = ['sunny', 'cloudy', 'rainy'];
  const emotionOptions = ['happy', 'sad', 'angry', 'neutral', 'tired'];
  useEffect(() => { fetchDiaries(); }, []);
  const hasDiaryOnDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  return diaries.some(d => {
    // Compare string to string, avoiding timezone shifts
    const diaryDate = new Date(d.date).toLocaleDateString('en-CA');
    return diaryDate === dateString;
  });
};

  // 處理點擊日曆日期
  const handleDateClick = (date) => {
  // Use local time methods to get the year, month, and day
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const foundDiary = diaries.find(d => {
    // Ensure the comparison is also done on the YYYY-MM-DD string
    const diaryDate = new Date(d.date).toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD
    return diaryDate === dateString;
  });

  if (foundDiary) {
    setCurrentDiary(foundDiary);
    setEditMode(false);
  } else {
    setCurrentDiary(null);
    setFormData({
      ...formData,
      date: dateString, // This sets the form to exactly what you clicked
      content: ''
    });
    setEditMode(true);
  }
};
  const fetchDiaries = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/diary');
      if (!response.ok) throw new Error('Failed to fetch diaries');
      const result = await response.json();
      setDiaries(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/diary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete');
      setCurrentDiary(null);
      await fetchDiaries();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectDiary = (diary) => {
    setCurrentDiary(diary);
    setEditMode(false);
  };

  const handleOpenCreate = () => {
    setCurrentDiary(null);
    setFormData({
      weather: 'sunny',
      date: new Date().toISOString().split('T')[0],
      content: '',
      emotion: 'happy'
    });
    setEditMode(true);
  };

  const handleOpenEdit = () => {
    setFormData({
      weather: currentDiary.weather,
      date: formatDateForInput(currentDiary.date),
      content: currentDiary.content,
      emotion: currentDiary.emotion
    });
    setEditMode(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isUpdating = currentDiary && currentDiary.id;
      const url = isUpdating
        ? `http://localhost:5001/api/diary/${currentDiary.id}`
        : 'http://localhost:5001/api/diary';

      const response = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Save failed');

      setEditMode(false);
      await fetchDiaries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      {/* LEFT SIDE: DIARY LIST */}
      <div className={`list-section ${editMode || currentDiary ? 'shrink' : ''}`}>
        <div className="section-header">
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <FontAwesomeIcon icon={faPlus} /> New Entry
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        <div className="calendar-card">
          <Calendar
            onClickDay={handleDateClick}
            prevLabel={<span className="nav-arrow">‹</span>}
            nextLabel={<span className="nav-arrow">›</span>}
            formatShortWeekday={(locale, date) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
            tileContent={({ date, view }) => {
              if (view === 'month' && hasDiaryOnDate(date)) {
                return (
                  <div className="chalk-marker">
                    <span className="chalk-x">✕</span>
                  </div>
                );
              }
              return <div className="chalk-spacer"></div>;
            }}
          />
        </div>
        {/* <div className="experience-items-list">
          {diaries.map(diary => (
            <div
              key={diary.id}
              className={`experience-card-item ${currentDiary?.id === diary.id ? 'active' : ''}`}
              onClick={() => handleSelectDiary(diary)}
            >
              <div className="card-main">
                <div className="card-icon">
                  <FontAwesomeIcon
                    icon={getWeatherIcon(diary.weather)}
                    style={{ color: getStatusColor(diary.weather) }}
                  />
                </div>
                <div className="card-info">
                  <div className="post-title-cell">{new Date(diary.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div className="date-text line-clamp">{diary.content.substring(0, 60)}...</div>
                </div>
              </div>
            </div>
          ))}
        </div> */}
      </div>

      {/* RIGHT SIDE: EDITOR / DETAILS */}
      {(editMode || currentDiary) && (
        <div className="editor-sidepanel">
          <div className="sidepanel-header">
            <h2>{editMode ? (currentDiary ? 'Edit Entry' : 'New Entry') : 'Entry Details'}</h2>
            <button className="btn-close" onClick={() => { setEditMode(false); setCurrentDiary(null); }}>✕</button>
          </div>

          {editMode ? (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row-group">
                <div className="form-row">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Weather</label>
                  <select
                    className="form-control"
                    value={formData.weather}
                    onChange={e => setFormData({ ...formData, weather: e.target.value })}
                  >
                    {weatherOptions.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>

              </div>
              <div className="form-row">
                <label>Emotion</label>
                <select
                  className="form-control"
                  value={formData.emotion}
                  onChange={e => setFormData({ ...formData, emotion: e.target.value })}
                >
                  {emotionOptions.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-row">
                <label>Content</label>
                <textarea
                  className="form-control markdown-editor"
                  rows={15}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your thoughts here..."
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <FontAwesomeIcon icon={faSave} /> {submitting ? 'Saving...' : 'Save Entry'}
                </button>
                <button type="button" className="btn" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="experience-view">
              <div className="view-header">
                <h3>{new Date(currentDiary.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <p className="company-subtitle">
                  <FontAwesomeIcon
                    icon={getWeatherIcon(currentDiary.weather)}
                    style={{ color: getStatusColor(currentDiary.weather), marginRight: '8px' }}
                  />
                  Status: {currentDiary.weather.charAt(0).toUpperCase() + currentDiary.weather.slice(1)}
                </p>
              </div>

              <div className="view-content">
                <label>Emotion:</label>
                <FontAwesomeIcon icon={getEmotionIcon(currentDiary.emotion)} /> {currentDiary.emotion.charAt(0).toUpperCase() + currentDiary.emotion.slice(1)}
                <label><FontAwesomeIcon icon={faQuoteLeft} /> My Thoughts</label>
                <p className="description-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                  {currentDiary.content}
                </p>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleOpenEdit}>
                  <FontAwesomeIcon icon={faEdit} /> Edit Entry
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(currentDiary.id)}>
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

export default Diary;