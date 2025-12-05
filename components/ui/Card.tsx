import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl p-8 md:p-12',
        hover && 'transition-lift',
        className
      )}
    >
      {children}
    </div>
  );
}

interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
}

export function FeatureCard({ number, title, description }: FeatureCardProps) {
  return (
    <Card hover className="feature-card">
      <div className="text-6xl font-black text-accent-yellow mb-4">{number}</div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Card>
  );
}
