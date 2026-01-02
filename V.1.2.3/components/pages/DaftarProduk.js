// components/pages/DaftarProduk.js //
// v1.5 - Removed Internal Search (Using Global Header) //

const PageDaftarProduk = {
    setup() {
        const products = Vue.ref([]);
        const selectedCategory = Vue.ref("Semua");
        const listCategories = Vue.ref([]);
        
        const isEditModalOpen = Vue.ref(false);
        const editingProduct = Vue.ref(null);
        const displayModal = Vue.ref("");
        const displaySell = Vue.ref("");

        const loadData = async () => {
            try {
                products.value = await db.products.toArray();
                listCategories.value = await db.categories.toArray();
            } catch (err) {
                console.error("Gagal memuat data:", err);
            }
        };

        const formatRupiahDisplay = (val) => {
            if (!val && val !== 0) return "";
            return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        };

        const updateNumber = (field, event) => {
            let rawValue = event.target.value.replace(/\D/g, "");
            let numValue = parseInt(rawValue) || 0;
            
            if (editingProduct.value) {
                editingProduct.value[field] = numValue;
                if (field === 'price_modal') displayModal.value = formatRupiahDisplay(numValue);
                if (field === 'price_sell') displaySell.value = formatRupiahDisplay(numValue);
            }
        };

        const openEdit = (p) => {
            editingProduct.value = JSON.parse(JSON.stringify(p));
            displayModal.value = formatRupiahDisplay(p.price_modal);
            displaySell.value = formatRupiahDisplay(p.price_sell);
            isEditModalOpen.value = true;
        };

        const updateProduct = async () => {
            try {
                await db.products.update(editingProduct.value.id, editingProduct.value);
                isEditModalOpen.value = false;
                await loadData();
                alert("Produk berhasil diperbarui!");
            } catch (err) {
                alert("Gagal memperbarui produk");
            }
        };

        const deleteProduct = async (id) => {
            if (confirm("Hapus produk ini secara permanen?")) {
                await db.products.delete(id);
                await loadData();
            }
        };

        const filteredProducts = Vue.computed(() => {
            return products.value.filter(p => {
                const matchCategory = selectedCategory.value === "Semua" || p.category === selectedCategory.value;
                return matchCategory;
            });
        });

        const formatRupiah = (val) => "Rp " + (val || 0).toLocaleString('id-ID');

        Vue.onMounted(loadData);

        return { 
            selectedCategory, listCategories, filteredProducts, 
            deleteProduct, formatRupiah, isEditModalOpen, editingProduct, 
            openEdit, updateProduct, displayModal, displaySell, updateNumber 
        };
    },
    
    template: `
        <div class="flex flex-col gap-3 pb-28">
            
            <div class="sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-2 pb-3 -mx-4 px-4 border-b border-gray-100">
                <div class="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    <button @click="selectedCategory = 'Semua'" 
                        :class="selectedCategory === 'Semua' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'"
                        class="px-5 py-2 rounded-full text-[10px] font-black uppercase border-none transition-all whitespace-nowrap active:scale-95">
                        Semua
                    </button>
                    <button v-for="c in listCategories" :key="c.id" @click="selectedCategory = c.name" 
                        :class="selectedCategory === c.name ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'"
                        class="px-5 py-2 rounded-full text-[10px] font-black uppercase border-none transition-all whitespace-nowrap active:scale-95">
                        {{c.name}}
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <div v-for="p in filteredProducts" :key="p.id" 
                    class="bg-white p-3 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-3 active:bg-gray-50 transition-all">
                    
                    <div class="w-12 h-12 bg-blue-50 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img v-if="p.image" :src="p.image" class="w-full h-full object-cover">
                        <i v-else class="ri-shopping-bag-3-fill text-blue-300 text-xl"></i>
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] font-black text-gray-800 truncate leading-tight uppercase">{{ p.name }}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[11px] font-black text-blue-600">{{ formatRupiah(p.price_sell) }}</span>
                            <span class="text-[10px] text-gray-300 font-medium">|</span>
                            <span class="text-[10px] font-bold" :class="p.qty <= 5 ? 'text-red-500' : 'text-gray-400'">
                                Stok: {{ p.qty }} <small class="font-normal">{{ p.unit }}</small>
                            </span>
                        </div>
                    </div>

                    <div class="flex gap-1.5">
                        <button @click="openEdit(p)" class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border-none flex items-center justify-center active:scale-90 transition-all">
                            <i class="ri-edit-line text-lg"></i>
                        </button>
                        <button @click="deleteProduct(p.id)" class="w-9 h-9 rounded-xl bg-red-50 text-red-400 border-none flex items-center justify-center active:scale-90 transition-all">
                            <i class="ri-delete-bin-line text-lg"></i>
                        </button>
                    </div>
                </div>

                <div v-if="filteredProducts.length === 0" class="py-20 text-center opacity-60">
                    <i class="ri-archive-line text-4xl text-gray-200"></i>
                    <p class="text-gray-400 text-[10px] mt-2 font-black uppercase tracking-widest">Belum ada produk di kategori ini</p>
                </div>
            </div>

            <div v-if="isEditModalOpen" class="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm" @click.self="isEditModalOpen = false">
                <div class="bg-white w-full max-w-md rounded-t-[32px] p-6 shadow-2xl animate-slide-up">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Edit Produk</h3>
                        <button @click="isEditModalOpen = false" class="bg-gray-100 border-none w-10 h-10 rounded-full flex items-center justify-center active:scale-90">
                            <i class="ri-close-line text-xl text-gray-500"></i>
                        </button>
                    </div>
                    <div class="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pb-4 no-scrollbar">
                        <div class="form-group">
                            <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1 tracking-widest">Nama Produk</label>
                            <input v-model="editingProduct.name" type="text" class="form-control !rounded-2xl bg-gray-50 border-none py-3 font-bold">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="form-group">
                                <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1 tracking-widest">Harga Modal</label>
                                <input :value="displayModal" @input="updateNumber('price_modal', $event)" type="text" inputmode="numeric" class="form-control font-black text-red-500 bg-red-50/50 border-none !rounded-2xl py-3 text-center">
                            </div>
                            <div class="form-group">
                                <label class="text-[10px] font-black text-green-500 uppercase mb-1 block ml-1 tracking-widest">Harga Jual</label>
                                <input :value="displaySell" @input="updateNumber('price_sell', $event)" type="text" inputmode="numeric" class="form-control font-black text-green-600 bg-green-50/50 border-none !rounded-2xl py-3 text-center">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="form-group">
                                <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1 tracking-widest">Stok</label>
                                <input v-model.number="editingProduct.qty" type="number" class="form-control !rounded-2xl bg-gray-50 border-none py-3 text-center font-bold">
                            </div>
                            <div class="form-group">
                                <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1 tracking-widest">Satuan</label>
                                <input v-model="editingProduct.unit" type="text" class="form-control !rounded-2xl bg-gray-50 border-none py-3 text-center font-bold">
                            </div>
                        </div>
                    </div>
                    <button @click="updateProduct" class="w-full bg-blue-600 text-white py-4 rounded-[20px] font-black mt-4 uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    `
};
