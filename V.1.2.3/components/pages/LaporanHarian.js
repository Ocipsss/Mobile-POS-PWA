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
            const startStr = now.toISOString().split('T')[0] + "T00:00:00.000Z";
            const endStr = now.toISOString().split('T')[0] + "T23:59:59.999Z";

            try {
                let todayTrans = [];
                if (typeof fdb !== 'undefined') {
                    const snapshot = await fdb.ref('transactions')
                        .orderByChild('date')
                        .startAt(startStr)
                        .endAt(endStr)
                        .once('value');
                    const data = snapshot.val();
                    if (data) todayTrans = Object.values(data);
                } else {
                    const allTrans = await db.transactions.toArray();
                    todayTrans = allTrans.filter(t => t.date >= startStr && t.date <= endStr);
                }
                
                let omzet = 0, laba = 0, cash = 0, qris = 0, tempo = 0;
                todayTrans.forEach(t => {
                    omzet += Number(t.total || 0);
                    if (t.items) {
                        t.items.forEach(item => {
                            const modal = Number(item.price_modal || item.price_sell || 0);
                            laba += (Number(item.price_sell) - modal) * Number(item.qty);
                        });
                    }
                    if (t.paymentMethod === 'cash') cash += Number(t.total);
                    else if (t.paymentMethod === 'qris') qris += Number(t.total);
                    else if (t.paymentMethod === 'tempo') tempo += Number(t.total);
                });

                summary.value = { 
                    totalOmzet: omzet, 
                    totalLaba: laba, 
                    count: todayTrans.length,
                    cash, qris, tempo 
                };
                transactions.value = todayTrans.sort((a, b) => new Date(b.date) - new Date(a.date));

            } catch (err) {
                console.error("Gagal load laporan harian:", err);
            } finally {
                setTimeout(() => { isLoading.value = false; }, 300);
            }
        };

        const formatR = (val) => "Rp " + (val || 0).toLocaleString('id-ID');
        Vue.onMounted(loadLaporan);

        return { summary, transactions, formatR, isLoading, loadLaporan };
    },
    template: `
    <div class="w-full flex flex-col gap-4 py-2 animate-zoom-in no-scrollbar px-1 pb-24">
        
        <div class="flex justify-between items-end px-2 mt-2">
            <div>
                <span class="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em]">Reporting</span>
                <h3 class="text-xl font-black text-gray-800 uppercase tracking-tighter m-0">Laporan Harian</h3>
            </div>
            <button @click="loadLaporan" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                <i :class="isLoading ? 'animate-spin ri-refresh-line' : 'ri-refresh-line'" class="text-lg"></i>
            </button>
        </div>

        <div class="w-full bg-blue-600 p-7 rounded-[1rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
            <div class="relative z-10">
                <span class="text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Estimasi Laba Hari Ini</span>
                <h2 class="text-3xl font-black mt-2 tracking-tighter">{{ formatR(summary.totalLaba) }}</h2>
                <div class="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/20">
                    <span class="text-[8px] font-black uppercase opacity-70">Omzet:</span>
                    <span class="text-[10px] font-bold">{{ formatR(summary.totalOmzet) }}</span>
                </div>
            </div>
            <i class="ri-pie-chart-2-line absolute -right-6 -bottom-6 text-[110px] text-white/10 rotate-12 pointer-events-none"></i>
        </div>

        <div class="flex flex-row flex-nowrap gap-3 w-full px-1">
            <div class="flex-1 bg-white p-4 rounded-[0.5rem] shadow-lg shadow-blue-50/50 flex flex-col items-center justify-center text-center border border-gray-50">
                <span class="text-[7px] font-black text-gray-400 uppercase mb-1 tracking-widest whitespace-nowrap">Tunai</span>
                <span class="text-[11px] font-black text-gray-800 leading-none truncate w-full">{{ summary.cash.toLocaleString() }}</span>
            </div>

            <div class="flex-1 bg-white p-4 rounded-[0.5rem] shadow-lg shadow-blue-50/50 flex flex-col items-center justify-center text-center border border-gray-50">
                <span class="text-[7px] font-black text-gray-400 uppercase mb-1 tracking-widest whitespace-nowrap">QRIS</span>
                <span class="text-[11px] font-black text-blue-600 leading-none truncate w-full">{{ summary.qris.toLocaleString() }}</span>
            </div>

            <div class="flex-1 bg-white p-4 rounded-[0.5rem] shadow-lg shadow-blue-50/50 flex flex-col items-center justify-center text-center border border-gray-50">
                <span class="text-[7px] font-black text-gray-400 uppercase mb-1 tracking-widest whitespace-nowrap">Tempo</span>
                <span class="text-[11px] font-black text-red-500 leading-none truncate w-full">{{ summary.tempo.toLocaleString() }}</span>
            </div>
        </div>

        <div class="w-full bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-4 px-1">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <i class="ri-history-line text-blue-600"></i> Riwayat Logs ({{ summary.count }})
                </h4>
            </div>
            
            <div class="flex flex-col gap-2">
                <div v-for="t in transactions" :key="t.id" 
                     class="flex items-center justify-between p-3 px-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all active:scale-95">
                    <div class="flex items-center gap-3 min-w-0">
                        <div :class="t.paymentMethod === 'tempo' ? 'text-red-500' : 'text-blue-500'" class="w-4">
                            <i :class="t.paymentMethod === 'cash' ? 'ri-money-dollar-circle-fill' : (t.paymentMethod === 'qris' ? 'ri-qr-code-fill' : 'ri-hand-coin-fill')"></i>
                        </div>
                        <div class="truncate">
                            <div class="text-[10px] font-black text-gray-800 uppercase leading-none mb-1">Nota #{{ t.id.toString().slice(-5) }}</div>
                            <div class="text-[7px] font-bold text-gray-400 uppercase">{{ new Date(t.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }} • {{ t.paymentMethod }}</div>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <div class="text-[11px] font-black text-gray-900 leading-none mb-1">{{ formatR(t.total) }}</div>
                        <div :class="t.status === 'lunas' ? 'text-green-500' : 'text-red-500'" class="text-[7px] font-black uppercase">{{ t.status }}</div>
                    </div>
                </div>

                <div v-if="transactions.length === 0 && !isLoading" class="py-10 text-center flex flex-col items-center opacity-20">
                    <i class="ri-inbox-line text-4xl mb-2"></i>
                    <p class="text-[9px] font-black uppercase">Belum ada transaksi</p>
                </div>
            </div>
        </div>

        <div class="mx-1 bg-gray-900 p-6 rounded-[2rem] text-white flex items-center justify-between relative overflow-hidden mt-2">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-10 h-10 bg-white/10 border border-white/20 text-white rounded-xl flex items-center justify-center">
                    <i class="ri-shield-check-fill text-xl text-blue-400"></i>
                </div>
                <div>
                    <div class="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Laporan Valid</div>
                    <div class="text-[7px] font-bold text-green-400 uppercase tracking-tighter flex items-center gap-1">
                        <span class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                        Data Terverifikasi
                    </div>
                </div>
            </div>
            <i class="ri-file-list-3-line absolute -right-2 -bottom-2 text-6xl text-white/5 -rotate-12"></i>
        </div>

    </div>
    `
};
