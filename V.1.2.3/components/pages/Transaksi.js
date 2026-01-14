const PageTransaksi = {
    setup() {
        const transactions = Vue.ref([]);
        const isLoading = Vue.ref(false);
        const editingId = Vue.ref(null);

        const loadTransactions = async () => {
            isLoading.value = true;
            try {
                const data = await db.transactions.orderBy('date').reverse().limit(50).toArray();
                transactions.value = data;
            } catch (err) {
                console.error(err);
            } finally {
                setTimeout(() => { isLoading.value = false; }, 300);
            }
        };

        // Fungsi Cetak Ulang (Reprint)
        const reprint = (transaksi) => {
    if (!transaksi) return;
    
    // Hilangkan confirm agar lebih cepat, atau biarkan jika Anda suka
    console.log("Mengirim data ke printer Bluetooth...", transaksi);
    const dataBersih = JSON.parse(JSON.stringify(transaksi));
    
    // Kirim event yang akan ditangkap oleh StrukNota.js
    window.dispatchEvent(new CustomEvent('print-struk', { 
        detail: dataBersih 
    }));
};


        const updateStatus = async (id, newStatus) => {
            try {
                await db.transactions.update(id, { status: newStatus });
                await loadTransactions();
            } catch (err) { alert("Gagal update status"); }
        };

        const updatePayment = async (id, newMethod) => {
            try {
                await db.transactions.update(id, { paymentMethod: newMethod });
                await loadTransactions();
            } catch (err) { alert("Gagal update metode"); }
        };

        const hapusTransaksi = async (id) => {
            if (confirm("Hapus transaksi ini? Stok tidak akan kembali otomatis (manual).")) {
                await db.transactions.delete(id);
                loadTransactions();
            }
        };

        const formatR = (val) => "Rp " + (val || 0).toLocaleString('id-ID');
        
        Vue.onMounted(loadTransactions);

        return { 
            transactions, isLoading, editingId, 
            updateStatus, updatePayment, hapusTransaksi, 
            formatR, loadTransactions, reprint 
        };
    },
    template: `
    <div class="w-full flex flex-col gap-5 py-2 animate-zoom-in no-scrollbar px-1 pb-28">
        
        <div class="flex justify-between items-end px-3 mt-2">
            <div>
                <span class="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em]">Database</span>
                <h3 class="text-xl font-black text-gray-800 uppercase tracking-tighter m-0">Riwayat Penjualan</h3>
            </div>
            <button @click="loadTransactions" class="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-blue-600 active:scale-90">
                <i :class="isLoading ? 'animate-spin ri-refresh-line' : 'ri-refresh-line'" class="text-lg"></i>
            </button>
        </div>

        <div class="flex flex-col gap-3">
            <div v-for="t in transactions" :key="t.id" 
                 class="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden transition-all"
                 :class="editingId === t.id ? 'ring-2 ring-blue-500 shadow-lg' : ''">
                
                <div class="p-4 flex justify-between items-start">
                    <div class="flex gap-3">
                        <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-blue-600">
                            <i class="ri-receipt-line text-lg"></i>
                        </div>
                        <div>
                            <div class="text-[11px] font-black text-gray-800 uppercase leading-none mb-1">Nota #{{ t.id.toString().slice(-5) }}</div>
                            <div class="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                {{ new Date(t.date).toLocaleString('id-ID') }}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-[13px] font-black text-gray-900 mb-1">{{ formatR(t.total) }}</div>
                        <div class="flex gap-2 justify-end">
                            <button @click="reprint(t)" 
                                    class="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 active:scale-90">
                                <i class="ri-printer-line text-xs"></i>
                            </button>
                            <button @click="editingId = (editingId === t.id ? null : t.id)" 
                                    class="text-[8px] font-black px-2 py-1 rounded bg-gray-100 text-gray-500 uppercase">
                                    {{ editingId === t.id ? 'Tutup' : 'Edit' }}
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="editingId === t.id" class="px-4 pb-4 pt-2 border-t border-dashed border-gray-100 bg-gray-50/50 animate-slide-up">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[7px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status Nota</label>
                            <div class="flex gap-1">
                                <button @click="updateStatus(t.id, 'lunas')" 
                                    :class="t.status === 'lunas' ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border border-gray-100'"
                                    class="flex-1 py-2 rounded-lg text-[8px] font-black uppercase">LUNAS</button>
                                <button @click="updateStatus(t.id, 'hutang')" 
                                    :class="t.status === 'hutang' ? 'bg-red-500 text-white' : 'bg-white text-gray-400 border border-gray-100'"
                                    class="flex-1 py-2 rounded-lg text-[8px] font-black uppercase">HUTANG</button>
                            </div>
                        </div>
                        <div>
                            <label class="text-[7px] font-black text-gray-400 uppercase tracking-widest block mb-2">Metode</label>
                            <select @change="updatePayment(t.id, $event.target.value)" 
                                    class="w-full p-2 bg-white border border-gray-100 rounded-lg text-[8px] font-black uppercase outline-none">
                                <option :selected="t.paymentMethod === 'cash'" value="cash">CASH</option>
                                <option :selected="t.paymentMethod === 'qris'" value="qris">QRIS</option>
                                <option :selected="t.paymentMethod === 'tempo'" value="tempo">TEMPO</option>
                            </select>
                        </div>
                    </div>
                    <button @click="hapusTransaksi(t.id)" class="w-full mt-3 py-2 text-[8px] font-black text-red-500 uppercase border border-red-100 rounded-lg hover:bg-red-50 transition-all">
                        Hapus Transaksi Permanen
                    </button>
                </div>

                <div v-else class="px-4 py-2 bg-gray-50/50 flex gap-2 border-t border-gray-50">
                    <span :class="t.status === 'lunas' ? 'bg-green-500' : 'bg-red-500'" class="text-[7px] font-black px-1.5 py-0.5 rounded text-white uppercase tracking-tighter">{{ t.status }}</span>
                    <span class="text-[7px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded uppercase tracking-tighter">{{ t.paymentMethod }}</span>
                    <span class="text-[7px] font-bold text-gray-400 ml-auto">{{ t.items?.length || 0 }} Produk</span>
                </div>
            </div>

            <div v-if="transactions.length === 0" class="py-20 text-center opacity-20">
                <i class="ri-file-list-3-line text-5xl"></i>
                <p class="text-[10px] font-black uppercase mt-2">Data Kosong</p>
            </div>
        </div>

    </div>
    `
};
