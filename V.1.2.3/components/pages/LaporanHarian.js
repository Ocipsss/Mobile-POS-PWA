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
        const isLoading = Vue.ref(false);

        const loadLaporan = async () => {
            isLoading.value = true;
            const now = new Date();
            // Ambil rentang waktu hari ini (00:00:00 sampai 23:59:59)
            const startStr = now.toISOString().split('T')[0] + "T00:00:00.000Z";
            const endStr = now.toISOString().split('T')[0] + "T23:59:59.999Z";

            try {
                let todayTrans = [];

                if (typeof fdb !== 'undefined') {
                    // AMBIL DATA DARI CLOUD (FIREBASE)
                    const snapshot = await fdb.ref('transactions')
                        .orderByChild('date')
                        .startAt(startStr)
                        .endAt(endStr)
                        .once('value');
                    
                    const data = snapshot.val();
                    if (data) {
                        todayTrans = Object.values(data);
                    }
                } else {
                    // Fallback Lokal (Dexie)
                    const allTrans = await db.transactions.toArray();
                    todayTrans = allTrans.filter(t => t.date >= startStr && t.date <= endStr);
                }
                
                let omzet = 0;
                let laba = 0;
                let cash = 0;
                let qris = 0;
                let tempo = 0;

                todayTrans.forEach(t => {
                    omzet += (t.total || 0);
                    
                    // Hitung laba
                    if (t.items) {
                        t.items.forEach(item => {
                            const modal = item.price_modal || item.price_sell || 0;
                            laba += (item.price_sell - modal) * item.qty;
                        });
                    }

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
                
                // Urutkan berdasarkan waktu terbaru
                transactions.value = todayTrans.sort((a, b) => new Date(b.date) - new Date(a.date));

            } catch (err) {
                console.error("Gagal load laporan harian:", err);
            } finally {
                isLoading.value = false;
            }
        };

        const formatRupiah = (val) => "Rp " + (val || 0).toLocaleString('id-ID');

        Vue.onMounted(loadLaporan);

        return { summary, transactions, formatRupiah, isLoading, loadLaporan };
    },
    template: `
    <div class="p-4 flex flex-col gap-4 bg-gray-50 min-h-full pb-24">
        <div class="flex justify-between items-center px-2">
            <div>
                <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight m-0">Laporan Harian</h3>
                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{{ new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
            </div>
            <button @click="loadLaporan" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                <i :class="isLoading ? 'animate-spin ri-refresh-line' : 'ri-refresh-line'" class="text-xl"></i>
            </button>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
            <div class="text-center mb-6 relative z-10">
                <span class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Estimasi Laba Hari Ini</span>
                <h2 class="text-4xl font-black text-gray-800 m-0 tracking-tighter">{{ formatRupiah(summary.totalLaba) }}</h2>
                <div class="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black mt-3 uppercase tracking-tighter">
                    Omzet: {{ formatRupiah(summary.totalOmzet) }}
                </div>
            </div>

            <div class="grid grid-cols-3 gap-2 relative z-10">
                <div class="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
                    <div class="text-[8px] font-black text-gray-400 uppercase mb-1">Tunai</div>
                    <div class="text-[10px] font-bold text-gray-700">{{ formatRupiah(summary.cash).replace('Rp', '').trim() }}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
                    <div class="text-[8px] font-black text-gray-400 uppercase mb-1">QRIS</div>
                    <div class="text-[10px] font-bold text-blue-600">{{ formatRupiah(summary.qris).replace('Rp', '').trim() }}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
                    <div class="text-[8px] font-black text-gray-400 uppercase mb-1">Tempo</div>
                    <div class="text-[10px] font-bold text-red-500">{{ formatRupiah(summary.tempo).replace('Rp', '').trim() }}</div>
                </div>
            </div>
            <i class="ri-pie-chart-2-fill absolute -right-4 -bottom-4 text-8xl text-gray-50 opacity-50 z-0"></i>
        </div>

        <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center px-2">
                <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Riwayat Transaksi ({{ summary.count }})</h4>
                <div v-if="isLoading" class="text-[8px] font-black text-blue-500 animate-pulse uppercase">Syncing Cloud...</div>
            </div>
            
            <div v-for="t in transactions" :key="t.id" class="bg-white p-4 rounded-[1.5rem] flex items-center justify-between border border-gray-100 shadow-sm animate-slide-up">
                <div class="flex items-center gap-3">
                    <div :class="t.paymentMethod === 'tempo' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'" 
                         class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner">
                        <i :class="t.paymentMethod === 'cash' ? 'ri-money-dollar-circle-line' : (t.paymentMethod === 'qris' ? 'ri-qr-code-line' : 'ri-hand-coin-line')"></i>
                    </div>
                    <div>
                        <div class="text-[11px] font-black text-gray-800 uppercase leading-none mb-1">Nota #{{ t.id.toString().slice(-5) }}</div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-black uppercase">{{ t.paymentMethod }}</span>
                            <span class="text-[9px] text-gray-400 font-bold tracking-tighter">{{ new Date(t.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm font-black text-gray-800">{{ formatRupiah(t.total) }}</div>
                    <div class="text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm inline-block" 
                         :class="t.status === 'lunas' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
                         {{ t.status.toUpperCase() }}
                    </div>
                </div>
            </div>

            <div v-if="transactions.length === 0 && !isLoading" class="py-16 text-center opacity-30 flex flex-col items-center">
                <i class="ri-inbox-line text-5xl mb-2"></i>
                <p class="text-[10px] font-black uppercase tracking-tighter">Belum ada transaksi hari ini</p>
            </div>
        </div>
    </div>
    `
};
