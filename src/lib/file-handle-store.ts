/**
 * File Handle Store — IndexedDB wrapper for FileSystemFileHandle objects
 *
 * FileSystemFileHandle cannot be serialized to JSON, but CAN be stored
 * in IndexedDB via the structured clone algorithm. This module provides
 * a simple key-value store keyed by the Postgres file record ID.
 *
 * Reference: PRD Section 18 (File System Access)
 */

const DB_NAME = "classey-file-handles";
const STORE_NAME = "handles";
const DB_VERSION = 1;

/** Open (or create) the IndexedDB database */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Save a FileSystemFileHandle to IndexedDB, keyed by file record ID */
export async function saveHandle(
  fileId: string,
  handle: FileSystemFileHandle
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve a FileSystemFileHandle from IndexedDB by file record ID */
export async function getHandle(
  fileId: string
): Promise<FileSystemFileHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(fileId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/** Remove a FileSystemFileHandle from IndexedDB */
export async function removeHandle(fileId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
