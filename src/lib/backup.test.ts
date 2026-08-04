import type Dexie from 'dexie';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportDB, importInto } from 'dexie-export-import';
import {
  MAX_BACKUP_SIZE_BYTES,
  exportBackup,
  restoreBackup,
  validateBackupFile
} from './backup';

vi.mock('dexie-export-import', () => ({
  exportDB: vi.fn(),
  importInto: vi.fn()
}));

const database = {} as Dexie;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('backup utilities', () => {
  it('rejects empty and oversized backup files', () => {
    expect(() => validateBackupFile(new Blob([]))).toThrow('kosong');
    expect(() => validateBackupFile({ size: MAX_BACKUP_SIZE_BYTES + 1 } as Blob)).toThrow('100 MB');
  });

  it('exports through the typed Dexie utility', async () => {
    const blob = new Blob(['backup']);
    vi.mocked(exportDB).mockResolvedValue(blob);

    await expect(exportBackup(database)).resolves.toBe(blob);
    expect(exportDB).toHaveBeenCalledWith(database);
  });

  it('uses strict replace options without relaxing library defaults', async () => {
    const file = new Blob(['backup']);

    await restoreBackup(file, 'replace', database);

    expect(importInto).toHaveBeenCalledWith(database, file, {
      clearTablesBeforeImport: true,
      overwriteValues: true
    });
  });

  it('uses merge options that reject primary-key conflicts', async () => {
    const file = new Blob(['backup']);

    await restoreBackup(file, 'merge', database);

    expect(importInto).toHaveBeenCalledWith(database, file, {
      clearTablesBeforeImport: false,
      overwriteValues: false
    });
  });
});
