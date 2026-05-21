// 文件路径: components/ui/Modal.tsx

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';

const overlayStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  position: 'fixed',
  inset: 0,
  backdropFilter: 'blur(4px)',
  zIndex: 40,
};

const contentStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: 500,
  maxHeight: '85vh',
  padding: 25,
  zIndex: 50,
  outline: 'none',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  display: 'inline-flex',
  width: 25,
  height: 25,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: 0,
  background: 'transparent',
  color: '#d1d5db',
  cursor: 'pointer',
};

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, title, description, children }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content style={contentStyle}>
          <Dialog.Title className="text-white text-lg font-medium mb-2">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="text-gray-300 text-sm mb-4">
              {description}
            </Dialog.Description>
          )}

          <div>{children}</div>

          <Dialog.Close asChild>
            <button
              className="text-gray-300 hover:text-white absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close"
              style={closeButtonStyle}
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
