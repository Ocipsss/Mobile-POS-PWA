// js/backup.js

const BackupService = {
    // Daftar tabel harus sinkron dengan database.js v18
    allTables: [
        'products', 
        'categories', 
        'transactions', 
        'members', 
        'expenses', 
        'digital_transactions', 
        'services',
        'settings'
    ],

    // 1. EXPORT: Mengambil semua data dari Dexie dan menjadikannya file JSON
    exportData: async () => {
        try {
            const backup = {
                appName: "Sinar Pagi POS",
                exportDate: new Date().toISOString(),
                version: 18,
                database: {},
                // Juga simpan settings dari localStorage sebagai cadangan tambahan
                localSettings: JSON.parse(localStorage.getItem('sinar_pagi_settings')) || {}
            };

            // Mengambil data dari semua tabel yang terdaftar
            for (const table of BackupService.allTables) {
                if (db[table]) {
                    backup.database[table] = await db[table].toArray();
                }
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = new Date().getHours() + "-" + new Date().getMinutes();
            
            a.href = url;
            a.download = `Backup_SinarPagi_${dateStr}_${timeStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return { success: true, message: "✅ Backup berhasil diunduh!" };
        } catch (error) {
            console.error("Export Error:", error);
            return { success: false, message: "❌ Gagal: " + error.message };
        }
    },

    // 2. IMPORT: Membaca file JSON dan memasukkannya ke dalam Dexie
    importData: async (file) => {
        try {
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = async (e) => {
                    try {
                        const content = JSON.parse(e.target.result);
                        
                        // Validasi header file
                        if (content.appName !== "Sinar Pagi POS") {
                            throw new Error("File bukan backup Sinar Pagi POS yang valid");
                        }

                        if (!confirm("⚠️ PERINGATAN: Seluruh data lokal akan dihapus dan diganti dengan data dari file ini. Lanjutkan?")) {
                            return resolve({ success: false, message: "Import dibatalkan" });
                        }

                        // AKTIFKAN FLAG SYNC (Penting!)
                        // Ini agar hook di database.js tidak mengirim ulang ke cloud saat proses bulkAdd
                        window.isSyncing = true;

                        // Proses pemulihan data per tabel yang ada di file backup
                        for (const tableName of BackupService.allTables) {
                            if (db[tableName] && content.database[tableName]) {
                                await db[tableName].clear(); // Bersihkan data lokal lama
                                if (content.database[tableName].length > 0) {
                                    await db[tableName].bulkAdd(content.database[tableName]);
                                }
                            }
                        }

                        // Kembalikan settings ke localStorage jika ada
                        if (content.localSettings) {
                            localStorage.setItem('sinar_pagi_settings', JSON.stringify(content.localSettings));
                        }

                        // MATIKAN FLAG SYNC
                        window.isSyncing = false;

                        resolve({ success: true, message: "🚀 Data berhasil dipulihkan secara lokal!" });
                    } catch (err) {
                        window.isSyncing = false;
                        reject(err);
                    }
                };

                reader.onerror = () => reject(new Error("Gagal membaca file"));
                reader.readAsText(file);
            });
        } catch (error) {
            console.error("Import Error:", error);
            return { success: false, message: error.message };
        }
    }
};
