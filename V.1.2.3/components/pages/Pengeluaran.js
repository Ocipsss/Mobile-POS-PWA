const PagePengeluaran = {
    setup() {
        const expenses = Vue.ref([]);
        const isLoading = Vue.ref(false);
        
        // Form dengan dukungan Split Payment
        const form = Vue.ref({ 
            category: '', 
            amount: null, 
            note: '',
            paymentMethod: 'cash', // cash, qris, split
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

            // Validasi Split Payment
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
                alert("Pengeluaran berhasil dicatat!");
                
                // Reset Form
                form.value = { category: '', amount: null, note: '', paymentMethod: 'cash', cashAmount: 0, qrisAmount: 0 };
                loadExpenses();
            } catch (err) {
                alert("Gagal: " + err.message);
            }
        };

        const formatRupiah = (val) => "Rp " + (val || 0).toLocaleString('id-ID');

        Vue.onMounted(loadExpenses);

        return { expenses, form, tambahPengeluaran, formatRupiah, isLoading };
    },
    template: `
    <div class="p-4 flex flex-col gap-6 pb-24">
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 class="text-lg font-black text-gray-800 uppercase mb-4 tracking-tight">Catat Pengeluaran</h3>
            
            <div class="flex flex-col gap-4">
                <div>
                    <label class="text-[10px] font-black uppercase text-gray-400 ml-2">Kategori (Ketik Bebas)</label>
                    <input v-model="form.category" type="text" placeholder="Contoh: Listrik, Gaji, Sembako..." class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none">
                </div>

                <div>
                    <label class="text-[10px] font-black uppercase text-gray-400 ml-2">Total Nominal (Rp)</label>
                    <input v-model="form.amount" type="number" placeholder="0" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none">
                </div>

                <div>
                    <label class="text-[10px] font-black uppercase text-gray-400 ml-2">Metode Bayar</label>
                    <div class="grid grid-cols-3 gap-2 mt-1">
                        <button @click="form.paymentMethod = 'cash'" :class="form.paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'" class="py-3 rounded-xl text-[10px] font-black uppercase transition-all">CASH</button>
                        <button @click="form.paymentMethod = 'qris'" :class="form.paymentMethod === 'qris' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'" class="py-3 rounded-xl text-[10px] font-black uppercase transition-all">QRIS</button>
                        <button @click="form.paymentMethod = 'split'" :class="form.paymentMethod === 'split' ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400'" class="py-3 rounded-xl text-[10px] font-black uppercase transition-all">SPLIT</button>
                    </div>
                </div>

                <div v-if="form.paymentMethod === 'split'" class="grid grid-cols-2 gap-2 animate-zoom-in">
                    <div class="bg-orange-50 p-3 rounded-2xl">
                        <label class="text-[9px] font-black text-orange-400 uppercase">Porsi Cash</label>
                        <input v-model="form.cashAmount" type="number" class="w-full bg-transparent border-none p-0 text-sm font-black outline-none" placeholder="0">
                    </div>
                    <div class="bg-blue-50 p-3 rounded-2xl">
                        <label class="text-[9px] font-black text-blue-400 uppercase">Porsi QRIS</label>
                        <input v-model="form.qrisAmount" type="number" class="w-full bg-transparent border-none p-0 text-sm font-black outline-none" placeholder="0">
                    </div>
                </div>

                <div>
                    <label class="text-[10px] font-black uppercase text-gray-400 ml-2">Keterangan</label>
                    <textarea v-model="form.note" placeholder="Beli apa..." class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none h-20"></textarea>
                </div>

                <button @click="tambahPengeluaran" class="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">
                    Simpan Pengeluaran
                </button>
            </div>
        </div>

        <div class="flex flex-col gap-3">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Riwayat Pengeluaran</h4>
            <div v-for="ex in expenses" :key="ex.id" class="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                        <i :class="ex.paymentMethod === 'split' ? 'ri-shuffle-line' : (ex.paymentMethod === 'qris' ? 'ri-qr-code-line' : 'ri-money-dollar-circle-line')"></i>
                    </div>
                    <div>
                        <div class="text-[11px] font-black text-gray-800 uppercase leading-none mb-1">{{ ex.note }}</div>
                        <div class="text-[9px] text-gray-400 font-bold uppercase">{{ ex.category }} • {{ ex.paymentMethod }}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-black text-red-600">- {{ formatRupiah(ex.amount) }}</div>
                </div>
            </div>
        </div>
    </div>
    `
};
