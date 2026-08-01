import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { classNames } from '@/lib/utils';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  hover = false,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={classNames(
        'surface transition-all duration-200',
        paddingClasses[padding],
        hover && 'hover:border-[var(--border-secondary)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
