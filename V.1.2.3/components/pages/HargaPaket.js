// components/pages/HargaPaket.js
// v1.3 - Optimized for "Batang" Unit (Integer Ratio)

const PageHargaPaket = {
    components: {
        'global-search-component': GlobalSearchComponent
    },
    template: `
        <div class="flex flex-col h-full bg-slate-50">
            <div class="p-4 pb-2">
                <div class="mb-4">
                    <h2 class="text-xl font-black text-gray-800 uppercase tracking-tight">Pengaturan Eceran</h2>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Manajemen Satuan Produk Rokok</p>
                </div>

                <global-search-component 
                    v-model="searchQuery" 
                    placeholder="Cari nama rokok...">
                </global-search-component>
            </div>

            <div class="flex-1 overflow-y-auto no-scrollbar px-4 pb-20">
                <div class="flex flex-col gap-3 mt-2">
                    <div v-for="p in filteredProducts" :key="p.id" 
                         class="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 animate-zoom-in">
                        
                        <div class="flex justify-between items-center mb-3">
                            <div class="min-w-0 flex-1">
                                <div class="text-[11px] font-black text-slate-700 uppercase leading-tight truncate">{{ p.name }}</div>
                                <div class="text-[9px] font-bold text-blue-600 uppercase mt-1">
                                    Harga Dasar: Rp {{ p.price_sell.toLocaleString('id-ID') }}
                                </div>
                            </div>
                            <button @click="openAddModal(p)" 
                                    class="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center border-none active:scale-90 transition-all shadow-lg shadow-blue-100">
                                <i class="ri-add-line text-lg"></i>
                            </button>
                        </div>

                        <div v-if="p.packages && p.packages.length > 0" class="flex flex-col gap-2 pt-3 border-t border-dashed border-slate-100">
                            <div v-for="pkg in p.packages" :key="pkg.id" 
                                 class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                    <div class="text-[10px] font-black text-slate-800 uppercase">{{ pkg.name }}</div>
                                    <div class="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                        Isi: {{ pkg.qty_pcs }} Btg | <span class="text-blue-600">Rp {{ pkg.price_sell.toLocaleString('id-ID') }}</span>
                                    </div>
                                </div>
                                <button @click="deletePackage(pkg.id)" class="w-8 h-8 flex items-center justify-center text-red-400 bg-white rounded-lg border border-red-50 active:bg-red-50 active:text-red-600 transition-all">
                                    <i class="ri-delete-bin-line text-sm"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div v-else class="text-center py-2">
                            <p class="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Belum ada paket/eceran</p>
                        </div>
                    </div>

                    <div v-if="filteredProducts.length === 0" class="py-20 text-center">
                        <i class="ri-search-2-line text-4xl text-slate-200"></i>
                        <p class="text-[10px] font-black text-slate-300 uppercase mt-2 tracking-widest">Produk tidak ditemukan</p>
                    </div>
                </div>
            </div>

            <div v-if="isModalOpen" class="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                <div class="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-zoom-in">
                    <div class="mb-6">
                        <h4 class="text-lg font-black text-gray-800 uppercase tracking-tight">Tambah Satuan</h4>
                        <p class="text-[10px] text-blue-600 font-bold uppercase">{{ selectedProduct?.name }}</p>
                    </div>
                    
                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="text-[9px] font-black text-gray-400 uppercase ml-1">Nama Satuan</label>
                            <input v-model="form.name" type="text" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none mt-1" placeholder="Misal: Bungkus atau Batang">
                        </div>
                        
                        <div>
                            <label class="text-[9px] font-black text-gray-400 uppercase ml-1">Jumlah Batang (Qty)</label>
                            <input v-model.number="form.qty_pcs" type="number" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none mt-1" placeholder="Misal: 12">
                            <p class="text-[8px] text-slate-400 font-black mt-2 leading-relaxed uppercase">
                                * Masukkan isi batang untuk paket ini.<br>
                                (Eceran = 1 | Bungkus 12 = 12 | Bungkus 16 = 16)
                            </p>
                        </div>

                        <div>
                            <label class="text-[9px] font-black text-gray-400 uppercase ml-1">Harga Jual</label>
                            <input v-model.number="form.price_sell" type="number" class="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none mt-1" placeholder="Rp ...">
                        </div>
                    </div>

                    <div class="flex gap-3 mt-8">
                        <button @click="isModalOpen = false" class="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] border-none active:scale-95 transition-all">Batal</button>
                        <button @click="savePackage" class="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] border-none shadow-lg shadow-blue-100 active:scale-95 transition-all">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const searchQuery = Vue.ref("");
        const products = Vue.ref([]);
        const isModalOpen = Vue.ref(false);
        const selectedProduct = Vue.ref(null);
        const form = Vue.ref({ name: '', qty_pcs: null, price_sell: null });

        const loadData = async () => {
            try {
                const allProducts = await db.products.toArray();
                const rokokProducts = allProducts.filter(p => 
                    p.category && p.category.toLowerCase().includes('rokok')
                );
                for (let p of rokokProducts) {
                    p.packages = await db.product_packages.where('productId').equals(p.id).toArray();
                }
                products.value = rokokProducts;
            } catch (err) {
                console.error("Gagal load data:", err);
            }
        };

        const filteredProducts = Vue.computed(() => {
            if (!searchQuery.value) return products.value;
            const q = searchQuery.value.toLowerCase();
            return products.value.filter(p => p.name.toLowerCase().includes(q));
        });

        const openAddModal = (product) => {
            selectedProduct.value = product;
            form.value = { name: '', qty_pcs: null, price_sell: null };
            isModalOpen.value = true;
        };

        const savePackage = async () => {
            if (!form.value.name || !form.value.qty_pcs || !form.value.price_sell) return alert("Lengkapi data!");
            try {
                const newPackage = {
                    id: Date.now().toString(),
                    productId: selectedProduct.value.id,
                    name: form.value.name,
                    qty_pcs: parseInt(form.value.qty_pcs), // Pastikan Integer (Batang)
                    price_sell: parseInt(form.value.price_sell)
                };
                await db.product_packages.add(newPackage);
                isModalOpen.value = false;
                await loadData();
            } catch (err) {
                alert("Gagal menyimpan!");
            }
        };

        const deletePackage = async (id) => {
            if (confirm("Hapus satuan ini?")) {
                await db.product_packages.delete(id);
                await loadData();
            }
        };

        Vue.onMounted(loadData);

        return {
            searchQuery, filteredProducts, isModalOpen, form, selectedProduct,
            openAddModal, savePackage, deletePackage
        };
    }
};
