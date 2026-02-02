import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Input, Typography, Space, Spin, message, Progress, Tag } from 'antd';
import { SaveOutlined, BulbOutlined } from '@ant-design/icons';

import _ from 'lodash'; // 用於 debounce

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const ThinkingProjectDetail = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 1. 取得專案詳情
    const fetchDetail = async () => {
        try {
            const data = await financeApi.getThinkingProjectDetail(id);
            setProject(data);
        } catch (err) {
            message.error("讀取失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetail(); }, [id]);

    // 2. 自動儲存邏輯 (Debounced Save)
    const saveContent = async (updatedSteps) => {
        setSaving(true);
        try {
            const payload = {
                contents: updatedSteps.map(s => ({ step_id: s.step_id, content: s.content }))
            };
            await financeApi.updateThinkingProject(id, payload);
        } catch (err) {
            message.error("自動儲存失敗");
        } finally {
            setSaving(false);
        }
    };

    // 使用 lodash 的 debounce，避免頻繁請求 API
    const delayedSave = useCallback(_.debounce(saveContent, 1000), [id]);

    // 3. 處理輸入變更
    const handleContentChange = (id, value) => {
        const newSteps = project.steps.map(s => 
            s.step_id === id ? { ...s, content: value } : s
        );
        setProject({ ...project, steps: newSteps });
        delayedSave(newSteps); // 觸發延遲儲存
    };

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    // 計算完成進度 (有填內容的步驟 / 總步驟)
    const completedSteps = project.steps.filter(s => s.content?.trim()).length;
    const progressPercent = Math.round((completedSteps / project.steps.length) * 100);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <Space align="baseline">
                    <Title level={2}>{project.title}</Title>
                    <Tag color="blue">{project.template_name}</Tag>
                    {saving && <Text type="secondary"><SaveOutlined spin /> 儲存中...</Text>}
                </Space>
                <Progress percent={progressPercent} status="active" strokeColor="#5ec2c2" />
            </div>

            {project.steps.map((step, index) => (
                <Card 
                    key={step.step_id}
                    title={
                        <Space>
                            <span style={{ background: '#5ec2c2', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {index + 1}
                            </span>
                            {step.title}
                        </Space>
                    }
                    style={{ marginBottom: '24px', borderRadius: '12px' }}
                    hoverable
                >
                    <div style={{ marginBottom: '12px', background: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                        <Text type="secondary"><BulbOutlined /> 引導思考：</Text>
                        <Paragraph style={{ marginTop: '4px', color: '#666' }}>
                            {step.prompt}
                        </Paragraph>
                    </div>
                    
                    <TextArea
                        rows={4}
                        placeholder={step.placeholder}
                        value={step.content}
                        onChange={(e) => handleContentChange(step.step_id, e.target.value)}
                        style={{ borderRadius: '8px' }}
                    />
                </Card>
            ))}
        </div>
    );
};

export default ThinkingProjectDetail;