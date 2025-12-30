// js/backup.js

const BackupService = {
    // 1. EXPORT: Mengambil semua data dari Dexie dan menjadikannya file JSON
    exportData: async () => {
        try {
            const tables = ['products', 'categories', 'transactions', 'members', 'settings'];
            const backup = {
                appName: "Sinar Pagi POS",
                exportDate: new Date().toISOString(),
                database: {}
            };

            for (const table of tables) {
                backup.database[table] = await db[table].toArray();
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `Backup_SinarPagi_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return { success: true, message: "Backup berhasil diunduh" };
        } catch (error) {
            console.error("Export Error:", error);
            return { success: false, message: error.message };
        }
    },

    // 2. IMPORT: Membaca file JSON dan memasukkannya ke dalam Dexie
    importData: async (file) => {
        try {
            const reader = new FileReader();
            
            const result = await new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    try {
                        const content = JSON.parse(e.target.result);
                        
                        // Validasi sederhana apakah ini file backup kita
                        if (content.appName !== "Sinar Pagi POS") {
                            throw new Error("File bukan backup Sinar Pagi POS yang valid");
                        }

                        // Konfirmasi sebelum menimpa data
                        if (!confirm("Hati-hati! Data saat ini akan diganti dengan data dari file backup. Lanjutkan?")) {
                            return resolve({ success: false, message: "Import dibatalkan" });
                        }

                        // Proses pemulihan data per tabel
                        for (const tableName in content.database) {
                            if (db[tableName]) {
                                await db[tableName].clear(); // Hapus data lama
                                await db[tableName].bulkAdd(content.database[tableName]); // Masukkan data backup
                            }
                        }

                        resolve({ success: true, message: "Data berhasil dipulihkan!" });
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.readAsText(file);
            });

            return result;
        } catch (error) {
            console.error("Import Error:", error);
            return { success: false, message: error.message };
        }
    }
};
