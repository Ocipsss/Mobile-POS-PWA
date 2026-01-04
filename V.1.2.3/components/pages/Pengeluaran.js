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
                if (typeof fdb !== 'undefined' && navigator.onLine) {
                    const snap = await fdb.ref('expenses').limitToLast(20).once('value');
                    const data = snap.val();
                    expenses.value = data ? Object.values(data).reverse() : [];
                } else {
                    expenses.value = await db.expenses.orderBy('id').reverse().limit(20).toArray();
                }
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
                await db.expenses.add(newExp);
                form.value = { category: '', amount: null, note: '', paymentMethod: 'cash', cashAmount: 0, qrisAmount: 0 };
                loadExpenses();
                alert("Berhasil dicatat!");
            } catch (err) {
                alert("Gagal: " + err.message);
            }
        };

        const formatR = (val) => "Rp " + (val || 0).toLocaleString('id-ID');
        Vue.onMounted(loadExpenses);

        return { expenses, form, tambahPengeluaran, formatR, isLoading };
    },
    template: `
    <div class="w-full flex flex-col gap-5 py-2 animate-zoom-in no-scrollbar px-1 pb-28">
        
        <div class="flex flex-col px-3 mt-2">
            <span class="text-[9px] font-black text-red-500 uppercase tracking-[0.3em]">Operational</span>
            <h3 class="text-xl font-black text-gray-800 uppercase tracking-tighter m-0">Catat Pengeluaran</h3>
        </div>

        <div class="bg-white p-7 rounded-[1rem] shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
            <div class="relative z-10 flex flex-col gap-4">
                
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Kategori</label>
                        <input v-model="form.category" type="text" placeholder="Listrik..." 
                            class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-500 transition-all">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Nominal (Rp)</label>
                        <input v-model="form.amount" type="number" placeholder="0" 
                            class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-500 transition-all">
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Metode Pembayaran</label>
                    <div class="flex flex-row gap-2">
                        <button @click="form.paymentMethod = 'cash'" 
                            :class="form.paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'" 
                            class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all border border-gray-100">CASH</button>
                        <button @click="form.paymentMethod = 'qris'" 
                            :class="form.paymentMethod === 'qris' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'" 
                            class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all border border-gray-100">QRIS</button>
                        <button @click="form.paymentMethod = 'split'" 
                            :class="form.paymentMethod === 'split' ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400'" 
                            class="flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all border border-gray-100">SPLIT</button>
                    </div>
                </div>

                <div v-if="form.paymentMethod === 'split'" class="grid grid-cols-2 gap-2 animate-slide-up">
                    <div class="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <label class="text-[7px] font-black text-blue-500 uppercase">Porsi Cash</label>
                        <input v-model="form.cashAmount" type="number" class="w-full bg-transparent border-none p-0 text-[11px] font-black text-gray-800 outline-none" placeholder="0">
                    </div>
                    <div class="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <label class="text-[7px] font-black text-blue-500 uppercase">Porsi QRIS</label>
                        <input v-model="form.qrisAmount" type="number" class="w-full bg-transparent border-none p-0 text-[11px] font-black text-gray-800 outline-none" placeholder="0">
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-[8px] font-black uppercase text-gray-400 tracking-widest ml-1">Keterangan</label>
                    <textarea v-model="form.note" placeholder="Tulis catatan..." 
                        class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 h-16 resize-none focus:border-blue-500 transition-all"></textarea>
                </div>

                <button @click="tambahPengeluaran" class="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl active:scale-95 transition-all mt-2">
                    Simpan Data
                </button>
            </div>
            <i class="ri-hand-coin-line absolute -right-6 -bottom-6 text-[100px] text-gray-100 rotate-12 pointer-events-none"></i>
        </div>

        <div class="flex flex-col gap-3 px-1">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                <i class="ri-history-line"></i> Riwayat Hari Ini
            </h4>
            
            <div class="flex flex-col gap-2">
                <div v-for="ex in expenses" :key="ex.id" 
                    class="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm animate-slide-up active:scale-95 transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-lg shadow-inner">
                            <i :class="ex.paymentMethod === 'split' ? 'ri-shuffle-line' : (ex.paymentMethod === 'qris' ? 'ri-qr-code-line' : 'ri-money-dollar-circle-line')"></i>
                        </div>
                        <div>
                            <div class="text-[11px] font-black text-gray-800 uppercase leading-none mb-1">{{ ex.note }}</div>
                            <div class="text-[8px] text-gray-400 font-bold uppercase tracking-tight">
                                {{ ex.category }} • {{ ex.paymentMethod }}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[12px] font-black text-red-600 leading-none">{{ formatR(ex.amount) }}</div>
                        <div class="text-[7px] font-bold text-gray-300 uppercase mt-1">Selesai</div>
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
