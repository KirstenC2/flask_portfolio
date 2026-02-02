// ThinkingSummary.jsx 的核心邏輯
const ThinkingSummary = ({ projectData }) => {
  return (
    <div style={{ background: '#fff', padding: '40px' }}>
      <Title level={2}>{projectData.title}</Title>
      <Tag color="blue">{projectData.template_name}</Tag>
      <Divider />
      <Row gutter={[24, 24]}>
        {projectData.steps.map(step => (
          <Col span={12} key={step.step_id}>
            <Card title={step.title} bordered={false} style={{ background: '#f8fafc' }}>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {step.content || "未填寫"}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
      <Button type="primary" icon={<DownloadOutlined />} style={{ marginTop: 20 }}>
        匯出 PDF
      </Button>
    </div>
  );
};