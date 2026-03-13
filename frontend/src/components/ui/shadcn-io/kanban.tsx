import * as React from 'react';
import { cn } from '@/lib/utils';

interface KanbanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  id?: string;
  name?: string;
  index?: number;
  parent?: string;
  isOpen?: boolean;
  forwardedRef?: React.RefObject<HTMLDivElement>;
  dragDisabled?: boolean;
}

export function KanbanCard({
  children,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id: _id,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  name: _name,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  index: _index,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parent: _parent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isOpen: _isOpen,
  forwardedRef,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dragDisabled: _dragDisabled,
  ...props
}: Readonly<KanbanCardProps>) {
  return (
    <div
      ref={forwardedRef}
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-accent/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
