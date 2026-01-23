
import React from 'react';
import './CustomModal.css';

const CustomModal = ({ isOpen, type, title, message, onConfirm, onCancel, confirmText, cancelText, showCancel = true, showFooterCancel = true, showConfirm = true, showInput = false, inputPlaceholder = '', inputType = 'text', containerClassName = '' }) => {
    const [inputValue, setInputValue] = React.useState('');

    React.useEffect(() => {
        if (isOpen) setInputValue('');
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine styles based on type (danger/warning/info)
    const isDanger = type === 'danger' || type === 'delete';

    const handleConfirm = () => {
        onConfirm(inputValue);
    };

    return (
        <div className="modal-overlay">
            <div className={`modal-container ${containerClassName}`.trim()} role="dialog" aria-modal="true">
                <div className="modal-header">
                    <h3 className="modal-title">
                        {title}
                    </h3>
                    {showCancel && (
                        <button className="modal-close-icon" onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>
                            ×
                        </button>
                    )}
                </div>

                <div className="modal-body">
                    <div style={{ marginBottom: showInput ? '16px' : '0' }}>{message}</div>
                    {showInput && (
                        inputType === 'textarea' ? (
                            <textarea
                                className="modal-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={inputPlaceholder}
                                autoFocus
                            />
                        ) : (
                            <input
                                type={inputType || 'text'}
                                className="modal-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={inputPlaceholder}
                                autoFocus
                            />
                        )
                    )}
                </div>

                <div className="modal-footer">
                    {showCancel && showFooterCancel && (
                        <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
                            {cancelText || 'Cancel'}
                        </button>
                    )}
                    {showConfirm && (
                        <button
                            className={`modal-btn ${isDanger ? 'modal-btn-danger' : 'modal-btn-confirm'}`}
                            onClick={handleConfirm}
                            disabled={showInput && !inputValue.trim()}
                        >
                            {confirmText || 'Confirm'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
