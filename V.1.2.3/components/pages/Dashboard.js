// components/pages/Dashboard.js //
const PageDashboard = {
    setup() {
        const stats = Vue.ref({ 
            omzet: 0, 
            stokKritis: 0, 
            totalPiutang: 0,
            labaHariIni: 0,
            nilaiStok: 0,
            pengeluaranHariIni: 0
        });
        const topMembers = Vue.ref([]);

        const loadStats = async () => {
            const today = new Date().toISOString().split('T')[0];
            const trans = await db.transactions.toArray();
            const todayTrans = trans.filter(t => t.date.startsWith(today));
            
            let omzet = 0;
            let labaKotor = 0;
            todayTrans.forEach(t => {
                omzet += Number(t.total || 0);
                if (t.items) {
                    t.items.forEach(item => {
                        const qty = Number(item.qty || 0);
                        const modal = Number(item.price_modal || 0);
                        const jual = Number(item.price_sell || 0);
                        labaKotor += (jual - modal) * qty;
                    });
                }
            });

            const expenses = await db.expenses.toArray();
            const todayExpenses = expenses.filter(e => e.date.startsWith(today))
                                          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const products = await db.products.toArray();
            const kritis = products.filter(p => p.qty <= 5).length;
            const totalNilaiAset = products.reduce((sum, p) => sum + (Number(p.price_modal || 0) * Number(p.qty || 0)), 0);

            const piutang = trans.filter(t => t.status === 'hutang')
                                 .reduce((sum, t) => sum + Number(t.total || 0), 0);

            stats.value = { 
                omzet, 
                stokKritis: kritis, 
                totalPiutang: piutang,
                labaHariIni: labaKotor - todayExpenses,
                nilaiStok: totalNilaiAset,
                pengeluaranHariIni: todayExpenses
            };

            const members = await db.members.toArray();
            topMembers.value = members
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .slice(0, 10);
        };

        const formatR = (val) => "Rp " + (val || 0).toLocaleString('id-ID');
        Vue.onMounted(loadStats);

        return { stats, topMembers, formatR };
    },
    template: `
    <div class="w-full flex flex-col gap-4 py-2 animate-zoom-in no-scrollbar">
        
        <div class="w-full bg-gray-300 p-7 rounded-[1rem] text-gray-500 shadow-xl shadow-blue-100 relative overflow-hidden">
            <div class="relative z-10">
                <span class="text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Omzet Hari Ini</span>
                <h2 class="text-3xl font-black mt-2 tracking-tighter">{{ formatR(stats.omzet) }}</h2>
            </div>
            <i class="ri-funds-box-line absolute -right-6 -bottom-6 text-[110px] text-white/10 rotate-12 pointer-events-none"></i>
        </div>

        <div class="flex flex-row flex-nowrap gap-3 w-full px-1">
            <div class="flex-1 bg-white p-4 rounded-[0.5rem] text-blue-600 shadow-lg shadow-blue-50 flex flex-col items-center justify-center text-center border-t border-white/10">
                <span class="text-[7px] font-black uppercase opacity-70 mb-1 tracking-widest whitespace-nowrap">Laba Bersih</span>
                <span class="text-[12px] font-black text-green-500 leading-none truncate w-full">{{ formatR(stats.labaHariIni) }}</span>
            </div>

            <div class="flex-1 bg-white p-4 rounded-[0.5rem] text-blue-600 shadow-lg shadow-blue-50 flex flex-col items-center justify-center text-center border-t border-white/10">
                <span class="text-[7px] font-black uppercase opacity-70 mb-1 tracking-widest whitespace-nowrap">Biaya Keluar</span>
                <span class="text-[12px] font-black text-red-500 leading-none truncate w-full">-{{ formatR(stats.pengeluaranHariIni) }}</span>
            </div>
        </div>

        <div class="flex flex-row gap-3 px-1">
            <div class="flex-1 bg-white p-5 rounded-[1rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div class="w-9 h-9 bg-gray-50 text-gray-800 rounded-xl flex items-center justify-center mb-2">
                    <i class="ri-archive-line"></i>
                </div>
                <span class="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Aset Stok</span>
                <div class="text-[11px] font-black text-gray-900 leading-none">{{ formatR(stats.nilaiStok) }}</div>
            </div>

            <div class="flex-1 bg-white p-5 rounded-[1rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div class="w-9 h-9 bg-gray-50 text-orange-500 rounded-xl flex items-center justify-center mb-2">
                    <i class="ri-hand-coin-line"></i>
                </div>
                <span class="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Piutang</span>
                <div class="text-[11px] font-black text-gray-900 leading-none">{{ formatR(stats.totalPiutang) }}</div>
            </div>
        </div>

        <div v-if="stats.stokKritis > 0" 
            class="mx-1 bg-orange-500 p-5 rounded-[2rem] text-white flex items-center gap-4 shadow-lg shadow-orange-100">
            <i class="ri-error-warning-fill text-2xl animate-pulse"></i>
            <div>
                <div class="text-[10px] font-black uppercase tracking-widest">Peringatan Stok</div>
                <div class="text-[14px] font-black">{{ stats.stokKritis }} Produk Kritis</div>
            </div>
        </div>

        <div class="w-full bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-5 px-1">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-gray-800 flex items-center gap-2">
                    <i class="ri-medal-fill text-blue-600"></i> Top Member
                </h4>
            </div>
            
            <div class="flex flex-col gap-2">
                <div v-for="(m, index) in topMembers" :key="m.id" 
                     class="flex items-center justify-between p-3 px-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all active:scale-95">
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-black text-blue-500 w-4">#{{ index + 1 }}</span>
                        <span class="text-[11px] font-black text-gray-700 uppercase truncate">{{ m.name }}</span>
                    </div>
                    <div class="text-[11px] font-black text-gray-900">{{ (m.points || 0).toLocaleString() }} <span class="text-[7px] text-blue-500 uppercase">Pts</span></div>
                </div>
            </div>
        </div>

        <div class="mx-1 p-6 bg-gray-300 rounded-[1rem] text-white flex items-center justify-between relative overflow-hidden">
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-10 h-10 bg-white/10 border border-white/20 text-white rounded-xl flex items-center justify-center">
                    <i class="ri-shield-check-fill text-xl text-blue-400"></i>
                </div>
                <div>
                    <div class="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Secure Mode</div>
                    <div class="text-[7px] font-bold text-gray-600 uppercase tracking-tighter flex items-center gap-1">
                        <span class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                        Cloud Synced
                    </div>
                </div>
            </div>
            <span class="text-[8px] font-black px-3 py-1 bg-blue-600 rounded-full uppercase z-10">Live</span>
            <i class="ri-wifi-line absolute -right-2 -bottom-2 text-6xl text-white/5 -rotate-12"></i>
        </div>

    </div>
    `
};
