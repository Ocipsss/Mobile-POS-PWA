// components/pages/Penjualan.js
// v2.7 - Optimized Layout & Precise Service Alignment

const PagePenjualan = {
    props: ['cart', 'selectedMember', 'payMethod', 'cashAmount'],
    emits: ['update:payMethod', 'update:cashAmount', 'checkout'],
    setup(props) {
        const formatRupiah = (val) => {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
        };

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

        const updateJasaQty = (item, n) => {
            item.extraChargeQty = Math.max(0, (item.extraChargeQty || 0) + n);
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
    <div class="flex flex-col h-full relative overflow-hidden bg-white px-2">
        
        <div ref="scrollContainer" 
             :class="payMethod && payMethod !== 'null' ? 'pb-[340px]' : 'pb-[150px]'"
             class="flex-1 overflow-y-auto no-scrollbar transition-all duration-300 ease-in-out px-1">
            
            <div v-if="cart.length > 0 && $root.listJasaDB.length > 0" class="mt-4 mb-4 flex justify-center animate-slide-up">
                <div class="w-full bg-blue-50 p-3 rounded-[1rem] border border-blue-100 shadow-sm flex items-center justify-center transition-all active:scale-95">
                    <div class="flex items-center gap-2 pointer-events-none">
                        <i class="ri-customer-service-2-line text-blue-600 text-sm"></i>
                    </div>
                    <select 
                        @change="handleSelectJasa($event, $root.listJasaDB, $root.tambahJasa)"
                        class="bg-transparent border-none text-[11px] font-black uppercase text-blue-700 outline-none appearance-none cursor-pointer px-1 m-0 leading-none">
                        <option value="" disabled selected>+ TAMBAH JASA / LAYANAN</option>
                        <option v-for="j in $root.listJasaDB" :key="j.id" :value="j.id" class="text-gray-800 font-bold uppercase">
                            {{ j.name }} (+{{ formatRupiah(j.price).replace('Rp', '').trim() }})
                        </option>
                    </select>
                </div>
            </div>

            <div v-if="cart.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-300">
                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <i class="ri-shopping-basket-line text-3xl opacity-20"></i>
                </div>
                <p class="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Keranjang Kosong</p>
            </div>

            <div v-else class="flex flex-col gap-3">
                <div v-for="item in cart" :key="item.id" 
                    class="bg-white p-4 rounded-[1rem] flex flex-col gap-4 animate-slide-up border border-gray-100 shadow-sm">
                    
                    <div class="flex justify-between items-center">
                        <div class="min-w-0 flex-1">
                            <div class="text-[13px] font-black text-gray-800 uppercase leading-none mb-1 truncate">{{ item.name }}</div>
                            <div class="text-[10px] font-bold text-gray-400">
                                {{ formatRupiah(item.price_sell) }} <span class="mx-1 opacity-30">×</span> {{ item.qty }}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
                            <button @click="updateQty(item.id, -1)" 
                                class="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 font-black border-none bg-white shadow-sm active:scale-90 transition-all">-</button>
                            <span class="text-[12px] font-black text-gray-700 min-w-[24px] text-center">{{ item.qty }}</span>
                            <button @click="updateQty(item.id, 1)" 
                                class="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 font-black border-none bg-white shadow-sm active:scale-90 transition-all">+</button>
                        </div>
                    </div>

                    <div v-if="item.extraCharge > 0" 
                        class="flex justify-between items-center bg-blue-50/50 p-3 rounded-[1rem] border border-blue-100/50 animate-slide-up">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-100">
                                <i class="ri-fire-fill text-sm"></i>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-blue-800 uppercase leading-none mb-0.5">{{ item.extraChargeName || 'JASA' }}</span>
                                <span class="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">{{ formatRupiah(item.extraCharge) }} × {{ item.extraChargeQty }}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 bg-white rounded-xl p-1 border border-blue-100 shadow-sm">
                            <button @click="updateJasaQty(item, -1)" 
                                class="w-7 h-7 flex items-center justify-center text-orange-500 font-black border-none bg-transparent active:scale-75">-</button>
                            <span class="text-[11px] font-black text-gray-700 min-w-[18px] text-center">{{ item.extraChargeQty }}</span>
                            <button @click="updateJasaQty(item, 1)" 
                                class="w-7 h-7 flex items-center justify-center text-blue-600 font-black border-none bg-transparent active:scale-75">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 shadow-[0_-15px_30px_rgba(0,0,0,0.08)]">
            
            <div v-if="payMethod === 'cash'" class="mb-4 animate-slide-up">
                <div class="bg-gray-900 p-5 rounded-[1rem] shadow-2xl">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="flex-1">
                            <label class="text-[9px] text-gray-500 font-black uppercase block mb-1 tracking-widest">Input Tunai</label>
                            <div class="flex items-baseline gap-1">
                                <span class="text-blue-500 text-sm font-black">Rp</span>
                                <input type="number" inputmode="numeric" :value="cashAmount" 
                                    @input="$emit('update:cashAmount', $event.target.value)"
                                    class="w-full bg-transparent border-none text-white text-3xl font-black outline-none p-0 m-0"
                                    placeholder="0">
                            </div>
                        </div>
                        <div class="text-right border-l border-white/10 pl-4">
                            <div class="text-[9px] text-gray-500 font-black uppercase mb-1 tracking-widest">Kembali</div>
                            <div :class="kembalian > 0 ? 'text-green-400' : 'text-white'" class="text-lg font-black italic">
                                {{ formatRupiah(kembalian).replace('Rp', '').trim() }}
                            </div>
                        </div>
                    </div>
                    <button @click="(!cashAmount || cashAmount == 0) ? $emit('update:cashAmount', totalBelanja) : $emit('checkout')"
                        class="w-full border-none py-4 rounded-[1rem] bg-blue-600 text-white font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-900/20">
                        {{ (!cashAmount || cashAmount == 0) ? 'UANG PAS' : (Number(cashAmount) < totalBelanja ? 'UANG KURANG' : 'SELESAIKAN TRANSAKSI') }}
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-3">
                <div class="flex items-end justify-between px-2">
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Tagihan</span>
                    <span class="text-2xl font-black text-gray-900 tracking-tighter">{{ formatRupiah(totalBelanja) }}</span>
                </div>
                
                <div class="flex gap-2 bg-gray-100 p-1.5 rounded-[1rem] border border-gray-200 shadow-inner">
                    <button v-for="m in ['cash', 'qris', 'tempo']" 
                        @click="$emit('update:payMethod', payMethod === m ? 'null' : m)"
                        :class="payMethod === m ? 'bg-white text-gray-900 shadow-sm border-gray-300' : 'text-gray-400 border-transparent'"
                        class="flex-1 py-3 rounded-[0.8rem] border text-[10px] font-black uppercase transition-all tracking-widest">
                        {{ m }}
                    </button>
                </div>

                <div v-if="payMethod === 'qris' || payMethod === 'tempo'" class="mt-1">
                    <button @click="$emit('checkout')"
                        class="w-full border-none py-4 rounded-[1rem] bg-gray-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                        PROSES {{ payMethod.toUpperCase() }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
};
