// components/pages/LaporanLabaRugi.js //
// v2.7 - Integrated Service Profit Logic

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
                        // MODAL PRODUK: (Harga Modal * Qty Barang)
                        // Biaya Jasa (extraCharge) tidak dikurangi modal karena dianggap pendapatan jasa murni
                        const modalPerItem = Number(i.price_modal || i.price_sell || 0) * Number(i.qty || 0);
                        modal += modalPerItem;
                    });
                });

                const allExp = await db.expenses
                    .where('date')
                    .between(start, end, true, true)
                    .toArray();
                const totalExp = allExp.reduce((s, e) => s + Number(e.amount || 0), 0);

                // LABA BERSIH = Total Omzet - (Total Modal Produk + Biaya Pengeluaran)
                // Karena Total Omzet sudah termasuk biaya jasa, maka laba otomatis bertambah dari jasa tersebut.
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
            <div class="bg-gray-100 p-2 rounded-xl border border-gray-200 shadow-sm">
                <label class="text-[8px] font-black text-gray-500 uppercase block ml-1 tracking-widest">Mulai</label>
                <input type="date" v-model="filter.start" @change="loadData" class="w-full bg-transparent border-none text-xs font-bold focus:ring-0">
            </div>
            <div class="bg-gray-100 p-2 rounded-xl border border-gray-200 shadow-sm">
                <label class="text-[8px] font-black text-gray-500 uppercase block ml-1 tracking-widest">Selesai</label>
                <input type="date" v-model="filter.end" @change="loadData" class="w-full bg-transparent border-none text-xs font-bold focus:ring-0">
            </div>
        </div>

        <div class="py-8 border-b border-gray-100 text-center animate-pulse-slow">
            <span class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-2">Net Profit</span>
            <h2 class="text-4xl font-black text-gray-800 tracking-tighter">
                {{ formatR(stats.totalLabaBersih) }}
            </h2>
            <div class="inline-block mt-4 px-4 py-1.5 bg-gray-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                <i class="ri-check-double-line mr-1 text-green-400"></i> {{ stats.count }} Transaksi Sukses
            </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
            <div class="flex justify-between items-center p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <i class="ri-funds-box-line text-2xl"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Omzet</span>
                        <span class="text-[8px] font-bold text-green-600">Terdaftar dari Penjualan & Jasa</span>
                    </div>
                </div>
                <span class="font-black text-gray-800">{{ formatR(stats.totalOmzet) }}</span>
            </div>

            <div class="flex justify-between items-center p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                        <i class="ri-hand-coin-line text-2xl"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Modal & Biaya</span>
                        <span class="text-[8px] font-bold text-red-600">Harga Modal Barang + Pengeluaran</span>
                    </div>
                </div>
                <span class="font-black text-gray-800">{{ formatR(stats.totalModal) }}</span>
            </div>
        </div>

        <div class="mt-auto pt-10 text-center opacity-20">
            <p class="text-[8px] font-black uppercase tracking-[0.3em]">Sinar Pagi - Financial Report System</p>
        </div>
    </div>
    `
};
