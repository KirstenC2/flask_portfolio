import React, { useState, useEffect } from 'react';
import { Card, Select, Input, Button, Typography, Space, Divider, message, Spin } from 'antd';
import { SendOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ReportFormPage = ({ weeklyData }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTid, setSelectedTid] = useState(null);
    const [templateDetail, setTemplateDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({}); // 儲存使用者輸入：{ step_id: content }
    const [reportTitle, setReportTitle] = useState(`匯報 - ${new Date().toLocaleDateString()}`);
    // ✅ 正確寫法
    const fetchTemplates = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await axios.get('http://localhost:5001/api/admin/thinking/templates', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setTemplates(response.data);
        } catch (error) {
            console.error(error);
        }
    };
    // 1. 讀取所有模板
    useEffect(() => {
        fetchTemplates();
    }, []);

    // 2. 當切換模板時
    const handleTemplateChange = async (tid) => {
        setSelectedTid(tid);
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5001/api/admin/thinking/templates/${tid}`);
            setTemplateDetail(res.data);

            // 初始化表單數據
            const initialData = {};
            res.data.steps.forEach(step => {
                // 如果標題是 Result 或 Answer，自動帶入 WarBoard 數據
                const isAutoFill = ['result', 'answer', '答案', '結果'].includes(step.title.toLowerCase());
                initialData[step.id] = isAutoFill ? formatWeeklyData(weeklyData) : '';
            });
            setFormData(initialData);
        } finally {
            setLoading(false);
        }
    };

    // 輔助函數：格式化週報數據
    const formatWeeklyData = (data) => {
        if (!data || data.length === 0) return "本週尚無完成任務";
        return data.map(p => `【${p.title}】\n` + p.features.flatMap(f => f.tasks.map(t => `✓ ${t.content}`)).join('\n')).join('\n\n');
    };

    // 3. 提交儲存
    const handleSubmit = async () => {
        const token = localStorage.getItem('adminToken');

        // 假設 1 是 McKinsey (需要綁 project)
        const isProjectBased = selectedTid === 1;

        const payload = {
            template_id: selectedTid,
            title: reportTitle,
            contents: formData,
            ref_type: isProjectBased ? 'project' : 'weekly_report',
            // 根據類型填入不同的欄位
            // ref_if: isProjectBased ? currentProjectId : null,
            ref_tag: isProjectBased ? null : new Date().toISOString().split('T')[0]
        };

        try {
            await axios.post('http://localhost:5001/api/admin/thinking/projects', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('匯報儲存成功！');
            // clear form's input
            setFormData({});
            setReportTitle(`匯報 - ${new Date().toLocaleDateString()}`);
        } catch (e) {
            console.error(e);
            message.error('儲存失敗');
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <Card bordered={false} style={{ height: '100%', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Title level={2}><EditOutlined /> 思維框架匯報</Title>
                <Space direction="vertical" style={{ width: '100%' }} size="large">

                    {/* 模板選擇器 */}
                    <div>
                        <Text strong>選擇匯報模式：</Text>
                        <Select
                            style={{ width: '100%', marginTop: '8px' }}
                            placeholder="請選擇一個思考模板 (STAR, SCQA, SWOT...)"
                            onChange={handleTemplateChange}
                            options={templates.map(t => ({ label: `${t.category} / ${t.name}`, value: t.id }))}
                        />
                    </div>

                    {loading ? <Spin size="large" /> : templateDetail && (
                        <div className="dynamic-form">
                            <Divider />
                            <div style={{ marginBottom: '24px' }}>
                                <Text strong>報告標題：</Text>
                                <Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} style={{ marginTop: '8px' }} />
                            </div>

                            {templateDetail.steps.map(step => (
                                <div key={step.id} style={{ marginBottom: '32px', position: 'relative', paddingLeft: '20px', borderLeft: '3px solid #1890ff' }}>
                                    <Title level={5} style={{ margin: 0 }}>{step.title}</Title>
                                    <Text type="secondary" size="small">{step.prompt}</Text>
                                    <TextArea
                                        value={formData[step.id] || ''} // 防止 undefined 導致非受控組件警告
                                        onChange={e => {
                                            const val = e.target.value; // 👈 確保只取 value 字串
                                            setFormData(prev => ({ ...prev, [step.id]: val }));
                                        }}
                                        placeholder={step.placeholder}
                                        autoSize={{ minRows: 3 }}
                                        style={{ marginTop: '12px', borderRadius: '8px' }}
                                    />
                                </div>
                            ))}

                            <Button
                                type="primary"
                                size="large"
                                icon={<SendOutlined />}
                                onClick={handleSubmit}
                                block
                            >
                                儲存匯報至資料庫
                            </Button>
                        </div>
                    )}
                </Space>
            </Card>
        </div>
    );
};

export default ReportFormPage;