import React from 'react';

interface StatusBarProps {
  connectedCount: number;
  enabledCount: number;
}

export function StatusBar({ connectedCount, enabledCount }: StatusBarProps) {
  return (
    <div className="text-xs text-ai-text-secondary text-center">
      Ready • {connectedCount}/{enabledCount} services connected
    </div>
  );
}
