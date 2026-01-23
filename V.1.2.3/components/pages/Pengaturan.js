// components/pages/Pengaturan.js //
const PagePengaturan = {
    setup() {
        const stats = Vue.ref({
            products: 0,
            transactions: 0,
            members: 0
        });

        const storeSettings = Vue.ref({
            storeName: 'SINAR PAGI',
            address: 'Jl. Raya Utama No. 01',
            phone: '0812-3456-7890',
            footerNote: 'Terima Kasih Atas Kunjungan Anda'
        });

        // Objek untuk menyimpan referensi listener agar bisa dimatikan (unmount)
        const firebaseListeners = {};

        const loadAllData = async () => {
            // 1. LOAD CEPAT DARI LOKAL (IndexedDB)
            // Ini agar user tidak melihat angka 0 saat aplikasi baru dibuka
            stats.value.products = await db.products.count();
            stats.value.transactions = await db.transactions.count();
            stats.value.members = await db.members.count();

            // 2. LOAD & LISTEN DARI CLOUD (Firebase)
            if (typeof fdb !== 'undefined') {
                try {
                    // Load Pengaturan Toko
                    const snapshot = await fdb.ref('settings/store').once('value');
                    const cloudData = snapshot.val();
                    if (cloudData) {
                        storeSettings.value = cloudData;
                        localStorage.setItem('sinar_pagi_settings', JSON.stringify(cloudData));
                    }

                    // --- REAL-TIME STATS (Saran: Reaktif & Beban Rendah) ---
                    // Menggunakan on('value') hanya menarik metadata jumlah, bukan isi data
                    const tables = ['products', 'transactions', 'members'];
                    tables.forEach(table => {
                        firebaseListeners[table] = fdb.ref(table).on('value', (snap) => {
                            stats.value[table] = snap.numChildren();
                        });
                    });

                } catch (err) {
                    console.error("Gagal sinkronisasi cloud:", err);
                }
            }
        };

        const saveSettings = async () => {
            try {
                localStorage.setItem('sinar_pagi_settings', JSON.stringify(storeSettings.value));
                if (typeof fdb !== 'undefined') {
                    await fdb.ref('settings/store').set({
                        ...storeSettings.value,
                        updatedAt: new Date().toISOString()
                    });
                }
                alert("✅ Pengaturan Berhasil Disimpan!");
            } catch (err) {
                alert("❌ Gagal: " + err.message);
            }
        };

        const handleExport = async () => {
            const res = await BackupService.exportData();
            if (res.success) alert(res.message);
        };

        const handleImport = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const res = await BackupService.importData(file);
            if (res.success) {
                alert(res.message);
                window.location.reload(); 
            }
            event.target.value = '';
        };

        const handleResetData = async () => {
            if (confirm("Hapus semua data PERMANEN dari LOKAL dan CLOUD?")) {
                if (confirm("Yakin? Tindakan ini tidak bisa dibatalkan.")) {
                    try {
                        if (typeof fdb !== 'undefined') {
                            const tables = ['products', 'categories', 'transactions', 'members', 'expenses', 'digital_transactions'];
                            for (const t of tables) await fdb.ref(t).remove();
                        }
                        await db.delete(); // Menghapus seluruh database Dexie
                        alert("Database dibersihkan. Aplikasi akan dimuat ulang.");
                        window.location.reload();
                    } catch (err) {
                        alert("Gagal reset: " + err.message);
                    }
                }
            }
        };

        Vue.onMounted(loadAllData);

        // Membersihkan listener agar tidak memory leak saat pindah halaman
        Vue.onUnmounted(() => {
            if (typeof fdb !== 'undefined') {
                ['products', 'transactions', 'members'].forEach(table => {
                    fdb.ref(table).off('value', firebaseListeners[table]);
                });
            }
        });

        return { stats, storeSettings, saveSettings, handleExport, handleImport, handleResetData };
    },
    template: `
    <div class="w-full flex flex-col gap-4 py-2 animate-zoom-in no-scrollbar px-1 pb-24">
        <div class="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[1.5rem] text-white shadow-xl">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 m-0 text-center">Ringkasan Data (Real-time)</h3>
            <div class="grid grid-cols-3 gap-4 mt-6 text-center">
                <div class="flex flex-col gap-1">
                    <div class="text-2xl font-black leading-none">{{ stats.products }}</div>
                    <div class="text-[8px] font-bold uppercase opacity-60 tracking-wider">Produk</div>
                </div>
                <div class="flex flex-col gap-1 border-x border-white/20">
                    <div class="text-2xl font-black leading-none">{{ stats.transactions }}</div>
                    <div class="text-[8px] font-bold uppercase opacity-60 tracking-wider">Transaksi</div>
                </div>
                <div class="flex flex-col gap-1">
                    <div class="text-2xl font-black leading-none">{{ stats.members }}</div>
                    <div class="text-[8px] font-bold uppercase opacity-60 tracking-wider">Member</div>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-3">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Profil Toko</h4>
            <div class="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                <div class="grid gap-4">
                    <div class="group">
                        <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Nama Toko</label>
                        <input v-model="storeSettings.storeName" type="text" class="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                    </div>
                    <div>
                        <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Alamat</label>
                        <input v-model="storeSettings.address" type="text" class="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">WhatsApp</label>
                            <input v-model="storeSettings.phone" type="text" class="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Catatan Struk</label>
                            <input v-model="storeSettings.footerNote" type="text" class="w-full p-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none">
                        </div>
                    </div>
                </div>
                <button @click="saveSettings" class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <i class="ri-save-3-line text-lg"></i> Simpan Pengaturan
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-3">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Sistem & Backup</h4>
            <div class="grid grid-cols-1 gap-3">
                <div @click="handleExport" class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-all">
                    <div class="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl"><i class="ri-download-cloud-line"></i></div>
                    <div class="flex-1"><div class="text-[11px] font-black text-gray-800 uppercase">Ekspor Data (.json)</div></div>
                </div>
                <label class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 active:bg-gray-50 transition-all cursor-pointer">
                    <div class="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl"><i class="ri-upload-cloud-line"></i></div>
                    <div class="flex-1"><div class="text-[11px] font-black text-gray-800 uppercase">Impor Data</div></div>
                    <input type="file" accept=".json" @change="handleImport" class="hidden">
                </label>
            </div>
        </div>

        <div class="mt-4 p-4 bg-red-50 rounded-[1.5rem] border border-red-100">
            <h4 class="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 text-center">Zona Berbahaya</h4>
            <button @click="handleResetData" class="w-full py-3 bg-white text-red-500 border border-red-200 rounded-xl font-black text-[10px] uppercase active:bg-red-50 transition-all">
                Kosongkan Database
            </button>
        </div>

        <div class="py-8 text-center">
            <div class="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Sinar Pagi POS v1.3.1</div>
        </div>
    </div>
    `
};
