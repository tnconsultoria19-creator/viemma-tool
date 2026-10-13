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

  if (!appFirebase) {
    throw new Error('Secure file upload is unavailable because Firebase Storage is not configured. The file was not saved. Configure Storage, then try again.');
  }

  let downloadUrl = '';
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
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        error => {
          console.warn('Firebase Storage upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (uploadError) {
    console.error('Secure attachment upload failed. No local copy was saved:', uploadError);
    throw new Error('Secure upload failed. Check connectivity and Firebase Storage permissions, then retry. The file contents were not stored in the workspace or Firestore.');
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
  if (attachment.storagePath && appFirebase) {
    try {
      const storage = getStorage(appFirebase);
      const storageRef = ref(storage, attachment.storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Could not delete from Firebase Storage (may already be deleted):', err);
    }
  }
}
