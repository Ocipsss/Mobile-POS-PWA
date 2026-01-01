// components/pages/Dashboard.js //
const PageDashboard = {
    setup() {
        const stats = Vue.ref({ omzet: 0, stokKritis: 0, totalPiutang: 0 });
        const topMembers = Vue.ref([]); // State untuk menampung member loyal

        const loadStats = async () => {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Hitung Omzet Hari Ini
            const trans = await db.transactions.toArray();
            const todayTrans = trans.filter(t => t.date.startsWith(today));
            const omzet = todayTrans.reduce((sum, t) => sum + t.total, 0);

            // 2. Hitung Stok Kritis (<= 5)
            const products = await db.products.toArray();
            const kritis = products.filter(p => p.qty <= 5).length;

            // 3. Hitung Total Piutang Belum Lunas
            const piutang = trans.filter(t => t.status === 'hutang')
                                 .reduce((sum, t) => sum + t.total, 0);

            stats.value = { omzet, stokKritis: kritis, totalPiutang: piutang };

            // 4. Ambil Top 10 Member berdasarkan Poin
            const members = await db.members.toArray();
            topMembers.value = members
                .sort((a, b) => (b.points || 0) - (a.points || 0))
                .slice(0, 10);
        };

        const formatRupiah = (val) => {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
        };

        Vue.onMounted(loadStats);

        return { stats, topMembers, formatRupiah };
    },
    template: `
    <div class="p-4 flex flex-col gap-4 pb-24">
        <div class="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-100">
            <span class="text-[10px] font-black uppercase tracking-widest opacity-70">Omzet Hari Ini</span>
            <h2 class="text-3xl font-black mt-1">Rp {{ stats.omzet.toLocaleString('id-ID') }}</h2>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                <div class="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-3">
                    <i class="ri-error-warning-line text-xl"></i>
                </div>
                <div class="text-[20px] font-black text-gray-800">{{ stats.stokKritis }}</div>
                <div class="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Produk Kritis</div>
            </div>

            <div class="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                <div class="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-3">
                    <i class="ri-hand-coin-line text-xl"></i>
                </div>
                <div class="text-[14px] font-black text-gray-800">Rp {{ stats.totalPiutang.toLocaleString('id-ID') }}</div>
                <div class="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total Piutang</div>
            </div>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div class="flex items-center justify-between mb-4 px-1">
                <div class="text-[11px] font-black uppercase tracking-widest text-gray-800">Top 10 Member Loyal</div>
                <i class="ri-medal-2-fill text-blue-600 text-xl"></i>
            </div>
            
            <div class="flex flex-col gap-3">
                <div v-for="(m, index) in topMembers" :key="m.id" 
                     class="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="text-[10px] font-black text-gray-300 w-4">#{{ index + 1 }}</span>
                        <div class="min-w-0">
                            <div class="text-[11px] font-black text-gray-800 uppercase truncate">{{ m.name }}</div>
                            <div class="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">ID: {{ m.id }}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[11px] font-black text-blue-600">{{ m.points || 0 }} PTS</div>
                        <div class="text-[8px] font-bold text-gray-400">{{ formatRupiah(m.total_spending || 0) }}</div>
                    </div>
                </div>

                <div v-if="topMembers.length === 0" class="text-center py-4 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                    Belum ada data member
                </div>
            </div>
        </div>

        <div class="bg-gray-900 p-6 rounded-[2rem] text-white flex items-center justify-between">
            <div>
                <div class="text-[11px] font-black uppercase tracking-widest opacity-60">Status Database</div>
                <div class="text-[10px] font-bold text-green-400 uppercase mt-1">Sistem Terhubung & Aman</div>
            </div>
            <i class="ri-shield-check-fill text-3xl text-green-400"></i>
        </div>
    </div>
    `
};
