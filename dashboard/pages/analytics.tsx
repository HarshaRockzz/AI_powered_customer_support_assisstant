import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  HandThumbUpIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import StatsCard from '../components/StatsCard';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SkeletonCard, Skeleton } from '../components/Skeleton';
import { getAnalytics, getTopQueries, getQueryTrends } from '../lib/api';
import { formatNumber } from '../lib/utils';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [topQueries, setTopQueries] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [analyticsData, topQueriesData, trendsData] = await Promise.all([
        getAnalytics(),
        getTopQueries(10),
        getQueryTrends(7),
      ]);

      setAnalytics(analyticsData);
      setTopQueries(topQueriesData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: '#232734' },
        ticks: { color: '#9aa3b5', font: { size: 11 } },
      },
      y: {
        grid: { color: '#232734' },
        ticks: { color: '#9aa3b5', font: { size: 11 } },
      },
    },
  };

  const trendsChartData = {
    labels: trends.map((t) => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Queries',
        data: trends.map((t) => t.count),
        borderColor: '#5b8cff',
        backgroundColor: 'rgba(91, 140, 255, 0.12)',
        pointBackgroundColor: '#5b8cff',
        pointBorderColor: '#0f1116',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const topQueriesChartData = {
    labels: topQueries.map((q) => q.query.substring(0, 30) + (q.query.length > 30 ? '...' : '')),
    datasets: [
      {
        label: 'Count',
        data: topQueries.map((q) => q.count),
        backgroundColor: 'rgba(157, 123, 255, 0.75)',
        borderColor: '#9d7bff',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton height={360} />
            <Skeleton height={360} />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6 max-w-[1400px]"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={item}>
            <StatsCard
              title="Total Queries"
              value={formatNumber(analytics?.total_queries || 0)}
              icon={<ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatsCard
              title="Positive Feedback"
              value={`${Math.round((analytics?.positive_feedback / Math.max(analytics?.total_feedback, 1)) * 100) || 0}%`}
              icon={<HandThumbUpIcon className="w-5 h-5" />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatsCard
              title="Avg Latency"
              value={`${Math.round(analytics?.average_latency_ms || 0)}ms`}
              icon={<ClockIcon className="w-5 h-5" />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatsCard
              title="Active Sessions"
              value={formatNumber(analytics?.active_sessions || 0)}
              icon={<UserGroupIcon className="w-5 h-5" />}
            />
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item}>
            <Card>
              <div className="mb-4">
                <h3 className="text-base font-semibold">Query Trends</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">Daily query volume, last 7 days</p>
              </div>
              <div style={{ height: '300px' }}>
                {trends.length > 0 ? (
                  <Line data={trendsChartData} options={chartOptions} />
                ) : (
                  <EmptyState
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    title="No data yet"
                    description="Query trends will appear once chats start coming in."
                  />
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <div className="mb-4">
                <h3 className="text-base font-semibold">Top Queries</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">Most frequent customer questions</p>
              </div>
              <div style={{ height: '300px' }}>
                {topQueries.length > 0 ? (
                  <Bar data={topQueriesChartData} options={chartOptions} />
                ) : (
                  <EmptyState
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    title="No data yet"
                    description="Top queries will appear once chats start coming in."
                  />
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Queries */}
        <motion.div variants={item}>
          <Card>
            <div className="mb-4">
              <h3 className="text-base font-semibold">Recent Queries</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Latest customer interactions</p>
            </div>
            {topQueries.length > 0 ? (
              <div className="space-y-2">
                {topQueries.slice(0, 5).map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3.5 bg-[var(--bg-tertiary)] rounded-[var(--radius-sm)] border border-transparent hover:border-[var(--border-secondary)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {query.query}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        Asked {query.count} times
                      </div>
                    </div>
                    <span className="badge badge-primary ml-4">{query.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />}
                title="No queries yet"
                description="Customer questions will show up here as they come in."
              />
            )}
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
