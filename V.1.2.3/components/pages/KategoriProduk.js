// components/pages/KategoriProduk.js //

const PageKategoriProduk = {
    setup() {
        const categoryName = Vue.ref('');
        const listCategories = Vue.ref([]);

        const loadCategories = async () => {
            try {
                // 1. Ambil data dari Lokal (Dexie)
                listCategories.value = await db.categories.toArray();
                
                // 2. (Opsional) Jika ingin memastikan data selalu fresh dari Cloud saat buka halaman:
                if (typeof fdb !== 'undefined') {
                    const snapshot = await fdb.ref('categories').once('value');
                    const cloudData = snapshot.val();
                    if (cloudData) {
                        // Jika ada perbedaan, Anda bisa melakukan sinkronisasi di sini
                        // Namun biasanya sinkronisasi otomatis sudah ditangani di background
                    }
                }
            } catch (err) {
                console.error("Gagal memuat kategori:", err);
            }
        };

        const addCategory = async () => {
            if (!categoryName.value.trim()) {
                alert("Nama kategori tidak boleh kosong!");
                return;
            }
            try {
                const name = categoryName.value.trim();
                
                // A. Simpan ke Lokal (Dexie)
                const localId = await db.categories.add({ name });

                // B. Sinkronkan ke Firebase
                if (typeof fdb !== 'undefined') {
                    await fdb.ref('categories/' + localId).set({
                        id: localId,
                        name: name,
                        updatedAt: new Date().toISOString()
                    });
                }

                categoryName.value = ''; 
                await loadCategories(); 
            } catch (err) {
                alert("Gagal menyimpan kategori ke Cloud: " + err.message);
            }
        };

        const deleteCategory = async (id) => {
            if (confirm("Hapus kategori ini secara permanen dari Cloud?")) {
                try {
                    // A. Hapus dari Lokal
                    await db.categories.delete(id);

                    // B. Hapus dari Firebase
                    if (typeof fdb !== 'undefined') {
                        await fdb.ref('categories/' + id).remove();
                    }

                    await loadCategories();
                } catch (err) {
                    alert("Gagal menghapus kategori di Cloud");
                }
            }
        };

        Vue.onMounted(loadCategories);

        return { categoryName, listCategories, addCategory, deleteCategory };
    },
    template: `
        <div class="flex flex-col gap-4 pb-24">
            <div class="p-5 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Input Kategori Baru</label>
                <div class="flex items-stretch gap-2 h-12">
                    <input 
                        v-model="categoryName" 
                        @keyup.enter="addCategory"
                        type="text" 
                        class="form-control flex-1 !m-0" 
                        placeholder="Contoh: Snack, Minuman, Sabun...">
                    
                    <button 
                        @click="addCategory" 
                        class="bg-blue-600 text-white border-none px-6 rounded-xl flex items-center justify-center active:scale-95 shadow-lg shadow-blue-100 transition-all">
                        <i class="ri-add-fill text-2xl"></i>
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 block">Daftar Kategori Terdaftar</label>
                
                <div v-for="cat in listCategories" :key="cat.id" 
                    class="p-4 bg-white rounded-2xl border border-gray-50 flex justify-between items-center shadow-sm mb-1 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                            <i class="ri-price-tag-3-fill"></i>
                        </div>
                        <span class="font-bold text-gray-700 uppercase text-xs tracking-tight">{{ cat.name }}</span>
                    </div>
                    
                    <button 
                        @click="deleteCategory(cat.id)" 
                        class="w-10 h-10 flex items-center justify-center text-red-400 bg-red-50 rounded-xl border-none active:bg-red-100 transition-all">
                        <i class="ri-delete-bin-7-line text-lg"></i>
                    </button>
                </div>

                <div v-if="listCategories.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-300">
                    <i class="ri-inbox-archive-line text-5xl mb-2"></i>
                    <p class="text-xs italic uppercase font-bold tracking-tighter">Belum ada data kategori</p>
                </div>
            </div>
            
            <div class="px-4 text-center">
                <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                    <i class="ri-cloud-line mr-1"></i> Data Kategori Terkoneksi Cloud
                </p>
            </div>
        </div>
    `
};
