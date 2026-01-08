const PageDataJasa = {
    setup() {
        const listJasa = Vue.ref([]);
        const form = Vue.ref({ name: '', price: 0 });
        const isEdit = Vue.ref(false);
        const currentId = Vue.ref(null);

        const loadJasa = async () => {
            listJasa.value = await db.services.toArray();
        };

        const simpanJasa = async () => {
            if (!form.value.name) return;
            if (isEdit.value) {
                await db.services.update(currentId.value, { ...form.value });
            } else {
                await db.services.add({ ...form.value });
            }
            form.value = { name: '', price: 0 };
            isEdit.value = false;
            loadJasa();
        };

        const editJasa = (item) => {
            form.value = { ...item };
            currentId.value = item.id;
            isEdit.value = true;
        };

        const hapusJasa = async (id) => {
            if (confirm("Hapus jasa ini?")) {
                await db.services.delete(id);
                loadJasa();
            }
        };

        Vue.onMounted(loadJasa);

        return { listJasa, form, simpanJasa, editJasa, hapusJasa, isEdit };
    },
    template: `
    <div class="p-4 pb-28">
        <h2 class="text-xl font-black uppercase mb-6">Pengaturan Jasa Seduh</h2>
        
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-6">
            <div class="space-y-4">
                <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase ml-2">Nama Jasa</label>
                    <input v-model="form.name" placeholder="Contoh: Seduh + Cup" class="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold">
                </div>
                <div>
                    <label class="text-[10px] font-black text-gray-400 uppercase ml-2">Harga Jasa (Rp)</label>
                    <input v-model.number="form.price" type="number" class="w-full p-4 bg-gray-50 rounded-2xl border-none font-black text-blue-600">
                </div>
                <button @click="simpanJasa" class="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    {{ isEdit ? 'Update Jasa' : 'Tambah Jasa Baru' }}
                </button>
            </div>
        </div>

        <div class="grid gap-3">
            <div v-for="jasa in listJasa" :key="jasa.id" class="bg-white p-4 rounded-3xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div>
                    <div class="font-black uppercase text-sm">{{ jasa.name }}</div>
                    <div class="text-blue-600 font-bold text-xs">Rp {{ jasa.price.toLocaleString() }}</div>
                </div>
                <div class="flex gap-2">
                    <button @click="editJasa(jasa)" class="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl"><i class="ri-edit-line"></i></button>
                    <button @click="hapusJasa(jasa.id)" class="w-10 h-10 bg-red-50 text-red-400 rounded-xl"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
        </div>
    </div>
    `
};
