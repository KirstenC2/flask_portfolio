import React, { useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import '../styles/DiaryCalendar.css';

const DiaryCalendar = ({ 
    diaries, 
    onDateClick, 
    activeDate, 
    dateField = 'date' // Default to 'date' to avoid breaking other components
}) => {
  
  // Memoize the set for performance
  const recordedDates = useMemo(() => {
    return new Set(diaries.map(d => {
        // Use the dynamic dateField prop (log_date or date)
        const dateValue = d[dateField];
        return dateValue ? new Date(dateValue).toLocaleDateString('en-CA') : null;
    }).filter(Boolean));
  }, [diaries, dateField]);

  const hasDiaryOnDate = (date) => {
    const dateString = date.toLocaleDateString('en-CA');
    return recordedDates.has(dateString);
  };

  return (
    <div className="calendar-card">
      <Calendar
        value={activeDate}
        onClickDay={onDateClick}
        prevLabel={<span className="nav-arrow">‹</span>}
        nextLabel={<span className="nav-arrow">›</span>}
        prev2Label={null}
        next2Label={null}
        formatShortWeekday={(locale, date) => 
          ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
        }
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
        tileClassName={({ date, view }) => {
          return (view === 'month' && hasDiaryOnDate(date)) ? 'has-entry' : null;
        }}
      />
    </div>
  );
};

export default DiaryCalendar;