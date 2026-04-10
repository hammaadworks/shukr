import React, { useState, useEffect, useRef } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const ShukrDialog: React.FC<DialogProps> = ({ isOpen, onClose, title, description, children }) => {
  if (!isOpen) return null;

  return (
    <div className="shukr-dialog-overlay" onPointerDown={onClose}>
      <div className="shukr-dialog" onPointerDown={(e) => e.stopPropagation()}>
        <h3 className="shukr-dialog-title">{title}</h3>
        {description && <p className="shukr-dialog-desc">{description}</p>}
        {children}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, onClose, onConfirm, title, description, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false 
}) => {
  return (
    <ShukrDialog isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <div className="shukr-dialog-actions">
        <button className="shukr-dialog-btn btn-cancel" onClick={onClose}>{cancelText}</button>
        <button 
          className={`shukr-dialog-btn ${isDanger ? 'btn-danger' : 'btn-confirm'}`} 
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmText}
        </button>
      </div>
    </ShukrDialog>
  );
};

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({ 
  isOpen, onClose, onSubmit, title, description, placeholder, defaultValue = '', submitText = 'Save', cancelText = 'Cancel' 
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setValue(defaultValue);
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen, defaultValue]);

  return (
    <ShukrDialog isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <input
        ref={inputRef}
        type="text"
        className="shukr-dialog-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmit(value.trim());
            onClose();
          }
        }}
      />
      <div className="shukr-dialog-actions">
        <button className="shukr-dialog-btn btn-cancel" onClick={onClose}>{cancelText}</button>
        <button 
          className="shukr-dialog-btn btn-confirm" 
          onClick={() => { if (value.trim()) { onSubmit(value.trim()); onClose(); } }}
        >
          {submitText}
        </button>
      </div>
    </ShukrDialog>
  );
};

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonText?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ 
  isOpen, onClose, title, description, buttonText = 'OK' 
}) => {
  return (
    <ShukrDialog isOpen={isOpen} onClose={onClose} title={title} description={description}>
      <div className="shukr-dialog-actions">
        <button className="shukr-dialog-btn btn-confirm" onClick={onClose}>{buttonText}</button>
      </div>
    </ShukrDialog>
  );
};

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  options: SelectOption[];
  selectedValue: string;
}

export const SelectDialog: React.FC<SelectDialogProps> = ({ 
  isOpen, onClose, onSelect, title, options, selectedValue
}) => {
  return (
    <ShukrDialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="shukr-dialog-options-list">
        {options.map(opt => (
          <button 
            key={opt.value}
            className={`shukr-option-btn ${selectedValue === opt.value ? 'selected' : ''}`}
            onClick={() => { onSelect(opt.value); onClose(); }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="shukr-dialog-actions" style={{ marginTop: 12 }}>
        <button className="shukr-dialog-btn btn-cancel" onClick={onClose}>Cancel</button>
      </div>
    </ShukrDialog>
  );
};