window.PageStockMonitor = {
    setup() {
        const products = Vue.ref([]);
        const filterStatus = Vue.ref('all');
        const isLoading = Vue.ref(false);

        const loadStock = async () => {
            isLoading.value = true;
            try {
                // Ambil data dari Firebase agar sinkron antar perangkat
                if (typeof fdb !== 'undefined') {
                    const snapshot = await fdb.ref('products').once('value');
                    const data = snapshot.val();
                    if (data) {
                        const cloudProducts = Object.values(data);
                        // Urutkan berdasarkan stok paling sedikit
                        products.value = cloudProducts.sort((a, b) => a.qty - b.qty);
                        
                        // Opsional: Update database lokal agar tetap sinkron saat offline
                        await db.products.clear();
                        await db.products.bulkAdd(cloudProducts);
                    }
                } else {
                    // Fallback ke lokal jika tidak ada koneksi
                    const allProducts = await db.products.toArray();
                    products.value = allProducts.sort((a, b) => a.qty - b.qty);
                }
            } catch (err) {
                console.error("Gagal load stok:", err);
            } finally {
                isLoading.value = false;
            }
        };

        const filteredProducts = Vue.computed(() => {
            if (filterStatus.value === 'kritis') return products.value.filter(p => p.qty <= 5);
            if (filterStatus.value === 'menipis') return products.value.filter(p => p.qty > 5 && p.qty <= 15);
            return products.value;
        });

        const getStockTheme = (qty) => {
            if (qty <= 5) return 'bg-rose-50 text-rose-500 border-rose-100';
            if (qty <= 15) return 'bg-orange-50 text-orange-400 border-orange-100';
            return 'bg-blue-50 text-blue-400 border-blue-100';
        };

        const getStatusLabel = (qty) => {
            if (qty <= 5) return 'Kritis';
            if (qty <= 15) return 'Menipis';
            return 'Aman';
        };

        Vue.onMounted(loadStock);

        return { filteredProducts, filterStatus, getStockTheme, getStatusLabel, loadStock, isLoading };
    },
    template: `
    <div class="p-6 space-y-6 pb-24 bg-white min-h-full">
        <div v-if="isLoading" class="text-center py-2">
            <span class="text-[8px] font-black text-blue-500 uppercase animate-pulse">Sinkronisasi Stok...</span>
        </div>

        <div class="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
            <button @click="filterStatus = 'all'"
                :class="filterStatus === 'all' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 bg-transparent'"
                class="flex-1 py-2 rounded-xl border-none text-[10px] font-black uppercase tracking-widest transition-all">
                All
            </button>
            <button @click="filterStatus = 'kritis'"
                :class="filterStatus === 'kritis' ? 'text-blue-500 font-black' : 'text-slate-400 bg-transparent'"
                class="flex-1 py-2 rounded-xl border-none text-[10px] uppercase tracking-widest transition-all">
                Kritis
            </button>
            <button @click="filterStatus = 'menipis'"
                :class="filterStatus === 'menipis' ? 'text-blue-500 font-black' : 'text-slate-400 bg-transparent'"
                class="flex-1 py-2 rounded-xl border-none text-[10px] uppercase tracking-widest transition-all">
                Menipis
            </button>
        </div>

        <div class="flex flex-col gap-4">
            <div v-for="p in filteredProducts" :key="p.id" 
                class="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                
                <div class="flex items-center gap-4">
                    <div :class="getStockTheme(p.qty)" 
                         class="w-14 h-14 rounded-[1.5rem] flex flex-col items-center justify-center border transition-all">
                        <span class="text-lg font-black leading-none">{{ p.qty }}</span>
                        <span class="text-[7px] font-bold uppercase opacity-60">{{ p.unit || 'pcs' }}</span>
                    </div>
                    
                    <div>
                        <div class="text-[13px] font-black text-slate-700 uppercase leading-tight tracking-tight">{{ p.name }}</div>
                        <div class="flex items-center gap-2 mt-1.5">
                            <span class="text-[8px] text-slate-400 font-black uppercase tracking-widest">{{ p.category }}</span>
                            <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span :class="getStockTheme(p.qty).split(' ')[1]" class="text-[8px] font-black uppercase tracking-widest">
                                {{ getStatusLabel(p.qty) }}
                            </span>
                        </div>
                    </div>
                </div>

                <button @click="loadStock" class="w-9 h-9 bg-slate-50 text-slate-300 rounded-full border-none flex items-center justify-center active:scale-95">
                    <i class="ri-refresh-line text-lg"></i>
                </button>
            </div>

            <div v-if="filteredProducts.length === 0" class="py-20 text-center opacity-30">
                <i class="ri-check-double-line text-4xl"></i>
                <p class="text-[10px] font-black uppercase mt-2 tracking-widest">Stok Aman</p>
            </div>
        </div>
    </div>
    `
};
