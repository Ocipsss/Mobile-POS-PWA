// components/pages/KategoriProduk.js //

const PageKategoriProduk = {
    setup() {
        const categoryName = Vue.ref('');
        const listCategories = Vue.ref([]);

        const loadCategories = async () => {
            try {
                // Pastikan db sudah terdefinisi dari database.js
                listCategories.value = await db.categories.toArray();
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
                await db.categories.add({ 
                    name: categoryName.value.trim() 
                });
                categoryName.value = ''; 
                await loadCategories(); 
            } catch (err) {
                alert("Gagal menyimpan kategori");
            }
        };

        const deleteCategory = async (id) => {
            if (confirm("Hapus kategori ini?")) {
                await db.categories.delete(id);
                await loadCategories();
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
                        class="bg-blue-600 text-white border-none px-6 rounded-xl flex items-center justify-center active:scale-95 shadow-lg shadow-blue-100">
                        <i class="ri-add-fill text-2xl"></i>
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 block">Daftar Kategori Terdaftar</label>
                
                <div v-for="cat in listCategories" :key="cat.id" 
                    class="p-4 bg-white rounded-2xl border border-gray-50 flex justify-between items-center shadow-sm mb-1">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                            <i class="ri-price-tag-3-fill"></i>
                        </div>
                        <span class="font-bold text-gray-700 uppercase text-xs tracking-tight">{{ cat.name }}</span>
                    </div>
                    
                    <button 
                        @click="deleteCategory(cat.id)" 
                        class="w-10 h-10 flex items-center justify-center text-red-400 bg-red-50 rounded-xl border-none active:bg-red-100">
                        <i class="ri-delete-bin-7-line text-lg"></i>
                    </button>
                </div>

                <div v-if="listCategories.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-300">
                    <i class="ri-inbox-archive-line text-5xl mb-2"></i>
                    <p class="text-xs italic uppercase font-bold tracking-tighter">Belum ada data kategori</p>
                </div>
            </div>
        </div>
    `
};