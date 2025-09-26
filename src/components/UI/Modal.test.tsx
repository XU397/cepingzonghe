// 文件路径: components/ui/Modal.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';
import '@testing-library/jest-dom';

describe('Modal', () => {
  const mockOnOpenChange = jest.fn();

  it('should render the modal when open is true', () => {
    render(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should not render the modal when open is false', () => {
    render(
      <Modal open={false} onOpenChange={mockOnOpenChange} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onOpenChange with false when close button is clicked', () => {
    render(
      <Modal open={true} onOpenChange={mockOnOpenChange} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});