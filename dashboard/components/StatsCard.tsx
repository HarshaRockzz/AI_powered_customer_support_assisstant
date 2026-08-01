import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export default function StatsCard({ title, value, icon, change, changeType = 'neutral' }: StatsCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-[var(--text-secondary)] mb-1.5">{title}</div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-2xl font-bold text-[var(--text-primary)] tracking-tight"
          >
            {value}
          </motion.div>
          {change && (
            <div className={`text-xs font-medium mt-1.5 ${
              changeType === 'positive' ? 'text-[var(--accent-success)]' :
              changeType === 'negative' ? 'text-[var(--accent-danger)]' :
              'text-[var(--text-tertiary)]'
            }`}>
              {change}
            </div>
          )}
        </div>
        <div
          className="p-2.5 rounded-[var(--radius-md)]"
          style={{ background: 'rgba(91, 140, 255, 0.1)', color: 'var(--accent-primary)' }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
