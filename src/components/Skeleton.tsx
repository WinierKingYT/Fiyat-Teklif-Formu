import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'card' | 'row';
  count?: number;
}

export default function Skeleton({ variant = 'text', count = 1 }: SkeletonProps) {
  const className = `skeleton skeleton-${variant}`;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={className} />
      ))}
    </>
  );
}
