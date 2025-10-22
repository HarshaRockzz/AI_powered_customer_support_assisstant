import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { 
  ChatBubbleOvalLeftEllipsisIcon,
  HandThumbUpIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import StatsCard from '@/components/StatsCard';
import { getAnalytics, getTopQueries, getQueryTrends } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
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

  const trendsChartData = {
    labels: trends.map((t) => t.date),
    datasets: [
      {
        label: 'Queries per Day',
        data: trends.map((t) => t.count),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(147, 51, 234)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  const topQueriesChartData = {
    labels: topQueries.map((q) => q.query.substring(0, 30) + '...'),
    datasets: [
      {
        label: 'Query Count',
        data: topQueries.map((q) => q.count),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleColor: '#fff',
        bodyColor: '#fff',
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  };

  if (loading) {
    return (
      <Layout currentPage="analytics">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-white/70 font-medium">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const feedbackRate = analytics
    ? ((analytics.positive_feedback / analytics.total_feedback) * 100).toFixed(1)
    : '0';

  return (
    <Layout currentPage="analytics">
      {/* Header */}
      <div className="glass border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              <ArrowTrendingUpIcon className="w-8 h-8 text-purple-400" />
              Analytics Dashboard
            </h1>
            <p className="text-white/70 font-medium">
              Monitor your AI assistant's performance and insights
            </p>
          </div>
          <div className="px-5 py-3 rounded-xl glass-dark border border-white/20 hover-lift">
            <p className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-yellow-400" />
              Real-time Data
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Queries */}
            <div className="glass hover-lift rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                  +12%
                </span>
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">Total Queries</p>
              <p className="text-3xl font-bold text-white">{formatNumber(analytics?.total_queries || 0)}</p>
            </div>

            {/* Positive Feedback */}
            <div className="glass hover-lift rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <HandThumbUpIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                  +5%
                </span>
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">Satisfaction Rate</p>
              <p className="text-3xl font-bold text-white">{feedbackRate}%</p>
            </div>

            {/* Response Time */}
            <div className="glass hover-lift rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                  Fast
                </span>
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold text-white">{Math.round(analytics?.average_latency_ms || 0)}ms</p>
            </div>

            {/* Documents */}
            <div className="glass hover-lift rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <DocumentDuplicateIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/60 font-semibold flex items-center gap-1">
                  <UserGroupIcon className="w-3 h-3" />
                  Active
                </span>
              </div>
              <p className="text-white/60 text-sm font-medium mb-1">Total Documents</p>
              <p className="text-3xl font-bold text-white">{formatNumber(analytics?.total_documents || 0)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Trends Chart */}
            <div className="glass rounded-2xl p-6 border border-white/10 hover-lift">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-purple-400" />
                Query Trends (Last 7 Days)
              </h2>
              <div style={{ height: '300px' }}>
                <Line data={trendsChartData} options={chartOptions} />
              </div>
            </div>

            {/* Top Queries Chart */}
            <div className="glass rounded-2xl p-6 border border-white/10 hover-lift">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-purple-400" />
                Top Queries
              </h2>
              <div style={{ height: '300px' }}>
                <Bar data={topQueriesChartData} options={{ ...chartOptions, indexAxis: 'y' }} />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 border border-white/10 hover-lift">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BoltIcon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white/70">Cache Hit Rate</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                {analytics?.cache_hit_rate?.toFixed(1) || '0'}%
              </p>
              <p className="text-xs text-white/50">Optimized performance</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10 hover-lift">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white/70">Total Tokens Used</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                {formatNumber(analytics?.total_tokens_used || 0)}
              </p>
              <p className="text-xs text-white/50">Across all queries</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10 hover-lift">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <UserGroupIcon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-white/70">Active Sessions (24h)</h3>
              </div>
              <p className="text-4xl font-bold text-white mb-2">
                {formatNumber(analytics?.active_sessions || 0)}
              </p>
              <p className="text-xs text-white/50">Last 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
