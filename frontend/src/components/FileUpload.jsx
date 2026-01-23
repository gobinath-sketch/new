import { useCallback, useMemo, useRef, useState } from 'react';
import { useModal } from '../contexts/context/ModalContext.jsx';
import './FileUpload.css';

const FileUpload = ({
  label,
  accept = '.xlsx,.xls,.doc,.docx,.pdf,image/*',
  multiple = true,
  onFilesChange
}) => {
  const inputRef = useRef(null);
  const modal = useModal();
  const [files, setFiles] = useState([]);

  const fileKey = useCallback((file) => `${file.name}-${file.size}-${file.lastModified}`, []);

  const setAndNotify = useCallback((next) => {
    setFiles(next);
    if (onFilesChange) onFilesChange(next);
  }, [onFilesChange]);

  const handlePick = useCallback(() => {
    if (inputRef.current) inputRef.current.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length === 0) return;

    setAndNotify((prev) => {
      const existingKeys = new Set(prev.map((f) => fileKey(f)));
      const merged = [...prev];
      for (const f of selected) {
        const k = fileKey(f);
        if (!existingKeys.has(k)) merged.push(f);
      }
      return merged;
    });

    e.target.value = '';
  }, [fileKey, setAndNotify]);

  const removeFile = useCallback((key) => {
    setAndNotify((prev) => prev.filter((f) => fileKey(f) !== key));
  }, [fileKey, setAndNotify]);

  const openPreview = useCallback((file) => {
    const isImage = file.type?.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      modal.alert({
        title: 'Preview',
        message: (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{file.name}</div>
            <div style={{ color: '#475569' }}>Preview is available for images and PDFs only.</div>
          </div>
        ),
        okText: 'Close',
        type: 'info',
        containerClassName: 'modal-wide'
      });
      return;
    }

    const url = URL.createObjectURL(file);

    modal.alert({
      title: 'Preview',
      message: (
        <div className="modal-scroll-area">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>{file.name}</div>
          {isImage ? (
            <img
              src={url}
              alt={file.name}
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          ) : (
            <iframe
              title={file.name}
              src={url}
              style={{ width: '100%', height: '70vh', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          )}
        </div>
      ),
      okText: 'Close',
      type: 'info',
      containerClassName: 'modal-wide',
      onOk: () => {
        URL.revokeObjectURL(url);
      }
    });
  }, [modal]);

  const headerText = useMemo(() => {
    if (files.length === 0) return 'No files selected';
    if (files.length === 1) return '1 file selected';
    return `${files.length} files selected`;
  }, [files.length]);

  return (
    <div className="upload-field">
      {label && <div className="upload-label">{label}</div>}

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="upload-drop" role="button" tabIndex={0} onClick={handlePick}>
        <div className="upload-drop-row">
          <div className="upload-drop-title">Upload files</div>
          <div className="upload-drop-meta">{headerText}</div>
        </div>
        <div className="upload-actions">
          <button type="button" className="upload-btn" onClick={(e) => { e.stopPropagation(); handlePick(); }}>
            Choose files
          </button>
          <button
            type="button"
            className="upload-btn upload-btn-secondary"
            onClick={(e) => { e.stopPropagation(); handlePick(); }}
            disabled={!multiple}
            title={multiple ? 'Add more files' : 'Multiple files not enabled'}
          >
            + Add more
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="upload-list">
          {files.map((file) => {
            const key = fileKey(file);
            return (
              <div key={key} className="upload-item">
                <div className="upload-item-main">
                  <div className="upload-item-name" title={file.name}>{file.name}</div>
                  <div className="upload-item-sub">{Math.max(1, Math.round(file.size / 1024))} KB</div>
                </div>
                <div className="upload-item-actions">
                  <button type="button" className="upload-link" onClick={() => openPreview(file)}>
                    Preview 
                  </button>
                  <button type="button" className="upload-link upload-link-danger" onClick={() => removeFile(key)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
