// components/pages/Pengeluaran.js //
const PagePengeluaran = {
    setup() {
        const expenses = Vue.ref([]);
        const isLoading = Vue.ref(false);
        
        const form = Vue.ref({ 
            category: '', 
            amount: null, 
            note: '',
            paymentMethod: 'cash', 
            cashAmount: 0,
            qrisAmount: 0
        });

        const loadExpenses = async () => {
            isLoading.value = true;
            try {
                // Mengambil lebih banyak data (50) agar tidak ada data "hantu" yang tertinggal
                expenses.value = await db.expenses.orderBy('id').reverse().limit(50).toArray();
            } finally {
                isLoading.value = false;
            }
        };

        const tambahPengeluaran = async () => {
            const total = Number(form.value.amount);
            if (!total || !form.value.note || !form.value.category) {
                return alert("Kategori, Nominal, dan Keterangan wajib diisi!");
            }

            if (form.value.paymentMethod === 'split') {
                if ((Number(form.value.cashAmount) + Number(form.value.qrisAmount)) !== total) {
                    return alert("Jumlah Cash + QRIS harus sama dengan Total Pengeluaran!");
                }
            }

            const newExp = {
                date: new Date().toISOString(),
                category: form.value.category,
                amount: total,
                note: form.value.note,
                paymentMethod: form.value.paymentMethod,
                cashPart: form.value.paymentMethod === 'split' ? Number(form.value.cashAmount) : (form.value.paymentMethod === 'cash' ? total : 0),
                qrisPart: form.value.paymentMethod === 'split' ? Number(form.value.qrisAmount) : (form.value.paymentMethod === 'qris' ? total : 0),
                user: 'Admin'
            };

            try {
                const id = await db.expenses.add(newExp);
                
                // Sinkron ke Firebase jika online
                if (typeof fdb !== 'undefined' && navigator.onLine) {
                    await fdb.ref('expenses/' + id).set(newExp);
                }

                form.value = { category: '', amount: null, note: '', paymentMethod: 'cash', cashAmount: 0, qrisAmount: 0 };
                loadExpenses();
                alert("Berhasil dicatat!");
            } catch (err) {
                alert("Gagal: " + err.message);
            }
        };

        // FUNGSI BARU: Hapus satu data
        const hapusPengeluaran = async (id) => {
            if (!confirm("Hapus data pengeluaran ini?")) return;
            try {
                await db.expenses.delete(id);
                if (typeof fdb !== 'undefined' && navigator.onLine) {
                    await fdb.ref('expenses/' + id).remove();
                }
                loadExpenses();
            } catch (err) {
                alert("Gagal menghapus: " + err.message);
            }
        };

        const formatR = (val) => "Rp " + (val || 0).toLocaleString('id-ID');
        Vue.onMounted(loadExpenses);

        return { expenses, form, tambahPengeluaran, hapusPengeluaran, formatR, isLoading };
    },
    template: `
    <div class="w-full flex flex-col gap-5 py-2 animate-zoom-in no-scrollbar px-1 pb-28">
        
        <div class="flex justify-between items-end px-3 mt-2">
            <div class="flex flex-col">
                <span class="text-[9px] font-black text-red-500 uppercase tracking-[0.3em]">Operational</span>
                <h3 class="text-xl font-black text-gray-800 uppercase tracking-tighter m-0">Catat Pengeluaran</h3>
            </div>
            <i class="ri-wallet-3-line text-2xl text-gray-300"></i>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
            <div class="relative z-10 flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Kategori</label>
                        <input v-model="form.category" type="text" placeholder="Listrik..." 
                            class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-red-500 transition-all">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Nominal (Rp)</label>
                        <input v-model="form.amount" type="number" placeholder="0" 
                            class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-red-500 transition-all">
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Metode</label>
                    <div class="flex flex-row gap-2">
                        <button v-for="m in ['cash', 'qris', 'split']" :key="m" @click="form.paymentMethod = m" 
                            :class="form.paymentMethod === m ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-400 border-gray-100'" 
                            class="flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border">
                            {{ m }}
                        </button>
                    </div>
                </div>

                <div v-if="form.paymentMethod === 'split'" class="grid grid-cols-2 gap-2 animate-slide-up">
                    <div class="bg-red-50 p-3 rounded-xl border border-red-100">
                        <label class="text-[7px] font-black text-red-500 uppercase">Cash</label>
                        <input v-model="form.cashAmount" type="number" class="w-full bg-transparent border-none p-0 text-[11px] font-black text-gray-800 outline-none" placeholder="0">
                    </div>
                    <div class="bg-red-50 p-3 rounded-xl border border-red-100">
                        <label class="text-[7px] font-black text-red-500 uppercase">QRIS</label>
                        <input v-model="form.qrisAmount" type="number" class="w-full bg-transparent border-none p-0 text-[11px] font-black text-gray-800 outline-none" placeholder="0">
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Keterangan</label>
                    <textarea v-model="form.note" placeholder="Tulis catatan..." 
                        class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 h-16 resize-none focus:border-red-500 transition-all"></textarea>
                </div>

                <button @click="tambahPengeluaran" class="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl active:scale-95 transition-all mt-2">
                    Simpan Pengeluaran
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-3 px-1">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center justify-between">
                <span><i class="ri-history-line mr-1"></i> Riwayat Terakhir</span>
                <span class="text-[8px] bg-gray-100 px-2 py-1 rounded-md text-gray-500">Max 50 Data</span>
            </h4>
            
            <div class="flex flex-col gap-2">
                <div v-for="ex in expenses" :key="ex.id" 
                    class="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm animate-slide-up">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-lg shadow-inner">
                            <i :class="ex.paymentMethod === 'split' ? 'ri-shuffle-line' : (ex.paymentMethod === 'qris' ? 'ri-qr-code-line' : 'ri-money-dollar-circle-line')"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[11px] font-black text-gray-800 uppercase leading-none mb-1 truncate">{{ ex.note }}</div>
                            <div class="text-[8px] text-gray-400 font-bold uppercase tracking-tight">
                                {{ ex.category }} • {{ ex.paymentMethod }}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="text-right">
                            <div class="text-[12px] font-black text-red-600 leading-none">{{ formatR(ex.amount) }}</div>
                            <div class="text-[7px] font-bold text-gray-300 uppercase mt-1">{{ new Date(ex.date).toLocaleDateString() }}</div>
                        </div>
                        <button @click="hapusPengeluaran(ex.id)" class="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-300 hover:text-red-500 rounded-lg border-none transition-colors">
                            <i class="ri-delete-bin-6-line"></i>
                        </button>
                    </div>
                </div>

                <div v-if="expenses.length === 0" class="py-10 text-center opacity-20">
                    <i class="ri-refund-2-line text-4xl mb-1"></i>
                    <p class="text-[9px] font-black uppercase">Belum ada data</p>
                </div>
            </div>
        </div>
    </div>
    `
};
