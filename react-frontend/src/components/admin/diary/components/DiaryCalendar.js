import React from 'react';
import { Calendar, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getStatusColor, getWeatherIcon } from '../../../../utils/DiaryUtils.js';


const DiaryCalendar = ({ diaries, onDateClick, activeDate, onActiveStartDateChange }) => {

    const dateCellRender = (value) => {
        // 1. 取得日期字串
        const dateString = value.format('YYYY-MM-DD');

        // 2. 尋找當天日記 (兼容 log_date 或 date 欄位)
        const diary = diaries.find(d => {
            const dDate = d.log_date || d.date; // 哪個有值就用哪個
            return dayjs(dDate).format('YYYY-MM-DD') === dateString;
        });

        if (!diary) return null;

        // 3. 獲取內容摘要 (安全處理：確保內容存在才做 substring)
        // 兼容 一般日記(content) 或 情緒日記(event_description)
        const rawContent = diary.event_description || diary.content || "";
        const summary = rawContent.length > 15
            ? rawContent.substring(0, 15) + "..."
            : rawContent;

        // 4. 獲取天氣與顏色 (如果沒有這些欄位就給預設值)
        const weather = diary.weather || 'sunny';
        const emotionText = diary.keyword || diary.emotion || "";

        return (
            <Tooltip title={summary ? `${emotionText}: ${summary}` : emotionText}>
                <div className="calendar-entry-render" style={{ textAlign: 'center', marginTop: '5px' }}>
                    <FontAwesomeIcon
                        icon={getWeatherIcon(weather)}
                        style={{ color: getStatusColor(weather), fontSize: '1.2em' }}
                    />
                    {emotionText && (
                        <div className="mood-badge-render">
                            {emotionText}
                        </div>
                    )}
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