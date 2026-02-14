import React from 'react';
import { Card, Progress, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, TrophyOutlined } from '@ant-design/icons';

const SavingStats = ({ totalSaved, totalTarget }) => {
  const percentage = Math.round((totalSaved / totalTarget) * 100) || 0;

  return (
    <Card style={{height:'100%'}}>
      <Row gutter={24} align="middle">
        {/* 左側：金額統計 */}
        <Col xs={24} sm={16}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="已儲蓄總額"
                value={totalSaved}
                precision={0}
                valueStyle={{ color: '#1677ff', fontWeight: '800' }}
                prefix={<span className="text-2xl">$</span>}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="總目標金額"
                value={totalTarget}
                precision={0}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<TrophyOutlined className="mr-1" />}
              />
            </Col>
          </Row>
          
          {/* 下方的橫向進度條 */}
          <div className="mt-6">
            <div className="flex justify-between mb-1 text-xs text-gray-400">
              <span>完成率</span>
              <span>{percentage}%</span>
            </div>
            <Progress 
              percent={percentage} 
              status="active" 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              showInfo={false}
            />
          </div>
        </Col>

        {/* 右側：圓環進度 (在桌面端顯示，增加視覺豐富度) */}
        <Col xs={0} sm={8} className="text-center">
          <Progress
            type="circle"
            percent={percentage}
            width={100}
            strokeColor={percentage >= 100 ? '#52c41a' : '#1677ff'}
            format={(percent) => (
              <div className="flex flex-col">
                <span className="text-lg font-bold">{percent}%</span>
                <span className="text-xs text-gray-400">Progress</span>
              </div>
            )}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default SavingStats;