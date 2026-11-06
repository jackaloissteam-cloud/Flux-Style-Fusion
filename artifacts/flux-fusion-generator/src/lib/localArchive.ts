import JSZip from 'jszip';
import type { GenerateImageResult } from '@workspace/api-client-react';
import type { PromptDocument } from './promptBuilder';

export type ArchiveImage = {
  id: string;
  data: string;
  mimeType: string;
  seed?: number | null;
  artistA: string;
  artistB: string;
  createdAt: string;
  prompt: string;
  settingsText: string;
};

const dbName = 'flux-style-fusion-archive';
const storeName = 'images';

function openArchive() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Archivdatenbank konnte nicht geöffnet werden.'));
  });
}

export async function getArchiveImages(): Promise<ArchiveImage[]> {
  const db = await openArchive();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve((request.result as ArchiveImage[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export async function addArchiveImages(
  result: GenerateImageResult,
  prompt: PromptDocument,
  settings: unknown,
  artistA: string,
  artistB: string,
) {
  const db = await openArchive();
  const createdAt = new Date().toISOString();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    result.images.forEach((image, index) => {
      store.put({
        id: `${Date.now()}-${index}-${crypto.randomUUID()}`,
        data: image.data,
        mimeType: image.mimeType,
        seed: image.seed,
        artistA,
        artistB,
        createdAt,
        prompt: prompt.fullText,
        settingsText: JSON.stringify({ provider: result.provider, model: result.model, settings }, null, 2),
      } satisfies ArchiveImage);
    });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('Archivspeicherung abgebrochen.'));
  });
  db.close();
}

export async function deleteArchiveImage(id: string) {
  const db = await openArchive();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function downloadArchiveZip(images: ArchiveImage[]) {
  if (!images.length) return;
  const zip = new JSZip();
  const folder = zip.folder('flux-style-fusion')!;
  images.forEach((image, index) => {
    folder.file(`bild-${String(index + 1).padStart(2, '0')}.${image.mimeType.split('/')[1] || 'png'}`, image.data, { base64: true });
    folder.file(`bild-${String(index + 1).padStart(2, '0')}.json`, JSON.stringify({
      artistA: image.artistA,
      artistB: image.artistB,
      createdAt: image.createdAt,
      seed: image.seed,
      prompt: image.prompt,
      settings: JSON.parse(image.settingsText),
    }, null, 2));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = 'flux-style-fusion-archiv.zip';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
