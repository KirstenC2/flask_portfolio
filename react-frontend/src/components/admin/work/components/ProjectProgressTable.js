import { Table, Progress, Tag, Card } from 'antd';

const ProjectProgressTable = ({ projects, loading }) => {
  const columns = [
    {
      title: '專案名稱',
      dataIndex: 'name', // 💡 修正：必須是 dataIndex
      key: 'name',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '專案類型',
      dataIndex: 'type', // 💡 修正：必須是 dataIndex
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '完成進度',
      dataIndex: 'progress', // 💡 修正
      key: 'progress',
      width: '30%',
      render: (percent) => (
        <Progress 
          percent={percent} 
          size="small" 
          status={percent === 100 ? 'success' : 'active'}
          strokeColor={percent === 100 ? '#52c41a' : '#722ed1'}
        />
      ),
    },
    {
      title: '剩餘任務',
      dataIndex: 'remaining', // 💡 修正
      key: 'remaining',
      align: 'center',
      render: (count) => (
        <Tag color={count > 5 ? 'orange' : 'default'}>{count} 項</Tag>
      ),
    }
  ];

  return (
    <Card title="各專案進度總覽" style={{ marginTop: 24, height: '100%' }} size="small">
      <Table 
        // 💡 確保傳進來的數據是陣列，且每項都有唯一的 key
        dataSource={projects || []} 
        columns={columns} 
        loading={loading} 
        rowKey="key" // 💡 告訴 Table 使用物件裡的 'key' 欄位作為 React key
        pagination={{ pageSize: 5 }}
        size="middle"
      />
    </Card>
  );
};
export default ProjectProgressTable;