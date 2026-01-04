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
                // 1. Ambil data Penjualan & Hitung Piutang
                const sales = await db.transactions.toArray();
                let inCash = 0;
                let inQRIS = 0;
                let piutang = 0;

                sales.forEach(s => {
                    if (s.status === 'hutang') {
                        piutang += Number(s.total);
                    } else {
                        if (s.paymentMethod === 'cash') inCash += Number(s.total);
                        else if (s.paymentMethod === 'qris') inQRIS += Number(s.total);
                    }
                });

                // 2. Ambil data Pengeluaran (Uang Keluar)
                const expenses = await db.expenses.toArray();
                let outCash = 0;
                let outQRIS = 0;

                expenses.forEach(e => {
                    outCash += Number(e.cashPart || 0);
                    outQRIS += Number(e.qrisPart || 0);
                });

                summary.value = {
                    cashMasuk: inCash,
                    qrisMasuk: inQRIS,
                    cashKeluar: outCash,
                    qrisKeluar: outQRIS,
                    saldoCash: inCash - outCash,
                    saldoQRIS: inQRIS - outQRIS,
                    totalPiutang: piutang
                };
            } finally {
                isLoading.value = false;
            }
        };

        // Fungsi untuk pindah ke halaman Piutang
        const lihatDetailPiutang = () => {
            // Menggunakan event bus atau memanggil fungsi selectPage dari root
            // Di app.js kita sudah punya selectPage, kita bisa akses via $root
            const root = Vue.getCurrentInstance().proxy.$root;
            if (root && root.selectPage) {
                root.selectPage('Piutang Penjualan');
            }
        };

        const formatR = (v) => "Rp " + (v || 0).toLocaleString('id-ID');

        Vue.onMounted(hitungArusKas);

        return { summary, isLoading, formatR, lihatDetailPiutang };
    },
    template: `
    <div class="p-4 flex flex-col gap-6 pb-24 animate-zoom-in">
        <div class="flex justify-between items-center px-2">
            <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Arus Kas & Piutang</h3>
            <button @click="hitungArusKas" class="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border-none active:rotate-180 transition-all">
                <i class="ri-refresh-line"></i>
            </button>
        </div>

        <div class="grid grid-cols-1 gap-4">
            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Uang di Laci (Cash)</span>
                    <div class="text-2xl font-black text-gray-800">{{ formatR(summary.saldoCash) }}</div>
                </div>
                <div class="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl">
                    <i class="ri-money-dollar-circle-line"></i>
                </div>
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Saldo Bank (QRIS)</span>
                    <div class="text-2xl font-black text-gray-800">{{ formatR(summary.saldoQRIS) }}</div>
                </div>
                <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
                    <i class="ri-qr-code-line"></i>
                </div>
            </div>

            <div @click="lihatDetailPiutang" class="bg-orange-500 p-6 rounded-[2.5rem] shadow-lg shadow-orange-100 flex justify-between items-center text-white active:scale-95 transition-all cursor-pointer">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-black text-orange-100 uppercase tracking-widest block">Piutang (Belum Bayar)</span>
                        <i class="ri-arrow-right-s-line text-orange-200"></i>
                    </div>
                    <div class="text-2xl font-black">{{ formatR(summary.totalPiutang) }}</div>
                </div>
                <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                    <i class="ri-hand-coin-line"></i>
                </div>
            </div>
        </div>

        <div class="bg-gray-900 p-8 rounded-[3rem] relative overflow-hidden">
            <div class="relative z-10">
                <span class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Total Aset Kas + Piutang</span>
                <div class="text-3xl font-black text-white mt-2">{{ formatR(summary.saldoCash + summary.saldoQRIS + summary.totalPiutang) }}</div>
                <p class="text-[9px] text-gray-400 mt-4 font-medium uppercase leading-relaxed">
                    Aset ini mencakup uang tunai, saldo digital, dan tagihan member yang belum tertagih secara keseluruhan.
                </p>
            </div>
            <i class="ri-bank-line absolute -right-6 -bottom-6 text-9xl text-white/5"></i>
        </div>
    </div>
    `
};
