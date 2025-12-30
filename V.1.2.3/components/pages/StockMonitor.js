// components/pages/StockMonitor.js //
const PageStockMonitor = {
    setup() {
        const products = Vue.ref([]);
        const filterStatus = Vue.ref('all'); // all, kritis, menipis

        const loadStock = async () => {
            const allProducts = await db.products.toArray();
            // Urutkan berdasarkan stok paling sedikit
            products.value = allProducts.sort((a, b) => a.qty - b.qty);
        };

        const filteredProducts = Vue.computed(() => {
            if (filterStatus.value === 'kritis') return products.value.filter(p => p.qty <= 5);
            if (filterStatus.value === 'menipis') return products.value.filter(p => p.qty > 5 && p.qty <= 15);
            return products.value;
        });

        const getStockClass = (qty) => {
            if (qty <= 5) return 'bg-red-50 text-red-600 border-red-100';
            if (qty <= 15) return 'bg-amber-50 text-amber-600 border-amber-100';
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        };

        const getStatusLabel = (qty) => {
            if (qty <= 5) return 'KRITIS';
            if (qty <= 15) return 'MENIPIS';
            return 'AMAN';
        };

        Vue.onMounted(loadStock);

        return { filteredProducts, filterStatus, getStockClass, getStatusLabel, loadStock };
    },
    template: `
    <div class="p-4 flex flex-col gap-4">
        <div class="flex gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button v-for="f in ['all', 'kritis', 'menipis']" 
                @click="filterStatus = f"
                :class="filterStatus === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'"
                class="flex-1 py-2 rounded-xl border-none text-[10px] font-black uppercase transition-all">
                {{ f }}
            </button>
        </div>

        <div class="flex flex-col gap-3">
            <div v-for="p in filteredProducts" :key="p.id" 
                class="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between animate-slide-up">
                
                <div class="flex items-center gap-4">
                    <div :class="getStockClass(p.qty)" 
                         class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center border transition-colors">
                        <span class="text-lg font-black leading-none">{{ p.qty }}</span>
                        <span class="text-[7px] font-bold uppercase">{{ p.unit || 'pcs' }}</span>
                    </div>
                    
                    <div>
                        <div class="text-[12px] font-black text-gray-800 uppercase leading-tight">{{ p.name }}</div>
                        <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {{ p.category }} • {{ getStatusLabel(p.qty) }}
                        </div>
                    </div>
                </div>

                <div class="text-right">
                    <button @click="loadStock" class="w-8 h-8 bg-gray-50 text-gray-400 rounded-full border-none">
                        <i class="ri-history-line"></i>
                    </button>
                </div>
            </div>

            <div v-if="filteredProducts.length === 0" class="py-20 text-center opacity-30">
                <i class="ri-shield-check-line text-5xl"></i>
                <p class="text-[10px] font-black uppercase mt-2 tracking-widest">Semua stok terpantau aman</p>
            </div>
        </div>
    </div>
    `
};
