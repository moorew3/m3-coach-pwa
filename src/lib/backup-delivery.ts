declare global {
  interface Window {
    M3BackupDelivery?: { save(text: string, filename: string): Promise<string> };
  }
}

export async function saveBackup(text: string, filename: string): Promise<string> {
  if (!window.M3BackupDelivery)
    throw new Error("Backup saver did not load. Keep your existing records and reopen Settings.");
  return window.M3BackupDelivery.save(text, filename);
}
