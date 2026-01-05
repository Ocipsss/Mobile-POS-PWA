// components/pages/Pengaturan.js //
const PagePengaturan = {
    setup() {
        const stats = Vue.ref({
            products: 0,
            transactions: 0,
            members: 0
        });

        // State untuk Pengaturan Toko & Printer
        const storeSettings = Vue.ref({
            storeName: 'SINAR PAGI',
            address: 'Jl. Raya Utama No. 01',
            phone: '0812-3456-7890',
            footerNote: 'Terima Kasih Atas Kunjungan Anda'
        });

        // Load data awal
        const loadAllData = async () => {
            // Load Statistik
            stats.value.products = await db.products.count();
            stats.value.transactions = await db.transactions.count();
            stats.value.members = await db.members.count();

            // 1. Load dari Cloud (Firebase) jika ada
            if (typeof fdb !== 'undefined') {
                try {
                    const snapshot = await fdb.ref('settings/store').once('value');
                    const cloudData = snapshot.val();
                    if (cloudData) {
                        storeSettings.value = cloudData;
                        // Update localstorage agar tetap sinkron
                        localStorage.setItem('sinar_pagi_settings', JSON.stringify(cloudData));
                    } else {
                        // 2. Jika cloud kosong, baru ambil dari LocalStorage
                        const savedSettings = localStorage.getItem('sinar_pagi_settings');
                        if (savedSettings) {
                            storeSettings.value = JSON.parse(savedSettings);
                        }
                    }
                } catch (err) {
                    console.error("Gagal memuat pengaturan cloud:", err);
                }
            }
        };

        // Simpan Pengaturan ke Lokal & Cloud
        const saveSettings = async () => {
            try {
                // Simpan ke LocalStorage
                localStorage.setItem('sinar_pagi_settings', JSON.stringify(storeSettings.value));

                // Simpan ke Firebase (Cloud Sync)
                if (typeof fdb !== 'undefined') {
                    await fdb.ref('settings/store').set({
                        ...storeSettings.value,
                        updatedAt: new Date().toISOString()
                    });
                }

                alert("✅ Pengaturan Toko Berhasil Disimpan ke Cloud!");
                // Memicu event agar komponen lain (seperti Struk) terupdate
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } catch (err) {
                alert("❌ Gagal menyimpan ke cloud: " + err.message);
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
            } else {
                alert("Gagal: " + res.message);
            }
            event.target.value = '';
        };

        const handleResetData = async () => {
            const murni = confirm("PERINGATAN KERAS!\n\nSemua data (Produk, Transaksi, Member, Kategori) akan DIHAPUS PERMANEN dari perangkat ini dan juga dari CLOUD (Firebase).\n\nApakah Anda benar-benar yakin?");
            
            if (murni) {
                const doubleCheck = confirm("Tindakan ini tidak bisa dibatalkan. Klik OK untuk menghapus semuanya.");
                if (doubleCheck) {
                    try {
                        if (typeof fdb !== 'undefined') {
                            const tables = ['products', 'categories', 'transactions', 'members', 'settings'];
                            for (const t of tables) {
                                await fdb.ref(t).remove();
                            }
                        }
                        await db.products.clear();
                        await db.categories.clear();
                        await db.transactions.clear();
                        await db.members.clear();

                        alert("Database telah dikosongkan.");
                        window.location.reload();
                    } catch (err) {
                        alert("Gagal mereset: " + err.message);
                    }
                }
            }
        };

        Vue.onMounted(loadAllData);

        return { stats, storeSettings, saveSettings, handleExport, handleImport, handleResetData };
    },
    template: `
   <div class="w-full flex flex-col gap-4 py-2 animate-zoom-in no-scrollbar px-1 pb-24">
        
        <div class="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[1rem] text-white shadow-xl">
            <h3 class="text-sm font-black uppercase tracking-widest opacity-80 m-0">Status Data</h3>
            <div class="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                    <div class="text-xl font-black">{{ stats.products }}</div>
                    <div class="text-[8px] font-bold uppercase opacity-60">Produk</div>
                </div>
                <div class="border-l border-white/20">
                    <div class="text-xl font-black">{{ stats.transactions }}</div>
                    <div class="text-[8px] font-bold uppercase opacity-60">Transaksi</div>
                </div>
                <div class="border-l border-white/20">
                    <div class="text-xl font-black">{{ stats.members }}</div>
                    <div class="text-[8px] font-bold uppercase opacity-60">Member</div>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-4">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Identitas Toko & Struk</h4>
            <div class="bg-white p-6 rounded-[1rem] border border-gray-100 shadow-sm flex flex-col gap-4">
                <div>
                    <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Nama Toko (Header)</label>
                    <input v-model="storeSettings.storeName" type="text" class="form-control font-bold" placeholder="Contoh: Sinar Pagi POS">
                </div>
                <div>
                    <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Alamat</label>
                    <input v-model="storeSettings.address" type="text" class="form-control" placeholder="Alamat lengkap...">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">No. Telepon</label>
                        <input v-model="storeSettings.phone" type="text" class="form-control" placeholder="0812...">
                    </div>
                    <div>
                        <label class="text-[9px] font-black text-gray-400 uppercase ml-2 mb-1 block">Pesan Bawah Struk</label>
                        <input v-model="storeSettings.footerNote" type="text" class="form-control" placeholder="Terima kasih...">
                    </div>
                </div>
                <button @click="saveSettings" 
                        class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 active:scale-95 transition-all tracking-widest mt-2 flex items-center justify-center gap-2">
                    <i class="ri-cloud-line text-lg"></i>
                    Simpan Ke Cloud
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-4">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Keamanan & Cadangan</h4>
            
            <div @click="handleExport" class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all cursor-pointer">
                <div class="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl">
                    <i class="ri-cloud-download-line"></i>
                </div>
                <div class="flex-1">
                    <div class="text-sm font-black text-gray-800 uppercase">Download Backup</div>
                    <div class="text-[10px] text-gray-500 font-medium">Simpan data ke file .json</div>
                </div>
                <i class="ri-arrow-right-s-line text-gray-300 text-xl"></i>
            </div>

            <label class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all cursor-pointer">
                <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-2xl">
                    <i class="ri-upload-cloud-2-line"></i>
                </div>
                <div class="flex-1">
                    <div class="text-sm font-black text-gray-800 uppercase">Restore Data</div>
                    <div class="text-[10px] text-gray-500 font-medium">Pulihkan data dari file backup</div>
                    <input type="file" accept=".json" @change="handleImport" class="hidden">
                </div>
                <i class="ri-arrow-right-s-line text-gray-300 text-xl"></i>
            </label>
        </div>

        <div class="flex flex-col gap-4">
            <h4 class="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] ml-2">Zona Bahaya</h4>
            <div class="bg-red-50 p-6 rounded-[2rem] border-2 border-dashed border-red-100">
                <p class="text-[10px] text-red-500 font-bold mb-4 leading-relaxed uppercase tracking-tighter text-center">
                    Menghapus data akan membersihkan seluruh database secara permanen.
                </p>
                <button @click="handleResetData" 
                        class="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-100 active:scale-95 transition-all tracking-widest">
                    Kosongkan Database
                </button>
            </div>
        </div>

        <div class="mt-4 p-6 text-center">
            <i class="ri-smartphone-line text-2xl text-gray-300"></i>
            <div class="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">Sinar Pagi POS v1.3.1</div>
            <div class="text-[8px] text-gray-300 font-bold uppercase">Database: IndexedDB + Firebase Cloud</div>
        </div>

    </div>
    `
};
