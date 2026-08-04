import type Dexie from 'dexie';
import { exportDB, importInto } from 'dexie-export-import';
import { db } from './db';

export type RestoreMode = 'replace' | 'merge';

export const MAX_BACKUP_SIZE_BYTES = 100 * 1024 * 1024;

export function validateBackupFile(file: Blob): void {
  if (file.size === 0) {
    throw new Error('File cadangan kosong. Pilih file cadangan Uwangg yang berisi data.');
  }

  if (file.size > MAX_BACKUP_SIZE_BYTES) {
    throw new Error('File cadangan melebihi batas 100 MB. Pilih file berukuran 100 MB atau kurang.');
  }
}

export function exportBackup(database: Dexie = db): Promise<Blob> {
  return exportDB(database);
}

export async function restoreBackup(
  file: Blob,
  mode: RestoreMode,
  database: Dexie = db
): Promise<void> {
  validateBackupFile(file);
  await importInto(database, file, {
    clearTablesBeforeImport: mode === 'replace',
    overwriteValues: mode === 'replace'
  });
}

export function backupFilename(date = new Date()): string {
  return `uwangg-backup-${date.toISOString().slice(0, 10)}.json`;
}

export function downloadBackup(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();

  queueMicrotask(() => {
    link.remove();
    URL.revokeObjectURL(url);
  });
}
