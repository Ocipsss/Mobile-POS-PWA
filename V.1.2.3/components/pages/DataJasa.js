// components/pages/DataJasa.js
const PageDataJasa = {
    setup() {
        const listJasa = Vue.ref([]);
        const form = Vue.ref({ name: '', price: 0 });
        const isEdit = Vue.ref(false);
        const currentId = Vue.ref(null);

        const loadJasa = async () => {
            // Memastikan mengambil dari tabel services di IndexedDB
            listJasa.value = await db.services.toArray();
        };

        const simpanJasa = async () => {
            if (!form.value.name || form.value.price < 0) {
                return alert("Nama dan Harga jasa harus diisi dengan benar!");
            }
            try {
                if (isEdit.value) {
                    await db.services.update(currentId.value, { ...form.value });
                } else {
                    await db.services.add({ ...form.value });
                }
                cancelEdit();
                loadJasa();
            } catch (err) {
                console.error(err);
                alert("Gagal menyimpan data");
            }
        };

        const editJasa = (item) => {
            form.value = { ...item };
            currentId.value = item.id;
            isEdit.value = true;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const cancelEdit = () => {
            form.value = { name: '', price: 0 };
            isEdit.value = false;
            currentId.value = null;
        };

        const hapusJasa = async (id) => {
            if (confirm("Hapus jasa ini secara permanen?")) {
                await db.services.delete(id);
                loadJasa();
            }
        };

        const formatR = (v) => "Rp " + (v || 0).toLocaleString('id-ID');

        Vue.onMounted(loadJasa);

        return { listJasa, form, simpanJasa, editJasa, hapusJasa, isEdit, cancelEdit, formatR };
    },
    template: `
    <div class="w-full flex flex-col gap-6 py-4 animate-zoom-in px-2 pb-28">
        
        <div class="flex flex-col px-2">
            <span class="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Master Data</span>
            <h3 class="text-xl font-black text-gray-800 uppercase tracking-tighter m-0">Layanan Jasa Seduh</h3>
        </div>

        <div class="bg-white p-6 rounded-[1rem] shadow-xl shadow-gray-200/40 border border-gray-100">
            <div class="flex flex-col gap-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Nama Layanan</label>
                        <input v-model="form.name" type="text" placeholder="Misal: Jasa Masak Mie" 
                            class="w-full p-4 bg-gray-50 border border-gray-100 rounded-[1rem] text-sm font-bold text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-1">Biaya Tambahan (Rp)</label>
                        <input v-model.number="form.price" type="number" placeholder="0" 
                            class="w-full p-4 bg-gray-50 border border-gray-100 rounded-[1rem] text-sm font-black text-blue-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                    </div>
                </div>

                <div class="flex gap-2 mt-2">
                    <button @click="simpanJasa" 
                        class="flex-1 py-4 bg-blue-600 text-white rounded-[1rem] font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">
                        {{ isEdit ? 'Simpan Perubahan' : 'Tambah Jasa' }}
                    </button>
                    <button v-if="isEdit" @click="cancelEdit" 
                        class="px-6 py-4 bg-gray-100 text-gray-500 rounded-[1rem] font-black text-[11px] uppercase active:scale-95 transition-all">
                        Batal
                    </button>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-3">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <i class="ri-list-settings-line"></i> Daftar Jasa Aktif
            </h4>
            
            <div class="flex flex-col gap-2">
                <div v-for="jasa in listJasa" :key="jasa.id" 
                    class="bg-white p-4 rounded-[1rem] flex items-center justify-between border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
                    
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-[1rem] flex items-center justify-center text-xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <i class="ri-customer-service-2-line"></i>
                        </div>
                        <div>
                            <div class="text-[13px] font-black text-gray-800 uppercase leading-none mb-1">{{ jasa.name }}</div>
                            <div class="text-[11px] text-blue-600 font-bold">{{ formatR(jasa.price) }}</div>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <button @click="editJasa(jasa)" 
                            class="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border-none transition-all">
                            <i class="ri-edit-box-line text-lg"></i>
                        </button>
                        <button @click="hapusJasa(jasa.id)" 
                            class="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border-none transition-all">
                            <i class="ri-delete-bin-7-line text-lg"></i>
                        </button>
                    </div>
                </div>

                <div v-if="listJasa.length === 0" class="py-16 text-center bg-gray-50 rounded-[1rem] border border-dashed border-gray-200">
                    <i class="ri-service-line text-4xl text-gray-200 mb-2 block"></i>
                    <p class="text-[10px] font-black uppercase text-gray-300 tracking-widest">Belum ada layanan jasa</p>
                </div>
            </div>
        </div>

    </div>
    `
};
