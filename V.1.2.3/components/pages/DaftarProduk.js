// components/pages/DaftarProduk.js //
// v1.9.1 - Ditambahkan Fitur Edit Kategori //

const PageDaftarProduk = {
    setup(props, { emit }) {
        const products = Vue.ref([]);
        const listCategories = Vue.ref([]);
        
        const isEditModalOpen = Vue.ref(false);
        const isDetailModalOpen = Vue.ref(false); 
        const editingProduct = Vue.ref(null);
        const detailProduct = Vue.ref(null); 
        
        const displayModal = Vue.ref("");
        const displaySell = Vue.ref("");

        const loadData = async () => {
            try {
                // Memuat semua produk dan kategori dari Dexie
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

        const openDetail = (p) => {
            detailProduct.value = p;
            isDetailModalOpen.value = true;
        };

        const openEdit = (p) => {
            // Clone data agar perubahan di modal tidak langsung merubah data di list sebelum disimpan
            editingProduct.value = JSON.parse(JSON.stringify(p));
            displayModal.value = formatRupiahDisplay(p.price_modal);
            displaySell.value = formatRupiahDisplay(p.price_sell);
            isDetailModalOpen.value = false;
            isEditModalOpen.value = true;
        };

        const updateProduct = async () => {
            try {
                // Simpan perubahan ke Dexie. 
                await db.products.put(JSON.parse(JSON.stringify(editingProduct.value)));
                
                isEditModalOpen.value = false;
                await loadData();
                alert("Produk berhasil diperbarui!");
            } catch (err) {
                alert("Gagal memperbarui: " + err.message);
            }
        };

        const deleteProduct = async (id) => {
            if (confirm("Hapus produk ini secara permanen?")) {
                try {
                    await db.products.delete(id);
                    isDetailModalOpen.value = false;
                    await loadData();
                    alert("Produk dihapus!");
                } catch (err) { 
                    alert("Gagal menghapus: " + err.message); 
                }
            }
        };

        // Event Listener untuk Barcode & Global Search
        const handleScanEvent = (e) => {
            if (isEditModalOpen.value && editingProduct.value) {
                editingProduct.value.code = e.detail;
            }
        };

        const handleOpenDetailEvent = (e) => {
            const p = products.value.find(item => item.id === e.detail);
            if (p) openDetail(p);
        };

        Vue.onMounted(() => {
            loadData();
            window.addEventListener('barcode-scanned-edit', handleScanEvent);
            window.addEventListener('open-product-detail', handleOpenDetailEvent);
        });

        Vue.onUnmounted(() => {
            window.removeEventListener('barcode-scanned-edit', handleScanEvent);
            window.removeEventListener('open-product-detail', handleOpenDetailEvent);
        });

        const formatRupiah = (val) => "Rp " + (val || 0).toLocaleString('id-ID');

        return { 
            products, listCategories, deleteProduct, formatRupiah, 
            isEditModalOpen, editingProduct, openEdit, updateProduct, 
            displayModal, displaySell, updateNumber,
            isDetailModalOpen, detailProduct, openDetail, emit
        };
    },
    
    template: `
        <div class="flex flex-col gap-3 pb-28 pt-2">
            
            <div class="flex flex-col gap-2">
                <div v-for="p in products" :key="p.id" @click="openDetail(p)"
                    class="bg-white p-3 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer">
                    
                    <div class="w-12 h-12 bg-blue-50 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img v-if="p.image" :src="p.image" class="w-full h-full object-cover">
                        <i v-else class="ri-shopping-bag-3-fill text-blue-300 text-xl"></i>
                    </div>

                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] font-black text-gray-800 truncate leading-tight uppercase">{{ p.name }}</div>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{{ p.code || 'Tanpa Kode' }}</span>
                            <span v-if="p.category" class="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">{{ p.category }}</span>
                        </div>
                        <div class="text-[11px] font-black text-blue-600 mt-1">{{ formatRupiah(p.price_sell) }}</div>
                    </div>

                    <div class="flex flex-col items-end gap-1">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg" :class="p.qty <= 5 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'">
                            {{ p.qty }} {{ p.unit }}
                        </span>
                        <i class="ri-arrow-right-s-line text-gray-300"></i>
                    </div>
                </div>

                <div v-if="products.length === 0" class="py-20 text-center opacity-60">
                    <i class="ri-archive-line text-4xl text-gray-200"></i>
                    <p class="text-gray-400 text-[10px] mt-2 font-black uppercase tracking-widest">Belum ada produk terdaftar</p>
                </div>
            </div>

            <div v-if="isDetailModalOpen" class="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 backdrop-blur-sm" @click.self="isDetailModalOpen = false">
                <div class="bg-white w-full max-w-md rounded-t-[32px] p-6 shadow-2xl animate-slide-up">
                    <div class="flex justify-center mb-4"><div class="w-12 h-1.5 bg-gray-200 rounded-full"></div></div>
                    
                    <div class="text-center mb-6">
                        <div class="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-3 overflow-hidden">
                            <img v-if="detailProduct.image" :src="detailProduct.image" class="w-full h-full object-cover">
                            <i v-else class="ri-shopping-bag-3-line text-4xl text-blue-500"></i>
                        </div>
                        <h2 class="text-lg font-black text-gray-800 uppercase tracking-tight">{{ detailProduct.name }}</h2>
                        <div class="flex justify-center gap-2 mt-1">
                            <span class="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase">{{ detailProduct.category || 'Tanpa Kategori' }}</span>
                            <span class="px-3 py-1 bg-blue-100 rounded-full text-[9px] font-black text-blue-600 uppercase">{{ detailProduct.code || 'Tanpa Barcode' }}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-8">
                        <div class="bg-gray-50 p-4 rounded-3xl">
                            <div class="text-[9px] font-black text-gray-400 uppercase mb-1">Stok & Satuan</div>
                            <div class="text-base font-black text-gray-800">{{ detailProduct.qty }} <small class="text-[10px] font-bold uppercase opacity-50">{{ detailProduct.unit }}</small></div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-3xl">
                            <div class="text-[9px] font-black text-green-400 uppercase mb-1">Harga Jual</div>
                            <div class="text-base font-black text-green-600">{{ formatRupiah(detailProduct.price_sell) }}</div>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <button @click="deleteProduct(detailProduct.id)" class="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase text-[10px]">Hapus</button>
                        <button @click="openEdit(detailProduct)" class="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Edit Data</button>
                    </div>
                </div>
            </div>

            <div v-if="isEditModalOpen" class="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 backdrop-blur-sm" @click.self="isEditModalOpen = false">
                <div class="bg-white w-full max-w-md rounded-t-[32px] p-6 shadow-2xl animate-slide-up">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Edit Produk</h3>
                        <button @click="isEditModalOpen = false" class="bg-gray-100 border-none w-10 h-10 rounded-full flex items-center justify-center">
                            <i class="ri-close-line text-xl text-gray-500"></i>
                        </button>
                    </div>

                    <div class="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pb-4 no-scrollbar">
                        <div class="form-group">
                            <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Nama Produk</label>
                            <input v-model="editingProduct.name" type="text" class="form-control !rounded-2xl bg-gray-50 border-none py-3 font-bold">
                        </div>

                        <div class="form-group">
                            <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Kategori</label>
                            <select v-model="editingProduct.category" class="form-control !rounded-2xl bg-gray-50 border-none py-3 font-bold w-full appearance-none">
                                <option value="">Tanpa Kategori</option>
                                <option v-for="cat in listCategories" :key="cat.id" :value="cat.name">
                                    {{ cat.name }}
                                </option>
                            </select>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="form-group">
                                <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Harga Modal</label>
                                <input :value="displayModal" @input="updateNumber('price_modal', $event)" type="text" inputmode="numeric" class="form-control font-black text-red-500 bg-red-50/50 border-none !rounded-2xl py-3 text-center">
                            </div>
                            <div class="form-group">
                                <label class="text-[10px] font-black text-green-500 uppercase mb-1 block tracking-widest">Harga Jual</label>
                                <input :value="displaySell" @input="updateNumber('price_sell', $event)" type="text" inputmode="numeric" class="form-control font-black text-green-600 bg-green-50/50 border-none !rounded-2xl py-3 text-center">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="form-group">
                                <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Stok</label>
                                <input v-model.number="editingProduct.qty" type="number" class="form-control !rounded-2xl bg-gray-50 border-none py-3 text-center font-bold">
                            </div>
                            <div class="form-group">
                                <label class="text-[10px] font-black text-gray-400 uppercase mb-1 block tracking-widest">Satuan</label>
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
