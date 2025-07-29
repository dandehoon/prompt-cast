import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '../StatusIndicator';
import { TOAST_TYPES } from '../../../shared/constants';
import { ToastMessage } from '../../../shared/types';

describe('StatusIndicator', () => {
  const infoToast: ToastMessage = {
    id: '1',
    message: 'Test message',
    type: TOAST_TYPES.INFO,
  };

  it('should render default message when no toasts', () => {
    render(
      <StatusIndicator 
        toasts={[]} 
        isLoading={false} 
        connectedCount={2}
        enabledCount={4}
      />,
    );

    expect(screen.getByText('2/4 services ready')).toBeInTheDocument();
  });

  it('should show toast message when toast present', () => {
    const { container } = render(
      <StatusIndicator 
        toasts={[infoToast]} 
        isLoading={false} 
        connectedCount={2}
        enabledCount={4}
      />,
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
