// components/pages/DataMember.js
const PageDataMember = {
    setup() {
        const members = Vue.ref([]);
        const showModal = Vue.ref(false);
        const newMember = Vue.ref({ id: '', name: '', address: '' });

        const loadMembers = async () => {
            members.value = await db.members.toArray();
        };

        const saveMember = async () => {
            if (!newMember.value.name || !newMember.value.id) {
                return alert("ID Member dan Nama wajib diisi!");
            }
            
            try {
                const existing = await db.members.get(newMember.value.id);
                if (existing) return alert("ID Member sudah terdaftar!");

                await db.members.add({ 
                    id: newMember.value.id,
                    name: newMember.value.name,
                    address: newMember.value.address || '-'
                });
                
                newMember.value = { id: '', name: '', address: '' };
                showModal.value = false;
                loadMembers();
            } catch (err) {
                console.error("Gagal simpan member:", err);
                alert("Gagal menyimpan data.");
            }
        };

        const deleteMember = async (id) => {
            if (confirm(`Hapus pelanggan ID ${id}?`)) {
                await db.members.delete(id);
                loadMembers();
            }
        };

        Vue.onMounted(loadMembers);

        return { members, showModal, newMember, saveMember, deleteMember };
    },
    template: `
        <div class="flex flex-col gap-4 pb-24">
            <div class="flex justify-between items-center px-1">
                <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Data Member</h3>
                <button @click="showModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black border-none shadow-md active:scale-95 transition-all">
                    + TAMBAH BARU
                </button>
            </div>

            <div class="grid gap-3">
                <div v-for="m in members" :key="m.id" class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-sm">
                        <i class="ri-user-heart-line text-xl"></i>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <div class="text-[15px] font-black text-gray-800 truncate leading-tight">{{ m.name }}</div>
                        
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-gray-200">
                                ID: {{ m.id }}
                            </span>
                            <span class="text-[10px] text-gray-400 font-bold truncate opacity-70">
                               {{ m.address }}
                            </span>
                        </div>
                    </div>

                    <button @click="deleteMember(m.id)" class="text-gray-300 border-none bg-transparent hover:text-red-500 p-2">
                        <i class="ri-delete-bin-line text-lg"></i>
                    </button>
                </div>

                <div v-if="members.length === 0" class="py-20 text-center opacity-30 flex flex-col items-center">
                    <i class="ri-contacts-line text-5xl mb-2 text-gray-400"></i>
                    <p class="text-[10px] font-black uppercase tracking-[0.2em]">Daftar Member Kosong</p>
                </div>
            </div>

            <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
                <div class="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-slide-up">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Form Input</h3>
                        <button @click="showModal = false" class="bg-gray-100 border-none w-8 h-8 rounded-full flex items-center justify-center text-gray-400">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                    
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-gray-400 ml-2 uppercase">1. Nama Pelanggan</label>
                            <input v-model="newMember.name" type="text" placeholder="..." class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-inner">
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-gray-400 ml-2 uppercase">2. ID Member (Kunci)</label>
                            <input v-model="newMember.id" type="text" placeholder="..." class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-inner uppercase">
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-gray-400 ml-2 uppercase">3. Alamat (Opsional)</label>
                            <textarea v-model="newMember.address" placeholder="..." class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold shadow-inner" rows="2"></textarea>
                        </div>
                        
                        <button @click="saveMember" class="w-full py-4 bg-blue-600 text-white rounded-2xl border-none font-black text-xs uppercase shadow-lg active:scale-95 transition-all mt-2 tracking-widest">
                            SIMPAN DATA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
