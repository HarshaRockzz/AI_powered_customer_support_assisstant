import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  ChatBubbleOvalLeftEllipsisIcon,
  HandThumbUpIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../components/StatsCard';
import { getAnalytics, getTopQueries, getQueryTrends } from '../lib/api';
import { formatNumber } from '../lib/utils';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

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
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'var(--border-primary)',
        },
        ticks: {
          color: 'var(--text-secondary)',
        },
      },
      y: {
        grid: {
          color: 'var(--border-primary)',
        },
        ticks: {
          color: 'var(--text-secondary)',
        },
      },
    },
  };

  const trendsChartData = {
    labels: trends.map((t) => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Queries',
        data: trends.map((t) => t.count),
        borderColor: 'rgb(88, 166, 255)',
        backgroundColor: 'rgba(88, 166, 255, 0.1)',
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
        backgroundColor: 'rgba(88, 166, 255, 0.8)',
        borderColor: 'rgb(88, 166, 255)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <div className="text-[var(--text-secondary)]">Loading analytics...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Queries"
            value={formatNumber(analytics?.total_queries || 0)}
            icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Positive Feedback"
            value={`${Math.round((analytics?.positive_feedback / Math.max(analytics?.total_feedback, 1)) * 100) || 0}%`}
            icon={<HandThumbUpIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Avg Latency"
            value={`${Math.round(analytics?.average_latency_ms || 0)}ms`}
            icon={<ClockIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Active Sessions"
            value={formatNumber(analytics?.active_sessions || 0)}
            icon={<UserGroupIcon className="w-6 h-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Query Trends */}
          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Query Trends (7 Days)</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Daily query volume over the past week</p>
            </div>
            <div style={{ height: '300px' }}>
              {trends.length > 0 ? (
                <Line data={trendsChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Top Queries */}
          <div className="card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Top Queries</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Most frequent customer questions</p>
            </div>
            <div style={{ height: '300px' }}>
              {topQueries.length > 0 ? (
                <Bar data={topQueriesChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Queries */}
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Recent Queries</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Latest customer interactions</p>
          </div>
          <div className="space-y-3">
            {topQueries.slice(0, 5).map((query, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {query.query}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    Asked {query.count} times
                  </div>
                </div>
                <span className="badge badge-primary ml-4">
                  {query.count}
                </span>
              </div>
            ))}
            {topQueries.length === 0 && (
              <div className="text-center text-[var(--text-secondary)] py-8">
                No queries yet
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
