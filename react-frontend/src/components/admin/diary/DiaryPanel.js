import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage, faEdit, faTrash, faSave, faTimes,
  faSun, faCloud, faCloudRain, faCloudSun, faCalendarDay, faQuoteLeft
} from '@fortawesome/free-solid-svg-icons';
import './DiaryPanel.css';
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

const getEmotionIconImage = (emotion) => {
  const icons = {
    happy: 'happy.png',
    sad: 'sad.png',
    angry: 'angry.png',
    neutral: 'neutral.png',
    tired: 'tired.png',
    helpless: 'helpless.png'
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
  const [selectedFile, setSelectedFile] = useState(null);

  // NEW: Added missing state for image URLs
  const [displayUrls, setDisplayUrls] = useState({});

  const [formData, setFormData] = useState({
    weather: 'sunny',
    date: new Date().toISOString().split('T')[0],
    content: '',
    image_url: '',
    emotion: 'happy'
  });

  const weatherOptions = ['sunny', 'cloudy', 'rainy'];
  const emotionOptions = ['happy', 'sad', 'angry', 'neutral', 'tired', 'helpless'];

  useEffect(() => {
    fetchDiaries();
  }, []);

  // FIXED: Corrected reference from currentProject to currentDiary
  useEffect(() => {
    if (currentDiary?.image_url && !currentDiary.image_url.startsWith('http')) {
      fetchImageUrl(currentDiary.image_url);
    }
  }, [currentDiary]);

  // FIXED: Added safety checks to prevent sending "undefined" to backend
  const fetchImageUrl = async (path) => {
    if (!path || displayUrls[path] || path === 'undefined') return;

    const parts = path.split('/');
    if (parts.length < 2) return;

    const bucket = parts[0];
    const filename = parts[1];

    try {
      const response = await fetch(`http://localhost:5001/api/attachments/view/${bucket}/${filename}`);
      if (!response.ok) return;
      const data = await response.json();

      if (data.url) {
        setDisplayUrls(prev => ({ ...prev, [path]: data.url }));
      }
    } catch (err) {
      console.error("Failed to get image link", err);
    }
  };

  const hasDiaryOnDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return diaries.some(d => {
      const diaryDate = new Date(d.date).toLocaleDateString('en-CA');
      return diaryDate === dateString;
    });
  };

  const handleDateClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const foundDiary = diaries.find(d => {
      const diaryDate = new Date(d.date).toLocaleDateString('en-CA');
      return diaryDate === dateString;
    });

    if (foundDiary) {
      setCurrentDiary(foundDiary);
      setEditMode(false);
    } else {
      setCurrentDiary(null);
      setFormData({
        ...formData,
        date: dateString,
        content: '',
        image_url: ''
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

  const handleOpenCreate = () => {
    setCurrentDiary(null);
    setFormData({
      weather: 'sunny',
      date: new Date().toISOString().split('T')[0],
      content: '',
      image_url: '',
      emotion: 'happy'
    });
    setEditMode(true);
  };

  const handleOpenEdit = () => {
    setFormData({
      weather: currentDiary.weather,
      date: formatDateForInput(currentDiary.date),
      content: currentDiary.content,
      image_url: currentDiary.image_url,
      emotion: currentDiary.emotion
    });
    setEditMode(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let finalImagePath = formData.image_url;

      if (selectedFile) {
        const bucket = 'diary';
        // Clean filename to avoid special character issues
        const cleanFileName = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '_')}`;

        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const uploadRes = await fetch(`http://localhost:5001/api/attachments/upload/${bucket}/${cleanFileName}`, {
          method: 'POST',
          body: uploadData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Upload failed');
        }

        const uploadResult = await uploadRes.json();
        finalImagePath = uploadResult.path;
      }

      const diaryPayload = { ...formData, image_url: finalImagePath };
      const isUpdating = currentDiary && currentDiary.id;
      const url = isUpdating ? `http://localhost:5001/api/diary/${currentDiary.id}` : 'http://localhost:5001/api/diary';

      const response = await fetch(url, {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diaryPayload)
      });

      if (!response.ok) throw new Error('Save diary failed');

      setEditMode(false);
      setSelectedFile(null);
      await fetchDiaries();
      // Reset current diary to show the updated version
      setCurrentDiary(null);
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
          {/* <button className="btn btn-primary" onClick={handleOpenCreate}>
            <FontAwesomeIcon icon={faPlus} /> New Entry
          </button> */}
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
      </div>

      {/* RIGHT SIDE: EDITOR / DETAILS */}
      <div className="editor-sidepanel">
        {editMode || currentDiary ? (
          <>
            <div className="sidepanel-header">
              <h2>{editMode ? (currentDiary ? 'Edit Entry' : 'New Entry') : 'Entry Details'}</h2>
              <button
                className="btn-close"
                onClick={() => {
                  setEditMode(false);
                  setCurrentDiary(null);
                }}
              >
                ✕
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleSubmit} className="form">
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
                    required
                  >
                    {weatherOptions.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Mood</label>
                  <select
                    className="form-control"
                    value={formData.emotion}
                    onChange={e => setFormData({ ...formData, emotion: e.target.value })}
                    required
                  >
                    {emotionOptions.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Your Thoughts</label>
                  <textarea
                    className="form-control"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    rows="8"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image_file">Entry Image</label>
                  <input
                    type="file"
                    id="image_file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />

                  {selectedFile && (
                    <div className="image-preview" style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: '150px', marginTop: '10px', borderRadius: '5px' }} />
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        style={{ position: 'absolute', top: '15px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                      <p style={{ fontSize: '12px', color: '#666' }}>Ready to upload</p>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    <FontAwesomeIcon icon={faSave} />
                    {submitting ? 'Saving...' : 'Save Entry'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      if (!currentDiary) setCurrentDiary(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="view-content">
                <div className="diary-header">
                  <h3>
                    {new Date(currentDiary.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <div className="diary-meta">
                    <span className="mood-tag">
                      <img
                        src={`/emoticons/${getEmotionIconImage(currentDiary.emotion)}`}
                        alt={currentDiary.emotion}
                        className="emotion-icon"
                      />
                    </span>
                  </div>
                  <div className="diary-meta">
                    <span className="weather-tag">
                      <FontAwesomeIcon
                        icon={getWeatherIcon(currentDiary.weather)}
                        style={{ color: getStatusColor(currentDiary.weather) }}
                      />{' '}
                      {currentDiary.weather.charAt(0).toUpperCase() + currentDiary.weather.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="diary-content">
                  <h4><FontAwesomeIcon icon={faQuoteLeft} /> My Thoughts</h4>
                  <p>{currentDiary.content}</p>
                  {/* 在 view-content 內部的 diary-content 下方添加 */}
                  {/* FIXED: Added proper image container with fallback */}
                  {currentDiary.image_url && (
                    <div className="diary-image-display" style={{ marginTop: '20px' }}>
                      <img
                        src={displayUrls[currentDiary.image_url] || ''}
                        alt="Diary entry"
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        onLoad={() => console.log("Image loaded")}
                        onError={(e) => {
                          console.log("Image load error, retrying...");
                          fetchImageUrl(currentDiary.image_url);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="diary-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleOpenEdit}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(currentDiary.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FontAwesomeIcon icon={faCalendarDay} size="3x" />
            </div>
            <h3>How was your day?</h3>
            <p>Select a date from the calendar to view your thoughts or create a new entry.</p>
            <button
              className="btn btn-primary"
              onClick={handleOpenCreate}
            > New Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diary;