// components/pages/StockMonitor.js
// v2.3 - Optimized for "BATANG" unit (Integer Stock)

window.PageStockMonitor = {
    components: {
        'global-search-component': GlobalSearchComponent
    },
    setup() {
        const products = Vue.ref([]);
        const filterStatus = Vue.ref('all');
        const searchQuery = Vue.ref('');
        const isLoading = Vue.ref(false);

        const loadStock = async () => {
            isLoading.value = true;
            try {
                let allProducts = [];
                // Sinkronisasi Hybrid: Firebase -> Lokal
                if (typeof fdb !== 'undefined') {
                    const snapshot = await fdb.ref('products').once('value');
                    const data = snapshot.val();
                    if (data) {
                        allProducts = Object.values(data);
                        await db.products.clear();
                        await db.products.bulkAdd(allProducts);
                    }
                } else {
                    allProducts = await db.products.toArray();
                }
                
                // Urutkan berdasarkan sisa batang paling sedikit
                products.value = allProducts.sort((a, b) => (a.stock || a.qty) - (b.stock || b.qty));
            } catch (err) {
                console.error("Gagal load stok:", err);
            } finally {
                isLoading.value = false;
            }
        };

        const filteredProducts = Vue.computed(() => {
            let list = products.value;

            // Search Filter
            if (searchQuery.value) {
                const q = searchQuery.value.toLowerCase();
                list = list.filter(p => 
                    p.name.toLowerCase().includes(q) || 
                    (p.category && p.category.toLowerCase().includes(q))
                );
            }

            // Status Filter (Logika Satuan Batang)
            if (filterStatus.value === 'kritis') return list.filter(p => (p.stock || p.qty) <= 12); // Stok <= 1 bungkus
            if (filterStatus.value === 'menipis') return list.filter(p => (p.stock || p.qty) > 12 && (p.stock || p.qty) <= 36);
            
            return list;
        });

        const getStockTheme = (qty) => {
            if (qty <= 12) return 'bg-rose-50 text-rose-500 border-rose-100'; // Merah jika < 12 batang
            if (qty <= 36) return 'bg-orange-50 text-orange-400 border-orange-100'; // Oranye jika < 3 bungkus
            return 'bg-blue-50 text-blue-400 border-blue-100';
        };

        const getStatusLabel = (qty) => {
            if (qty <= 12) return 'Kritis';
            if (qty <= 36) return 'Menipis';
            return 'Aman';
        };

        // Karena stok batang, kita tidak butuh angka di belakang koma
        const formatQty = (qty) => Math.floor(qty || 0);

        Vue.onMounted(loadStock);

        return { 
            filteredProducts, filterStatus, searchQuery, 
            getStockTheme, getStatusLabel, loadStock, isLoading, formatQty 
        };
    },
    template: `
<div class="fixed top-[64px] left-0 w-full h-[calc(100vh-64px)] bg-slate-50 flex flex-col overflow-hidden">
    
    <div class="w-full bg-slate-50 pt-3 pb-3 px-6 z-50 shrink-0 shadow-sm border-b border-slate-100">
        <div class="mb-3">
            <global-search-component 
                v-model="searchQuery" 
                placeholder="Cari rokok / produk...">
            </global-search-component>
        </div>
        
        <div class="flex gap-2 p-1 bg-white rounded-xl border border-slate-200">
            <button v-for="st in ['all', 'kritis', 'menipis']" :key="st"
                @click="filterStatus = st"
                :class="filterStatus === st ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 bg-slate-50'"
                class="flex-1 py-2 rounded-lg border-none text-[9px] font-black uppercase tracking-wider transition-all active:scale-95">
                {{ st }}
            </button>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto no-scrollbar px-4 pt-2 pb-40">
        <div v-if="isLoading" class="flex justify-center py-10 text-slate-300">
            <i class="ri-loader-4-line animate-spin text-2xl"></i>
        </div>

        <div v-else class="flex flex-col gap-2">
            <div v-for="p in filteredProducts" :key="p.id" 
                class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between animate-zoom-in">
                
                <div class="flex items-center gap-3 min-w-0">
                    <div :class="getStockTheme(p.stock || p.qty)" 
                         class="w-12 h-12 rounded-lg flex flex-col items-center justify-center border shrink-0">
                        <span class="text-xs font-black leading-none">{{ formatQty(p.stock || p.qty) }}</span>
                        <span class="text-[6px] font-bold uppercase opacity-60 mt-1">btg</span>
                    </div>
                    
                    <div class="min-w-0">
                        <div class="text-[11px] font-black text-slate-700 uppercase leading-tight truncate">
                            {{ p.name }}
                        </div>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[7px] text-slate-400 font-black uppercase">{{ p.category || 'No Category' }}</span>
                            <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span :class="getStockTheme(p.stock || p.qty).split(' ')[1]" class="text-[7px] font-black uppercase">
                                {{ getStatusLabel(p.stock || p.qty) }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button @click="loadStock" class="w-8 h-8 bg-slate-50 text-slate-300 rounded-full border-none flex items-center justify-center active:bg-blue-50 active:text-blue-500 transition-all">
                        <i class="ri-refresh-line text-sm"></i>
                    </button>
                </div>
            </div>

            <div v-if="filteredProducts.length === 0" class="py-20 text-center opacity-30">
                <i class="ri-inbox-line text-4xl"></i>
                <p class="text-[10px] font-black uppercase tracking-widest mt-2">Data tidak ditemukan</p>
            </div>
        </div>
    </div>
</div>
    `
};
