// components/pages/Pengaturan.js //
const PagePengaturan = {
    setup() {
        const stats = Vue.ref({
            products: 0,
            transactions: 0,
            members: 0
        });

        // Ambil ringkasan data untuk info kasir
        const loadStats = async () => {
            stats.value.products = await db.products.count();
            stats.value.transactions = await db.transactions.count();
            stats.value.members = await db.members.count();
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
                window.location.reload(); // Reload untuk menyegarkan state database di UI
            } else {
                alert("Gagal: " + res.message);
            }
            // Reset input file
            event.target.value = '';
        };

        Vue.onMounted(loadStats);

        return { stats, handleExport, handleImport };
    },
    template: `
    <div class="p-4 flex flex-col gap-6">
        
        <div class="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl">
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

        <div class="mt-4 p-6 border-2 border-dashed border-gray-200 rounded-[2rem] text-center">
            <i class="ri-smartphone-line text-2xl text-gray-300"></i>
            <div class="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-widest">Sinar Pagi POS v1.3.0</div>
            <div class="text-[8px] text-gray-300 font-bold uppercase">Database: IndexedDB (Offline First)</div>
        </div>

    </div>
    `
};
