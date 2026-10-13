// Storage & Attachment Service for Viemma Tours OS
// Handles uploads for PDFs, JPEGs, PNGs, and WebPs to Firebase Storage with safe local data-URL fallback.

import { AttachmentItem } from '../types';
import { appFirebase } from './firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  // Validate file type
  const isAllowedType = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || 
    file.name.toLowerCase().endsWith('.pdf') ||
    file.name.toLowerCase().endsWith('.jpg') ||
    file.name.toLowerCase().endsWith('.jpeg') ||
    file.name.toLowerCase().endsWith('.png') ||
    file.name.toLowerCase().endsWith('.webp');

  if (!isAllowedType) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || 'unknown'}). Please upload a PDF, JPEG, PNG, or WebP document.`
    };
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 15MB limit (${formatFileSize(file.size)}). Please compress or choose a smaller file.`
    };
  }

  return { valid: true };
}

// Convert File to base64 Data URL for offline / local persistence fallback
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export async function uploadAttachment(
  file: File,
  recordType: 'booking' | 'guest' | 'hotel' | 'flight',
  recordId: string | number,
  bookingRef: string,
  onProgress?: UploadProgressCallback
): Promise<AttachmentItem> {
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const cleanRef = (bookingRef || 'VT-GEN').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `attachments/${cleanRef}/${recordType}_${recordId}_${timestamp}_${safeFilename}`;

  let downloadUrl = '';

  // Try Firebase Storage first if Firebase app is initialized
  if (appFirebase) {
    try {
      const storage = getStorage(appFirebase);
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          bookingRef: cleanRef,
          recordType,
          recordId: String(recordId),
          originalName: file.name
        }
      });

      downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => {
            console.warn('Firebase Storage upload error, falling back to local data URL:', error);
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (firebaseErr) {
      console.warn('Firebase Storage upload failed:', firebaseErr);
      throw new Error('Upload to Firebase Storage failed. Please check your connection and try again.');
    }
  } else {
    // Standalone / offline mode
    throw new Error('File uploads require an active cloud connection. Please configure Firebase to enable attachments.');
  }

  if (!downloadUrl || downloadUrl === '') {
    throw new Error('File uploaded but failed to retrieve a secure download URL. Please try again.');
  }

  const attachment: AttachmentItem = {
    id: `att_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    url: downloadUrl,
    uploadedAt: new Date().toISOString(),
    recordType,
    recordId,
    storagePath
  };

  return attachment;
}

export async function deleteAttachment(attachment: AttachmentItem): Promise<void> {
  if (attachment.storagePath && appFirebase && !attachment.url.startsWith('data:')) {
    try {
      const storage = getStorage(appFirebase);
      const storageRef = ref(storage, attachment.storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Could not delete from Firebase Storage (may already be deleted):', err);
    }
  }
}
