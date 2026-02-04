import React from 'react';
import { Calendar, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faCloud, faCloudRain, faCloudSun } from '@fortawesome/free-solid-svg-icons';

const getStatusColor = (status) => {
    const colors = { sunny: '#FFD700', cloudy: '#A9A9A9', rainy: '#1E90FF', default: '#6c757d' };
    return colors[status?.toLowerCase()] || colors.default;
};

const getWeatherIcon = (weather) => {
    const icons = { sunny: faSun, cloudy: faCloud, rainy: faCloudRain, default: faCloudSun };
    return icons[weather?.toLowerCase()] || icons.default;
};

const DiaryCalendar = ({ diaries, onDateClick, activeDate, onActiveStartDateChange }) => {
    
    const dateCellRender = (value) => {
        const dateString = value.format('YYYY-MM-DD');
        const diary = diaries.find(d => dayjs(d.date).format('YYYY-MM-DD') === dateString);

        if (!diary) return null;

        return (
            <Tooltip title={`${diary.emotion}: ${diary.content.substring(0, 15)}...`}>
                <div style={{ textAlign: 'center', marginTop: '5px' }}>
                    <FontAwesomeIcon 
                        icon={getWeatherIcon(diary.weather)} 
                        style={{ color: getStatusColor(diary.weather), fontSize: '1.2em' }} 
                    />
                </div>
            </Tooltip>
        );
    };

    return (
        <Calendar 
            value={dayjs(activeDate)}
            onSelect={(value) => onDateClick(value.toDate())}
            onPanelChange={(value) => {
                onActiveStartDateChange({ activeStartDate: value.toDate() });
            }}
            cellRender={(current, info) => {
                if (info.type === 'date') return dateCellRender(current);
                return info.originNode;
            }}
        />
    );
};

export default DiaryCalendar;