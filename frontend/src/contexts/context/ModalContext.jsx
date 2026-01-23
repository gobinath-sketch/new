
import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomModal from '../../components/CustomModal.jsx';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: true
    });

    const close = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showModal = useCallback((config) => {
        setModalConfig({
            isOpen: true,
            ...config,
            onCancel: () => {
                if (config.onCancel) config.onCancel();
                close();
            },
            onConfirm: async (value) => {
                if (config.onConfirm) await config.onConfirm(value);
                close();
            }
        });
    }, [close]);

    // Wrapper for Confirmation (Replaces window.confirm)
    const confirm = useCallback(({ title, message, onConfirm, onCancel, confirmText, cancelText, type = 'info' }) => {
        showModal({
            title,
            message,
            onConfirm,
            onCancel,
            confirmText: confirmText || 'Confirm',
            cancelText: cancelText || 'Cancel',
            showCancel: true,
            type
        });
    }, [showModal]);

    // Wrapper for Alert (Replaces window.alert)
    const alert = useCallback(({ title, message, onOk, okText, type = 'info', ...rest }) => {
        showModal({
            title,
            message,
            onConfirm: onOk,
            confirmText: okText || 'OK',
            showCancel: true,
            showFooterCancel: false,
            type
            ,
            ...rest
        });
    }, [showModal]);

    // Wrapper for Prompt (Replaces window.prompt)
    const prompt = useCallback(({ title, message, onSubmit, onCancel, confirmText, cancelText, placeholder, inputType = 'text' }) => {
        showModal({
            title,
            message,
            showInput: true,
            inputType,
            inputPlaceholder: placeholder,
            onConfirm: async (value) => {
                if (onSubmit) await onSubmit(value);
            },
            onCancel,
            confirmText: confirmText || 'Submit',
            cancelText: cancelText || 'Cancel',
            showCancel: true,
            type: 'prompt'
        });
    }, [showModal]);

    return (
        <ModalContext.Provider value={{ confirm, alert, prompt, showModal, close }}>
            {children}
            <CustomModal {...modalConfig} />
        </ModalContext.Provider>
    );
};
