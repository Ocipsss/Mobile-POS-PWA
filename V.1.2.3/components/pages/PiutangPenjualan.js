// components/pages/PiutangPenjualan.js //
const PagePiutangPenjualan = {
    setup() {
        const piutangList = Vue.ref([]);

        const loadPiutang = async () => {
            // Ambil semua transaksi yang statusnya hutang
            const allTransactions = await db.transactions.toArray();
            const members = await db.members.toArray();
            
            // Gabungkan data transaksi dengan nama member agar lebih informatif
            piutangList.value = allTransactions
                .filter(t => t.status === 'hutang')
                .map(t => {
                    const member = members.find(m => m.id === t.memberId);
                    return {
                        ...t,
                        memberName: member ? member.name : 'Umum/Tanpa Nama'
                    };
                }).reverse();
        };

        const tandaiLunas = async (id) => {
            if (confirm("Tandai transaksi ini sebagai LUNAS?")) {
                await db.transactions.update(id, { status: 'lunas' });
                alert("Status diperbarui menjadi Lunas");
                loadPiutang();
            }
        };

        const formatRupiah = (val) => "Rp " + val.toLocaleString('id-ID');

        Vue.onMounted(loadPiutang);

        return { piutangList, formatRupiah, tandaiLunas };
    },
    template: `
    <div class="p-4 flex flex-col gap-4">
        <div class="px-1">
            <h3 class="text-lg font-black text-gray-800 uppercase tracking-tight">Piutang Penjualan</h3>
            <p class="text-[10px] text-gray-400 font-bold uppercase">Daftar transaksi tempo yang belum lunas</p>
        </div>

        <div class="grid gap-3">
            <div v-for="p in piutangList" :key="p.id" class="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                            <i class="ri-hand-coin-line text-xl"></i>
                        </div>
                        <div>
                            <div class="text-[12px] font-black text-gray-800 uppercase leading-tight">{{ p.memberName }}</div>
                            <div class="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                Transaksi #{{ p.id }} • {{ new Date(p.date).toLocaleDateString('id-ID') }}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-black text-red-600">{{ formatRupiah(p.total) }}</div>
                        <div class="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase inline-block">Belum Lunas</div>
                    </div>
                </div>

                <button @click="tandaiLunas(p.id)" class="w-full py-3 bg-gray-900 text-white rounded-xl border-none font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md">
                    TANDAI SUDAH LUNAS
                </button>
            </div>

            <div v-if="piutangList.length === 0" class="py-20 text-center opacity-30 flex flex-col items-center">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <i class="ri-checkbox-circle-line text-4xl text-gray-400"></i>
                </div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em]">Semua Piutang Lunas</p>
            </div>
        </div>
    </div>
    `
};
