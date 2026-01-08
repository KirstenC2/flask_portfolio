import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook, faPlus, faEdit, faTrash, faSave, faTimes, faSpinner,
  faCloudSun, faCloudRain, faSun, faCloud
} from '@fortawesome/free-solid-svg-icons';
import './DiaryPanel.css';

const getStatusColor = (status) => {
  const colors = { sunny: '#FFD700', cloudy: '#A9A9A9', rainy: '#1E90FF', default: '#6c757d' };
  return colors[status?.toLowerCase()] || colors.default;
};

const getWeatherIcon = (weather) => {
  const icons = { sunny: faSun, cloudy: faCloud, rainy: faCloudRain, default: faCloudSun };
  return icons[weather?.toLowerCase()] || icons.default;
};
// Add this function at the top of your component file, outside the component
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

  // currentDiary MUST hold the object with the .id property
  const [currentDiary, setCurrentDiary] = useState(null);

  const [formData, setFormData] = useState({
    weather: 'sunny',
    date: new Date().toISOString().split('T')[0],
    content: ''
  });

  const weatherOptions = ['sunny', 'cloudy', 'rainy'];

  useEffect(() => {
    fetchDiaries();
  }, []);

  const fetchDiaries = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/diary');
      if (!response.ok) throw new Error('Failed to fetch diaries');
      const result = await response.json();
      setDiaries(result.data || []);
      return result.data || [];
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5001/api/diary/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
       });
      if (!response.ok) throw new Error('Failed to delete diary');
      await fetchDiaries();
      console.log("Deleted diary with id:", id);
    } catch (err) {
      console.error('Error deleting diary:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    console.log("Submitting form with:", { currentDiary, formData });

    try {
      const isUpdating = currentDiary && currentDiary.id;
      const method = isUpdating ? 'PUT' : 'POST';
      const url = isUpdating
        ? `http://localhost:5001/api/diary/${currentDiary.id}`
        : 'http://localhost:5001/api/diary';

      console.log('Submitting:', { method, url, isUpdating, formData });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Save failed');
      }

      // Refresh the data
      await fetchDiaries();

      // Reset form and state
      setFormData({
        weather: 'sunny',
        date: new Date().toISOString().split('T')[0],
        content: ''
      });

      if (isUpdating) {
        // If updating, keep the current diary but exit edit mode
        setEditMode(false);
      } else {
        // If creating new, reset everything
        setCurrentDiary(null);
        setEditMode(false);
      }
      console.log("Form submitted successfully");
    } catch (err) {
      console.error('Error saving diary:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="diaries-container">
      <div className="diaries-header">
        <h2>My Diary</h2>
        <button onClick={() => {
          setCurrentDiary(null); // IMPORTANT: Reset ID for new entries
          setFormData({ weather: 'sunny', date: new Date().toISOString().split('T')[0], content: '' });
          setEditMode(true);
        }} className="new-diaries-btn">
          <FontAwesomeIcon icon={faPlus} /> Add Entry
        </button>
      </div>

      <div className="diaries-content">
        <div className="diaries-list">
          {diaries.map(diary => (
            <div
              key={diary.id}
              className={`diaries-item ${currentDiary?.id === diary.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentDiary(diary);
                setEditMode(false);
              }}
            >
              <FontAwesomeIcon icon={getWeatherIcon(diary.weather)} style={{ color: getStatusColor(diary.weather) }} />
              <span>{new Date(diary.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        <div className="diaries-detail">
          {editMode ? (
            
            <form className="diaries-form-container" onSubmit={handleSubmit}>

              <h3>{currentDiary?.id ? 'Edit Entry' : 'New Entry'}</h3>
              <div className="form-group">
                <label htmlFor="date">Date*</label>
              
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
              <select
                value={formData.weather}
                onChange={e => setFormData({ ...formData, weather: e.target.value })}
              >
                {weatherOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              />
              <div className="form-buttons">
                <button type="submit" disabled={submitting} className="save-btn">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
              </div>
            </form>
          ) : currentDiary ? (
            <div>
              
              <div className="diaries-header">
                <h3>{new Date(currentDiary.date).toLocaleDateString()}</h3>
                <div className='form-buttons'>
                <button onClick={() => {
                  if (currentDiary) {
                    setFormData({
                      weather: currentDiary.weather,
                      date: formatDateForInput(currentDiary.date),
                      content: currentDiary.content
                    });
                    setEditMode(true);
                  }
                }} className="edit-btn">
                  <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                <button className='edit-btn' onClick={() => handleDelete(currentDiary.id)} > Delete
                </button>
                </div>
              </div>
              <div className="diaries-content">
                <p>{currentDiary.content}</p>
              </div>
            </div>
          ) : (
            <p>Select an entry</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diary;