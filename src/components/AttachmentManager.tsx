import React, { useState, useRef } from 'react';
import { AttachmentItem } from '../types';
import { 
  uploadAttachment, 
  deleteAttachment, 
  formatFileSize, 
  validateUploadFile 
} from '../lib/storageService';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Download, 
  X, 
  Check, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface AttachmentManagerProps {
  attachments?: AttachmentItem[];
  onAddAttachment: (item: AttachmentItem) => void;
  onRemoveAttachment: (id: string) => void;
  recordType: 'booking' | 'guest' | 'hotel' | 'flight';
  recordId: string | number;
  bookingRef: string;
  title?: string;
  description?: string;
  onExtractToAI?: (attachment: AttachmentItem) => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  recordType,
  recordId,
  bookingRef,
  title = "Supporting Documents & Image Attachments",
  description = "Upload client passport copies, hotel vouchers, flight e-tickets, or quotations (PDF, JPEG, PNG, WebP up to 15MB).",
  onExtractToAI
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const file = files[0];
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const item = await uploadAttachment(
        file,
        recordType,
        recordId,
        bookingRef,
        (progress) => setUploadProgress(progress)
      );

      onAddAttachment(item);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'File upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleProcessFiles(e.dataTransfer.files);
  };

  const handleDelete = async (att: AttachmentItem) => {
    if (confirm(`Are you sure you want to remove "${att.name}"?`)) {
      try {
        await deleteAttachment(att);
      } catch (e) {
        console.warn('Error deleting storage file:', e);
      }
      onRemoveAttachment(att.id);
    }
  };

  const isPdf = (type: string, name: string) => 
    type.includes('pdf') || name.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-[#1A3326] uppercase tracking-wider flex items-center gap-1.5">
            <Upload size={14} className="text-[#D4AF37]" />
            {title}
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
        </div>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-emerald-600 bg-emerald-50/60'
            : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          className="hidden"
          onChange={(e) => handleProcessFiles(e.target.files)}
        />

        {isUploading ? (
          <div className="w-full max-w-xs space-y-2 py-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#1A3326]">
              <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
              <span>Uploading document... {uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#1A3326] h-full transition-all duration-200" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-xs">
              <Upload size={18} className="text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">
                Click to browse or drag and drop document here
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                PDF, JPEG, PNG, or WebP (Maximum 15MB)
              </p>
            </div>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-600 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {attachments.map((att) => {
            const isDocumentPdf = isPdf(att.type, att.name);
            return (
              <div
                key={att.id}
                className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isDocumentPdf ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {isDocumentPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate" title={att.name}>
                      {att.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {formatFileSize(att.size)} • {new Date(att.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onExtractToAI && (
                    <button
                      type="button"
                      onClick={() => onExtractToAI(att)}
                      title="Send to AI Importer for data extraction"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 transition cursor-pointer"
                    >
                      <Sparkles size={14} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(att)}
                    title="Preview Document"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition cursor-pointer"
                  >
                    <Eye size={14} />
                  </button>

                  <a
                    href={att.url}
                    download={att.name}
                    target="_blank"
                    rel="noreferrer"
                    title="Download"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition cursor-pointer"
                  >
                    <Download size={14} />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(att)}
                    title="Remove"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-[#D4AF37] shrink-0" />
                <span className="text-xs font-bold text-gray-800 truncate">{previewAttachment.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">({formatFileSize(previewAttachment.size)})</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.url}
                  download={previewAttachment.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition flex items-center gap-1"
                >
                  <Download size={12} /> Download
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
              {isPdf(previewAttachment.type, previewAttachment.name) ? (
                <iframe
                  src={previewAttachment.url}
                  title={previewAttachment.name}
                  className="w-full h-[65vh] rounded-xl border border-gray-300 bg-white"
                />
              ) : (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
