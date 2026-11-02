package com.m3legacy.flexrecovery;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.atomic.AtomicBoolean;

/** User-selected document only; no broad storage permission or cloud upload. */
@CapacitorPlugin(name = "BackupSave")
public class BackupSavePlugin extends Plugin {
    private static final int LIMIT = 28 * 1024 * 1024;
    private final AtomicBoolean saving = new AtomicBoolean(false);

    @PluginMethod
    public void save(PluginCall call) {
        String text = call.getString("text");
        String filename = call.getString("filename");
        if (text == null || text.length() > LIMIT || filename == null ||
            !filename.matches("[a-zA-Z0-9_.()-]+\\.json")) {
            call.reject("Invalid backup file");
            return;
        }
        if (text.getBytes(StandardCharsets.UTF_8).length > LIMIT) {
            call.reject("Backup exceeds the save limit");
            return;
        }
        if (!saving.compareAndSet(false, true)) {
            call.reject("A backup save is already open");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        try {
            startActivityForResult(call, intent, "documentSelected");
        } catch (Exception error) {
            saving.set(false);
            call.reject("Could not open the Android save picker", null, error);
        }
    }

    @ActivityCallback
    private void documentSelected(PluginCall call, ActivityResult result) {
        if (call == null) { saving.set(false); return; }
        if (result.getResultCode() != Activity.RESULT_OK) {
            saving.set(false);
            JSObject cancelled = new JSObject();
            cancelled.put("cancelled", true);
            call.resolve(cancelled);
            return;
        }
        Uri uri = result.getData() == null ? null : result.getData().getData();
        if (uri == null || !"content".equals(uri.getScheme())) {
            saving.set(false);
            call.reject("No writable document was selected");
            return;
        }
        // File I/O and readback must not block the Android UI thread.
        new Thread(() -> {
            try {
                String text = call.getString("text");
                if (text == null) throw new IllegalStateException("Backup data is unavailable");
                byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
                try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                    if (output == null) throw new IllegalStateException("No output stream");
                    output.write(bytes);
                    output.flush();
                }
                MessageDigest expected = MessageDigest.getInstance("SHA-256");
                byte[] expectedHash = expected.digest(bytes);
                MessageDigest actual = MessageDigest.getInstance("SHA-256");
                long length = 0;
                try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
                    if (input == null) throw new IllegalStateException("Cannot reopen saved file");
                    byte[] buffer = new byte[8192];
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        length += count;
                        if (length > LIMIT) throw new IllegalStateException("Unexpected saved file size");
                        actual.update(buffer, 0, count);
                    }
                }
                if (length != bytes.length || !MessageDigest.isEqual(expectedHash, actual.digest())) {
                    throw new IllegalStateException("Saved backup did not match its source");
                }
                JSObject saved = new JSObject();
                saved.put("verified", true);
                saved.put("filename", call.getString("filename"));
                saved.put("bytes", length);
                call.resolve(saved);
            } catch (Exception error) {
                call.reject("Backup save could not be verified. Keep app records and retry.", null, error);
            } finally {
                saving.set(false);
            }
        }, "m3-backup-save").start();
    }
}
