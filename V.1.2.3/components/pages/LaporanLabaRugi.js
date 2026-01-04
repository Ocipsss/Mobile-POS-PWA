// components/pages/LaporanLabaRugi.js //

window.PageLabaRugi = {
    setup() {
        const stats = Vue.ref({ totalOmzet: 0, totalModal: 0, totalLabaBersih: 0, count: 0 });
        const isLoading = Vue.ref(false);
        const filter = Vue.ref({
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        });

        const loadData = async () => {
            isLoading.value = true;
            try {
                // Ambil data langsung dari Dexie (Lokal) agar pasti sinkron dengan input terakhir
                const start = filter.value.start;
                const end = filter.value.end + "T23:59:59";
                
                const allTrans = await db.transactions
                    .where('date')
                    .between(start, end, true, true)
                    .toArray();

                let omzet = 0;
                let modal = 0;
                allTrans.forEach(t => {
                    omzet += Number(t.total || 0);
                    (t.items || []).forEach(i => {
                        modal += (Number(i.price_modal || i.price_sell || 0) * Number(i.qty || 0));
                    });
                });

                const allExp = await db.expenses
                    .where('date')
                    .between(start, end, true, true)
                    .toArray();
                const totalExp = allExp.reduce((s, e) => s + Number(e.amount || 0), 0);

                stats.value = {
                    totalOmzet: omzet,
                    totalModal: modal + totalExp,
                    totalLabaBersih: omzet - (modal + totalExp),
                    count: allTrans.length
                };
            } catch (e) {
                console.error(e);
            } finally {
                isLoading.value = false;
            }
        };

        const formatR = (v) => "Rp " + (v || 0).toLocaleString('id-ID');
        Vue.onMounted(loadData);

        return { stats, filter, loadData, formatR, isLoading };
    },
    template: `
    <div class="p-4 flex flex-col gap-5 bg-white min-h-full">
        
        <div class="grid grid-cols-2 gap-2">
            <div class="bg-gray-100 p-2 rounded-xl">
                <label class="text-[8px] font-bold text-gray-500 uppercase block ml-1">Mulai</label>
                <input type="date" v-model="filter.start" @change="loadData" class="w-full bg-transparent border-none text-xs font-bold focus:ring-0">
            </div>
            <div class="bg-gray-100 p-2 rounded-xl">
                <label class="text-[8px] font-bold text-gray-500 uppercase block ml-1">Selesai</label>
                <input type="date" v-model="filter.end" @change="loadData" class="w-full bg-transparent border-none text-xs font-bold focus:ring-0">
            </div>
        </div>

        <div class="py-6 border-b border-gray-100 text-center">
            <span class="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2">Net Profit</span>
            <h2 class="text-4xl font-black text-gray-800 tracking-tighter">
                {{ formatR(stats.totalLabaBersih) }}
            </h2>
            <div class="inline-block mt-4 px-4 py-1 bg-gray-900 text-white text-[9px] font-bold rounded-full uppercase tracking-tighter">
                {{ stats.count }} Transaksi Sukses
            </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
            <div class="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div class="flex items-center gap-3">
                    <i class="ri-arrow-up-circle-fill text-green-500 text-2xl"></i>
                    <span class="text-[10px] font-bold text-gray-500 uppercase">Revenue / Omzet</span>
                </div>
                <span class="font-black text-gray-800">{{ formatR(stats.totalOmzet) }}</span>
            </div>

            <div class="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div class="flex items-center gap-3">
                    <i class="ri-arrow-down-circle-fill text-red-500 text-2xl"></i>
                    <span class="text-[10px] font-bold text-gray-500 uppercase">Total Modal & Biaya</span>
                </div>
                <span class="font-black text-gray-800">{{ formatR(stats.totalModal) }}</span>
            </div>
        </div>

        <div class="mt-auto pt-10 text-center opacity-30">
            <p class="text-[9px] font-bold uppercase tracking-widest">Sinar Pagi - Laporan Keuangan</p>
        </div>
    </div>
    `
};
