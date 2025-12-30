// components/pages/LaporanHarian.js //
const PageLaporanHarian = {
    setup() {
        const summary = Vue.ref({
            totalOmzet: 0,
            totalLaba: 0,
            count: 0,
            cash: 0,
            qris: 0,
            tempo: 0
        });
        const transactions = Vue.ref([]);

        const loadLaporan = async () => {
            const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
            const allTransactions = await db.transactions.toArray();
            
            // Filter transaksi hari ini
            const todayTrans = allTransactions.filter(t => t.date.startsWith(today));
            
            let omzet = 0;
            let laba = 0;
            let cash = 0;
            let qris = 0;
            let tempo = 0;

            todayTrans.forEach(t => {
                omzet += t.total;
                
                // Hitung laba (Harga Jual - Harga Modal per item)
                t.items.forEach(item => {
                    const modal = item.price_modal || 0;
                    laba += (item.price_sell - modal) * item.qty;
                });

                if (t.paymentMethod === 'cash') cash += t.total;
                else if (t.paymentMethod === 'qris') qris += t.total;
                else if (t.paymentMethod === 'tempo') tempo += t.total;
            });

            summary.value = { 
                totalOmzet: omzet, 
                totalLaba: laba, 
                count: todayTrans.length,
                cash, qris, tempo 
            };
            transactions.value = todayTrans.reverse(); // Terbaru di atas
        };

        const formatRupiah = (val) => "Rp " + val.toLocaleString('id-ID');

        Vue.onMounted(loadLaporan);

        return { summary, transactions, formatRupiah };
    },
    template: `
    <div class="p-4 flex flex-col gap-4 bg-gray-50 min-h-full">
        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div class="text-center mb-6">
                <span class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Estimasi Laba Hari Ini</span>
                <h2 class="text-3xl font-black text-gray-800 m-0">{{ formatRupiah(summary.totalLaba) }}</h2>
                <div class="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black mt-2 uppercase">
                    Omzet: {{ formatRupiah(summary.totalOmzet) }}
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
                <div class="bg-gray-50 p-3 rounded-2xl text-center">
                    <div class="text-[8px] font-black text-gray-400 uppercase mb-1">Tunai</div>
                    <div class="text-[10px] font-bold text-gray-700">{{ formatRupiah(summary.cash) }}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-2xl text-center">
                    <div class="text-[8px] font-black text-gray-400 uppercase mb-1">QRIS</div>
                    <div class="text-[10px] font-bold text-gray-700">{{ formatRupiah(summary.qris) }}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-2xl text-center">
                    <div class="text-[8px] font-black text-gray-400 uppercase mb-1">Tempo</div>
                    <div class="text-[10px] font-bold text-red-500">{{ formatRupiah(summary.tempo) }}</div>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-2">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Riwayat Hari Ini ({{ summary.count }})</h4>
            
            <div v-for="t in transactions" :key="t.id" class="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div class="flex items-center gap-3">
                    <div :class="t.paymentMethod === 'tempo' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'" 
                         class="w-10 h-10 rounded-xl flex items-center justify-center text-lg">
                        <i :class="t.paymentMethod === 'cash' ? 'ri-money-dollar-circle-line' : (t.paymentMethod === 'qris' ? 'ri-qr-code-line' : 'ri-hand-coin-line')"></i>
                    </div>
                    <div>
                        <div class="text-[11px] font-black text-gray-800 uppercase">#{{ t.id }} - {{ t.paymentMethod }}</div>
                        <div class="text-[9px] text-gray-400 font-bold">{{ new Date(t.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-black text-gray-800">{{ formatRupiah(t.total) }}</div>
                    <div class="text-[9px] font-bold" :class="t.status === 'lunas' ? 'text-green-500' : 'text-red-500'">{{ t.status.toUpperCase() }}</div>
                </div>
            </div>

            <div v-if="transactions.length === 0" class="py-10 text-center opacity-30">
                <i class="ri-inbox-line text-4xl"></i>
                <p class="text-[10px] font-black uppercase mt-2">Belum ada transaksi</p>
            </div>
        </div>
    </div>
    `
};
