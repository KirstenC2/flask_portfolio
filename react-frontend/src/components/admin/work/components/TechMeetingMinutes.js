import React, { useState, useEffect } from 'react';
import {
  Card, Input, DatePicker, Tag, Button, Divider,
  List, Checkbox, Space, Typography, Row, Col, message, Spin
} from 'antd';
import {
  UserAddOutlined, PlusOutlined, DeleteOutlined,
  SaveOutlined, FileTextOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TechMeetingMinutes = ({ projectId, meetingId, onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [newPerson, setNewPerson] = useState('');
  
  const [meeting, setMeeting] = useState({
    title: '',
    date: dayjs(),
    attendees: ['Developer'],
    decisions: [''],
    notes: '',
    actions: [{ task: '', owner: '', done: false }]
  });

  // --- 1. READ (抓取現有紀錄) ---
  useEffect(() => {
    if (meetingId) {
      const fetchDetail = async () => {
        setFetching(true);
        try {
          const response = await fetch(`http://localhost:5001/api/admin/meetings/${meetingId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
          });
          if (response.ok) {
            const data = await response.json();
            setMeeting({
              ...data,
              date: dayjs(data.date) // 重要：String 轉回 dayjs
            });
          }
        } catch (err) {
          message.error("載入紀錄失敗");
        } finally {
          setFetching(false);
        }
      };
      fetchDetail();
    } else {
      // 如果沒有 meetingId，重置表單為預設值 (用於從歷史切換回「撰寫新會議」)
      setMeeting({
        title: '',
        date: dayjs(),
        attendees: ['Developer'],
        decisions: [''],
        notes: '',
        actions: [{ task: '', owner: '', done: false }]
      });
    }
  }, [meetingId]);

  // --- 2. CREATE & UPDATE (儲存或更新) ---
  const saveMeeting = async () => {
    if (!meeting.title.trim()) return message.warning("請輸入會議主題");
    
    setLoading(true);
    try {
      const payload = {
        project_id: projectId,
        title: meeting.title,
        date: meeting.date.format('YYYY-MM-DD HH:mm:ss'),
        attendees: meeting.attendees,
        decisions: meeting.decisions.filter(d => d.trim() !== ''),
        notes: meeting.notes,
        actions: meeting.actions.filter(a => a.task.trim() !== '')
      };

      // 根據有沒有 ID 決定 URL 和 Method
      const url = meetingId 
        ? `http://localhost:5001/api/admin/meetings/${meetingId}`
        : `http://localhost:5001/api/admin/projects/${projectId}/meetings`;
      
      const method = meetingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('儲存失敗');

      message.success(meetingId ? "會議紀錄已更新！" : "技術會議記錄已儲存！");
      
      if (onSaveSuccess) onSaveSuccess(); // 通知父組件重新整理左側列表
    } catch (error) {
      message.error("儲存失敗，請檢查後端服務");
    } finally {
      setLoading(false);
    }
  };

  // Helper: 處理 Array 欄位更新
  const updateListField = (type, index, value) => {
    const newList = [...meeting[type]];
    newList[index] = value;
    setMeeting({ ...meeting, [type]: newList });
  };

  if (fetching) return <Card><Spin tip="載入中..." style={{ width: '100%', margin: '50px 0' }} /></Card>;

  return (
    <Card style={{ height: '100%', borderRadius: '12px' }} className="shadow-lg">
      <Row gutter={16} align="bottom">
        <Col flex="auto">
          <Text type="secondary">Meeting Title</Text>
          <Input
            variant="borderless"
            placeholder="輸入技術會議主題..."
            style={{ fontSize: 28, fontWeight: 'bold', padding: '4px 0' }}
            value={meeting.title}
            onChange={e => setMeeting({ ...meeting, title: e.target.value })}
          />
        </Col>
        <Col>
          <DatePicker
            value={meeting.date}
            onChange={val => setMeeting({ ...meeting, date: val })}
          />
        </Col>
      </Row>

      <Divider />

      {/* 參與人員 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}><UserAddOutlined /> 參與人員</Title>
        <Space wrap>
          {meeting.attendees.map((person, index) => (
            <Tag
              key={index}
              closable
              onClose={() => setMeeting({ ...meeting, attendees: meeting.attendees.filter(p => p !== person) })}
              color="blue"
            >
              {person}
            </Tag>
          ))}
          <Input
            size="small"
            placeholder="新增人員"
            style={{ width: 100 }}
            value={newPerson}
            onChange={e => setNewPerson(e.target.value)}
            onPressEnter={() => {
              if (newPerson && !meeting.attendees.includes(newPerson)) {
                setMeeting({ ...meeting, attendees: [...meeting.attendees, newPerson] });
                setNewPerson('');
              }
            }}
          />
        </Space>
      </div>

      {/* 技術決策 */}
      <div style={{ marginBottom: 24, padding: 20, background: '#fffbe6', borderRadius: 12, border: '1px solid #ffe58f' }}>
        <Title level={5} style={{ color: '#d48806' }}><ThunderboltOutlined /> 關鍵技術決策 (ADR)</Title>
        {meeting.decisions.map((d, i) => (
          <Input
            key={i}
            placeholder={`決策 #${i + 1}`}
            variant="borderless"
            style={{ borderBottom: '1px solid #ffe58f', marginBottom: 8 }}
            value={d}
            onChange={e => updateListField('decisions', i, e.target.value)}
          />
        ))}
        <Button type="dashed" onClick={() => setMeeting({ ...meeting, decisions: [...meeting.decisions, ''] })} block icon={<PlusOutlined />}>
          新增決策項
        </Button>
      </div>

      {/* 討論摘要 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}><FileTextOutlined /> 討論內容摘要</Title>
        <TextArea
          rows={6}
          placeholder="支援代碼片段或討論細節..."
          value={meeting.notes}
          onChange={e => setMeeting({ ...meeting, notes: e.target.value })}
          style={{ borderRadius: 8, fontFamily: 'monospace' }}
        />
      </div>

      {/* Action Items */}
      <div style={{ marginBottom: 32 }}>
        <Title level={5}>🏁 下一步行動</Title>
        <List
          dataSource={meeting.actions}
          renderItem={(item, i) => (
            <List.Item actions={[<DeleteOutlined onClick={() => setMeeting({ ...meeting, actions: meeting.actions.filter((_, idx) => idx !== i) })} style={{ color: '#ff4d4f' }} />]}>
              <Checkbox
                checked={item.done}
                onChange={e => {
                  const newActions = [...meeting.actions];
                  newActions[i].done = e.target.checked;
                  setMeeting({ ...meeting, actions: newActions });
                }}
              />
              <Input
                placeholder="任務內容"
                variant="borderless"
                value={item.task}
                onChange={e => {
                  const newActions = [...meeting.actions];
                  newActions[i].task = e.target.value;
                  setMeeting({ ...meeting, actions: newActions });
                }}
                style={{ flex: 1, textDecoration: item.done ? 'line-through' : 'none' }}
              />
              <Input
                placeholder="負責人"
                value={item.owner}
                onChange={e => {
                  const newActions = [...meeting.actions];
                  newActions[i].owner = e.target.value;
                  setMeeting({ ...meeting, actions: newActions });
                }}
                style={{ width: 100, textAlign: 'right', color: '#8c8c8c' }}
                variant="borderless"
              />
            </List.Item>
          )}
        />
        <Button type="link" onClick={() => setMeeting({ ...meeting, actions: [...meeting.actions, { task: '', owner: '', done: false }] })} icon={<PlusOutlined />}>
          新增任務
        </Button>
      </div>

      <Button
        type="primary"
        size="large"
        icon={<SaveOutlined />}
        onClick={saveMeeting}
        loading={loading}
        block
      >
        {meetingId ? "更新會議紀錄" : "儲存記錄至資料庫"}
      </Button>
    </Card>
  );
};

export default TechMeetingMinutes;