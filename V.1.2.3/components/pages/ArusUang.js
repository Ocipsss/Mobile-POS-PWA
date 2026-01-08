// components/pages/ArusUang.js
const PageArusUang = {
    setup(props, { emit }) {
        const summary = Vue.ref({
            cashMasuk: 0, qrisMasuk: 0,
            cashKeluar: 0, qrisKeluar: 0,
            saldoCash: 0, saldoQRIS: 0,
            totalPiutang: 0
        });
        const isLoading = Vue.ref(true);

        const hitungArusKas = async () => {
            isLoading.value = true;
            try {
                const sales = await db.transactions.toArray();
                const expenses = await db.expenses.toArray();

                let inCash = 0, inQRIS = 0, piutang = 0;
                let outCash = 0, outQRIS = 0;

                // Hitung Penjualan
                sales.forEach(s => {
                    if (s.status === 'hutang') {
                        piutang += Number(s.total || 0);
                    } else {
                        if (s.paymentMethod === 'cash') inCash += Number(s.total || 0);
                        else if (s.paymentMethod === 'qris') inQRIS += Number(s.total || 0);
                    }
                });

                // Hitung Pengeluaran
                expenses.forEach(e => {
                    outCash += Number(e.cashPart || 0);
                    outQRIS += Number(e.qrisPart || 0);
                });

                summary.value = {
                    cashMasuk: inCash, qrisMasuk: inQRIS,
                    cashKeluar: outCash, qrisKeluar: outQRIS,
                    saldoCash: inCash - outCash,
                    saldoQRIS: inQRIS - outQRIS,
                    totalPiutang: piutang
                };
            } finally {
                isLoading.value = false;
            }
        };

        const lihatDetailPiutang = () => {
            const root = Vue.getCurrentInstance().proxy.$root;
            if (root && root.selectPage) root.selectPage('Piutang Penjualan');
        };

        const formatR = (v) => "Rp " + (v || 0).toLocaleString('id-ID');
        Vue.onMounted(hitungArusKas);

        return { summary, isLoading, formatR, lihatDetailPiutang, hitungArusKas };
    },
    template: `
    <div class="w-full flex flex-col gap-4 py-2 animate-zoom-in no-scrollbar px-1 pb-24">
        <div class="flex justify-between items-center px-2">
            <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Arus Kas & Piutang</h3>
            <button @click="hitungArusKas" class="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border-none active:rotate-180 transition-all">
                <i class="ri-refresh-line"></i>
            </button>
        </div>

        <div class="grid grid-cols-1 gap-4">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Uang Tunai (Cash)</span>
                    <div :class="summary.saldoCash < 0 ? 'text-red-600' : 'text-gray-800'" class="text-2xl font-black">{{ formatR(summary.saldoCash) }}</div>
                </div>
                <div class="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl"><i class="ri-money-dollar-circle-line"></i></div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Saldo Bank (QRIS)</span>
                    <div :class="summary.saldoQRIS < 0 ? 'text-red-600' : 'text-gray-800'" class="text-2xl font-black">{{ formatR(summary.saldoQRIS) }}</div>
                </div>
                <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl"><i class="ri-qr-code-line"></i></div>
            </div>

            <div @click="lihatDetailPiutang" class="bg-orange-500 p-6 rounded-2xl shadow-lg shadow-orange-100 flex justify-between items-center text-white active:scale-95 transition-all cursor-pointer">
                <div>
                    <span class="text-[10px] font-black text-orange-100 uppercase tracking-widest block mb-1">Total Piutang</span>
                    <div class="text-2xl font-black">{{ formatR(summary.totalPiutang) }}</div>
                </div>
                <i class="ri-arrow-right-s-line text-2xl text-orange-200"></i>
            </div>
        </div>
    </div>
    `
};
