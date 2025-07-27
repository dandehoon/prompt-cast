import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  const mockOnSend = jest.fn();
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render textarea with label and hint', () => {
    render(
      <MessageInput
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
      />
    );

    expect(screen.getByLabelText('Message for AI Services')).toBeInTheDocument();
    expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
      />
    );

    const textarea = screen.getByLabelText('Message for AI Services');
    await user.type(textarea, 'Hello');

    // userEvent.type triggers onChange for each character separately
    expect(mockOnChange).toHaveBeenCalledTimes(5);
    // Just verify it gets called with individual characters
    expect(mockOnChange).toHaveBeenCalledWith('H');
    expect(mockOnChange).toHaveBeenCalledWith('e');
    expect(mockOnChange).toHaveBeenCalledWith('l');
    expect(mockOnChange).toHaveBeenCalledWith('l');
    expect(mockOnChange).toHaveBeenCalledWith('o');
  });

  it('should send message on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        value="Test message"
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
      />
    );

    const textarea = screen.getByLabelText('Message for AI Services');
    await user.type(textarea, '{Enter}');

    expect(mockOnSend).toHaveBeenCalled();
  });

  it('should add new line on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        value="Test"
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
      />
    );

    const textarea = screen.getByLabelText('Message for AI Services');
    await user.type(textarea, '{Shift>}{Enter}{/Shift}');

    expect(mockOnSend).not.toHaveBeenCalled();
    expect(mockOnChange).toHaveBeenCalledWith('Test\n');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <MessageInput
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={true}
      />
    );

    const textarea = screen.getByLabelText('Message for AI Services');
    expect(textarea).toBeDisabled();
  });

  it('should not send empty message', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
      />
    );

    const textarea = screen.getByLabelText('Message for AI Services');
    await user.type(textarea, '{Enter}');

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should not send whitespace-only message', async () => {
    const user = userEvent.setup();
    render(
      <MessageInput
        value="   "
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
      />
    );

    const textarea = screen.getByLabelText('Message for AI Services');
    await user.type(textarea, '{Enter}');

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should use custom placeholder', () => {
    render(
      <MessageInput
        value=""
        onChange={mockOnChange}
        onSend={mockOnSend}
        disabled={false}
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });
});
