// src/components/ui/Modal.jsx
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  ...props 
}) => {
  const modalRef = useRef(null);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);
  
  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };
  
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden focus:outline-none ${className}`}
        tabIndex={-1}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            {title && (
              <h2 className="text-xl font-semibold text-[#292929]">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="text-[#707070] hover:text-[#292929] p-1 rounded transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Modal Header component
export const ModalHeader = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <div className={`p-6 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Modal Body component
export const ModalBody = ({ 
  children, 
  className = '',
  padding = true,
  ...props 
}) => {
  const classes = padding ? `p-6 ${className}` : className;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Modal Footer component
export const ModalFooter = ({ 
  children, 
  className = '',
  justify = 'end',
  ...props 
}) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };
  
  const classes = `p-6 border-t border-gray-200 flex items-center space-x-3 ${justifyClasses[justify]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Confirmation Modal component
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  ...props
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      {...props}
    >
      <ModalBody>
        <p className="text-[#292929]">{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// Form Modal component
export const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  disabled = false,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      {...props}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {children}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={disabled || loading}
          >
            {submitText}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

// Alert Modal component
export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
  ...props
}) => {
  const typeIcons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      {...props}
    >
      <ModalBody>
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{typeIcons[type]}</span>
          <p className="text-[#292929] flex-1">{message}</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onClose}
          className="w-full"
        >
          {buttonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default Modal;