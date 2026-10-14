// Storage & Secure Attachment Service for Viemma Tours OS
// Handles uploads for PDFs, JPEGs, PNGs, and WebPs to Firebase Storage using owner-UID isolation.
// Authenticated blob retrieval with temporary object URLs ensures files are securely previewed and downloaded.
// No file contents or base64 data URLs are stored in Firestore metadata.

import { AttachmentItem } from '../types';
import { appFirebase, auth } from './firebase';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getBlob, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

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
  recordType: 'booking' | 'guest' | 'hotel' | 'flight' | 'transfer' | 'activity' | 'driver',
  recordId: string | number,
  bookingRef: string,
  onProgress?: UploadProgressCallback
): Promise<AttachmentItem> {
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const currentUser = auth?.currentUser;
  const ownerUid = currentUser?.uid || 'staff_member';
  const cleanRef = (bookingRef || 'VT-GEN').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Isolated owner-UID storage path conforming to storage.rules
  const storagePath = `attachments/${ownerUid}/${cleanRef}/${recordType}_${recordId}_${timestamp}_${safeFilename}`;

  if (!appFirebase) {
    throw new Error("Cloud Storage service is not initialized. Please ensure your cloud environment is connected.");
  }

  const storage = getStorage(appFirebase);
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    customMetadata: {
      bookingRef: cleanRef,
      recordType,
      recordId: String(recordId),
      originalName: file.name,
      ownerUid,
      uploadedAt: new Date().toISOString()
    }
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(new Error(`Storage upload failed: ${error.message || 'Permission denied or network failure'}`));
      },
      () => {
        resolve();
      }
    );
  });

  // Only metadata is stored in Firestore; never file contents or base64 strings
  const attachment: AttachmentItem = {
    id: `att_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    url: '', // Clean empty URL; authenticated blob retrieval is used for preview & download
    uploadedAt: new Date().toISOString(),
    uploadedBy: currentUser?.email || currentUser?.uid || 'Staff Operations',
    recordType,
    recordId,
    storagePath
  };

  return attachment;
}

/**
 * Fetch authenticated blob URL for preview or download.
 * Generates a temporary object URL that works regardless of storage permissions.
 */
export async function getAttachmentBlobUrl(attachment: AttachmentItem): Promise<string> {
  // If attachment already has a valid blob or data URL (e.g. from local session)
  if (attachment.url && (attachment.url.startsWith('blob:') || attachment.url.startsWith('data:'))) {
    return attachment.url;
  }

  if (!attachment.storagePath) {
    if (attachment.url) return attachment.url;
    throw new Error('Attachment storage path not found.');
  }

  if (!appFirebase) {
    throw new Error('Storage service is not available.');
  }

  const storage = getStorage(appFirebase);
  const storageRef = ref(storage, attachment.storagePath);

  try {
    // Attempt authenticated blob download
    const blob = await getBlob(storageRef);
    return URL.createObjectURL(blob);
  } catch (blobErr) {
    console.warn('getBlob failed, falling back to authenticated download URL:', blobErr);
    try {
      const downloadUrl = await getDownloadURL(storageRef);
      // Fetch the blob via the signed URL to create a proper local object URL for safe viewing
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (urlErr: any) {
      console.error('Failed to retrieve file from storage:', urlErr);
      throw new Error(`Unable to load attachment: ${urlErr.message || 'Permission denied or file not found'}`);
    }
  }
}

/**
 * Delete attachment file from Firebase Storage
 */
export async function deleteAttachment(attachment: AttachmentItem): Promise<void> {
  if (attachment.storagePath && appFirebase) {
    try {
      const storage = getStorage(appFirebase);
      const storageRef = ref(storage, attachment.storagePath);
      await deleteObject(storageRef);
    } catch (err: any) {
      console.warn('Could not delete from Firebase Storage (may already be removed):', err);
    }
  }
}
