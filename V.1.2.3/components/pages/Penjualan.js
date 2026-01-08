// components/pages/Penjualan.js
// v2.6 - Flexible Service Quantity (Multi-item vs Single Service)

const PagePenjualan = {
    props: ['cart', 'selectedMember', 'payMethod', 'cashAmount'],
    emits: ['update:payMethod', 'update:cashAmount', 'checkout'],
    setup(props) {
        const formatRupiah = (val) => {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
        };

        // Total = (Harga Barang * Qty Barang) + (Harga Jasa * Qty Jasa)
        const totalBelanja = Vue.computed(() => {
            return props.cart.reduce((acc, item) => {
                const totalProduk = item.price_sell * item.qty;
                const totalJasa = (item.extraCharge || 0) * (item.extraChargeQty || 0);
                return acc + totalProduk + totalJasa;
            }, 0);
        });

        const kembalian = Vue.computed(() => {
            const bayar = Number(props.cashAmount) || 0;
            return Math.max(0, bayar - totalBelanja.value);
        });

        const updateQty = (id, n) => {
            const item = props.cart.find(i => i.id === id);
            if (item) {
                item.qty += n;
                if (item.qty <= 0) {
                    const index = props.cart.indexOf(item);
                    props.cart.splice(index, 1);
                }
            }
        };

        // Fungsi Baru: Update Quantity khusus Jasa
        const updateJasaQty = (item, n) => {
            item.extraChargeQty = Math.max(0, (item.extraChargeQty || 0) + n);
            // Jika Qty Jasa jadi 0, hapus tanda (Seduh) di nama
            if (item.extraChargeQty === 0) {
                item.extraCharge = 0;
                item.name = item.name.replace(" (Seduh)", "");
            }
        };

        const scrollContainer = Vue.ref(null);
        const scrollToBottom = () => {
            Vue.nextTick(() => {
                if (scrollContainer.value) {
                    scrollContainer.value.scrollTo({ 
                        top: scrollContainer.value.scrollHeight, 
                        behavior: 'smooth' 
                    });
                }
            });
        };

        const handleSelectJasa = (event, listJasa, tambahJasaFn) => {
            const selectedId = event.target.value;
            const selectedJasa = listJasa.find(j => j.id == selectedId);
            if (selectedJasa) tambahJasaFn(selectedJasa);
            event.target.value = "";
        };

        Vue.onMounted(scrollToBottom);
        Vue.watch(() => props.cart.length, (n, o) => { if (n > o) scrollToBottom(); });
        Vue.watch(() => props.cart, () => { scrollToBottom(); }, { deep: true });

        return { formatRupiah, totalBelanja, kembalian, updateQty, updateJasaQty, scrollContainer, handleSelectJasa };
    },
    
    template: `
    <div class="flex flex-col h-full relative overflow-hidden bg-white">
        
        <div ref="scrollContainer" 
             :class="payMethod && payMethod !== 'null' ? 'pb-[320px]' : 'pb-[100px]'"
             class="flex-1 overflow-y-auto px-3 no-scrollbar transition-all duration-300 ease-in-out">
            
            <div v-if="cart.length > 0 && $root.listJasaDB.length > 0" class="mt-3 mb-2 px-1 animate-slide-up">
                <div class="relative flex items-center gap-2 bg-blue-50 p-2 rounded-2xl border border-blue-100 shadow-sm">
                    <i class="ri-customer-service-2-line text-blue-600 ml-2"></i>
                    <select 
                        @change="handleSelectJasa($event, $root.listJasaDB, $root.tambahJasa)"
                        class="flex-1 bg-transparent border-none text-[11px] font-black uppercase text-blue-700 outline-none p-1 appearance-none cursor-pointer">
                        <option value="" disabled selected>+ TAMBAH JASA / LAYANAN</option>
                        <option v-for="j in $root.listJasaDB" :key="j.id" :value="j.id" class="text-gray-800 font-bold">
                            {{ j.name }} (+{{ formatRupiah(j.price).replace('Rp', '').trim() }})
                        </option>
                    </select>
                </div>
            </div>

            <div v-if="cart.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-300">
                <i class="ri-shopping-cart-2-line text-4xl mb-2 opacity-20"></i>
                <p class="text-[9px] font-black uppercase tracking-widest opacity-50">Keranjang Kosong</p>
            </div>

            <div v-else class="flex flex-col gap-2">
                <div v-for="item in cart" :key="item.id" 
                    class="bg-gray-50 p-3 rounded-[1.5rem] flex flex-col gap-3 animate-slide-up border border-gray-100 shadow-sm transition-all">
                    
                    <div class="flex justify-between items-center">
                        <div class="min-w-0 flex-1">
                            <div class="text-[12px] font-black text-gray-800 uppercase leading-tight truncate">{{ item.name }}</div>
                            <div class="text-[10px] font-bold text-gray-400">
                                {{ formatRupiah(item.price_sell) }} <span class="mx-1">×</span> {{ item.qty }}
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-white rounded-xl p-0.5 border border-gray-100 shadow-sm">
                            <button @click="updateQty(item.id, -1)" 
                                class="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 font-black border-none bg-transparent active:bg-red-50">-</button>
                            <span class="text-[11px] font-black text-gray-700 min-w-[20px] text-center">{{ item.qty }}</span>
                            <button @click="updateQty(item.id, 1)" 
                                class="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 font-black border-none bg-transparent active:bg-blue-50">+</button>
                        </div>
                    </div>

                    <div v-if="item.extraCharge > 0" 
                        class="flex justify-between items-center bg-blue-100/40 p-2 px-3 rounded-xl border border-blue-100/50 animate-slide-up">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 bg-blue-600 text-white rounded-md flex items-center justify-center">
                                <i class="ri-fire-fill text-[12px]"></i>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-700 uppercase leading-none">{{ item.extraChargeName || 'JASA' }}</span>
                                <span class="text-[8px] font-bold text-blue-500 uppercase">{{ formatRupiah(item.extraCharge) }} × {{ item.extraChargeQty }}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 bg-white/80 rounded-lg p-0.5 border border-blue-200">
                            <button @click="updateJasaQty(item, -1)" 
                                class="w-6 h-6 flex items-center justify-center text-orange-600 font-black border-none bg-transparent">-</button>
                            <span class="text-[10px] font-black text-gray-700 min-w-[15px] text-center">{{ item.extraChargeQty }}</span>
                            <button @click="updateJasaQty(item, 1)" 
                                class="w-6 h-6 flex items-center justify-center text-blue-600 font-black border-none bg-transparent">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            
            <div v-if="payMethod === 'cash'" class="mb-3 animate-slide-up">
                <div class="bg-blue-600 p-4 rounded-[1.5rem] shadow-xl shadow-blue-100 border border-blue-500">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="flex-1">
                            <label class="text-[8px] text-blue-200 font-black uppercase block mb-1 tracking-widest">Nominal Tunai</label>
                            <div class="flex items-baseline gap-1">
                                <span class="text-blue-200 text-xs font-bold">Rp</span>
                                <input type="number" inputmode="numeric" :value="cashAmount" 
                                    @input="$emit('update:cashAmount', $event.target.value)"
                                    class="w-full bg-transparent border-none text-white text-2xl font-black outline-none p-0 m-0"
                                    placeholder="0">
                            </div>
                        </div>
                        <div class="text-right border-l border-white/20 pl-3">
                            <div class="text-[8px] text-blue-200 font-black uppercase mb-1 tracking-widest">Kembali</div>
                            <div class="text-sm text-white font-black">{{ formatRupiah(kembalian).replace('Rp', '').trim() }}</div>
                        </div>
                    </div>
                    <button @click="(!cashAmount || cashAmount == 0) ? $emit('update:cashAmount', totalBelanja) : $emit('checkout')"
                        class="w-full border-none py-3 rounded-xl bg-white text-blue-600 font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">
                        {{ (!cashAmount || cashAmount == 0) ? 'UANG PAS' : (Number(cashAmount) < totalBelanja ? 'UANG KURANG' : 'PROSES SEKARANG') }}
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between px-1 mb-1">
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Belanja</span>
                    <span class="text-xl font-black text-gray-800">{{ formatRupiah(totalBelanja) }}</span>
                </div>
                
                <div class="flex gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
                    <button v-for="m in ['cash', 'qris', 'tempo']" 
                        @click="$emit('update:payMethod', payMethod === m ? 'null' : m)"
                        :class="payMethod === m ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'"
                        class="flex-1 py-2.5 rounded-xl border-none text-[10px] font-black uppercase transition-all">
                        {{ m }}
                    </button>
                </div>

                <div v-if="payMethod === 'qris' || payMethod === 'tempo'" class="mt-1">
                    <button @click="$emit('checkout')"
                        class="w-full border-none py-4 rounded-[1.5rem] bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest animate-slide-up shadow-xl active:scale-95 transition-all">
                        PROSES {{ payMethod.toUpperCase() }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
};
