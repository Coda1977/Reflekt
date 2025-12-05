import { ReactNode } from 'react';
import clsx from 'clsx';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <section className={clsx('section-container', className)}>
      <div className="section-inner">{children}</div>
    </section>
  );
}
