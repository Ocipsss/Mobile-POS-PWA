const PagePiutangPenjualan = {
    setup() {
        const piutangList = Vue.ref([]);
        const showModal = Vue.ref(false);
        const selectedTrans = Vue.ref(null);
        const inputCicilan = Vue.ref(null);

        const loadPiutang = async () => {
            const allTransactions = await db.transactions.toArray();
            const members = await db.members.toArray();
            
            piutangList.value = allTransactions
                .filter(t => t.status === 'hutang')
                .map(t => {
                    const member = members.find(m => m.id === t.memberId);
                    // Hitung sisa hutang
                    const sisa = t.total - (t.amountPaid || 0);
                    return {
                        ...t,
                        memberName: member ? member.name : 'Umum/Tanpa Nama',
                        sisaHutang: sisa
                    };
                }).reverse();
        };

        const openModal = (trans) => {
            selectedTrans.value = trans;
            inputCicilan.value = trans.sisaHutang; // Default isi sisa hutang
            showModal.value = true;
        };

        const prosesCicilan = async () => {
            if (!inputCicilan.value || inputCicilan.value <= 0) return;
            
            const trans = selectedTrans.value;
            const nominal = Number(inputCicilan.value);
            
            // Riwayat cicilan baru
            const newPayment = {
                date: new Date().toISOString(),
                amount: nominal
            };

            const updatedPayments = trans.payments ? [...trans.payments, newPayment] : [newPayment];
            const totalSudahBayar = (trans.amountPaid || 0) + nominal;
            const statusBaru = totalSudahBayar >= trans.total ? 'lunas' : 'hutang';

            try {
                await db.transactions.update(trans.id, {
                    amountPaid: totalSudahBayar,
                    payments: updatedPayments,
                    status: statusBaru
                });

                alert(statusBaru === 'lunas' ? "Piutang Lunas!" : "Cicilan Berhasil Dicatat");
                showModal.value = false;
                loadPiutang();
            } catch (err) {
                alert("Gagal mencatat cicilan");
            }
        };

        const formatRupiah = (val) => "Rp " + (val || 0).toLocaleString('id-ID');

        Vue.onMounted(loadPiutang);

        return { 
            piutangList, formatRupiah, openModal, 
            showModal, selectedTrans, inputCicilan, prosesCicilan 
        };
    },
    template: `
    <div class="p-4 flex flex-col gap-4">
        <div class="px-1">
            <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Piutang Penjualan</h3>
            <p class="text-[10px] text-gray-400 font-bold uppercase">Manajemen Cicilan & Pelunasan</p>
        </div>

        <div class="grid gap-3">
            <div v-for="p in piutangList" :key="p.id" class="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div class="absolute top-0 left-0 h-1 bg-orange-400" :style="{ width: (p.amountPaid / p.total * 100) + '%' }"></div>

                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                            <i class="ri-history-line text-xl"></i>
                        </div>
                        <div>
                            <div class="text-[12px] font-black text-gray-800 uppercase leading-tight">{{ p.memberName }}</div>
                            <div class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                #{{ p.id }} • {{ new Date(p.date).toLocaleDateString('id-ID') }}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-bold text-gray-400 uppercase">Sisa</div>
                        <div class="text-sm font-black text-red-600">{{ formatRupiah(p.sisaHutang) }}</div>
                    </div>
                </div>

                <div class="flex gap-2 mb-3 bg-gray-50 p-2 rounded-xl text-[10px]">
                    <div class="flex-1 text-center border-r border-gray-200">
                        <span class="block text-gray-400 uppercase font-bold">Total Nota</span>
                        <span class="font-black text-gray-700">{{ formatRupiah(p.total) }}</span>
                    </div>
                    <div class="flex-1 text-center">
                        <span class="block text-gray-400 uppercase font-bold">Masuk</span>
                        <span class="font-black text-green-600">{{ formatRupiah(p.amountPaid) }}</span>
                    </div>
                </div>

                <button @click="openModal(p)" class="w-full py-3 bg-blue-600 text-white rounded-xl border-none font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all">
                    CATAT CICILAN / LUNAS
                </button>
            </div>

            <div v-if="piutangList.length === 0" class="py-20 text-center opacity-30 flex flex-col items-center">
                <i class="ri-checkbox-circle-line text-4xl text-gray-400 mb-2"></i>
                <p class="text-[10px] font-black uppercase">Semua Piutang Lunas</p>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div class="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-zoom-in">
                <div class="text-center mb-6">
                    <h4 class="text-lg font-black text-gray-800 uppercase">Bayar Cicilan</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase">{{ selectedTrans.memberName }} • Nota #{{ selectedTrans.id }}</p>
                </div>

                <div class="mb-6">
                    <label class="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Nominal Pembayaran</label>
                    <input type="number" v-model="inputCicilan" 
                           class="w-full p-4 bg-gray-50 border-none rounded-2xl text-lg font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none">
                    <div class="mt-2 text-[10px] text-right text-gray-400 font-bold">
                        Sisa Piutang: {{ formatRupiah(selectedTrans.sisaHutang) }}
                    </div>
                </div>

                <div class="flex gap-3">
                    <button @click="showModal = false" class="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase border-none">Batal</button>
                    <button @click="prosesCicilan" class="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase border-none shadow-lg shadow-blue-200">Simpan</button>
                </div>
            </div>
        </div>
    </div>
    `
};
