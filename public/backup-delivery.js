/* Shared by original Settings and the encrypted full-device backup page. */
(function (root) {
  "use strict";
  async function save(text, filename) {
    if (typeof text !== "string" || !/^[a-zA-Z0-9_.()-]+\.json$/.test(filename)) {
      throw new Error("Invalid backup file");
    }
    JSON.parse(text);
    const cap = root.Capacitor;
    if (cap?.isNativePlatform?.()) {
      if (!cap.isPluginAvailable?.("BackupSave")) {
        throw new Error("This Android build cannot save backups. Keep this installation and its records.");
      }
      const result = await cap.registerPlugin("BackupSave").save({ text, filename });
      if (result.cancelled) return "Save cancelled. No backup was saved.";
      if (!result.verified) throw new Error("The saved backup could not be verified");
      return "Saved and checked: " + result.filename + ". Reopen the file to verify its records before replacing this app.";
    }
    const blob = new Blob([text], { type: "application/json" });
    if (root.showSaveFilePicker) {
      try {
        const handle = await root.showSaveFilePicker({ suggestedName: filename,
          types: [{ description: "M3 FLEX backup", accept: { "application/json": [".json"] } }] });
        const stream = await handle.createWritable();
        await stream.write(blob);
        await stream.close();
        if (await (await handle.getFile()).text() !== text) throw new Error("Saved file did not match the backup");
        return "Saved and checked: " + handle.name;
      } catch (error) {
        if (error?.name === "AbortError") return "Save cancelled. No backup was saved.";
        throw error;
      }
    }
    const url = URL.createObjectURL(blob);
    const link = root.document.createElement("a");
    link.href = url;
    link.download = filename;
    try { root.document.body.append(link); link.click(); }
    finally { link.remove(); root.setTimeout(() => URL.revokeObjectURL(url), 60000); }
    return "Download requested: " + filename + ". Saving is not confirmed. Find and reopen the new file before replacing this app.";
  }
  root.M3BackupDelivery = { save };
})(globalThis);
