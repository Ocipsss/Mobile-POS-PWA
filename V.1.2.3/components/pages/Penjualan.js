// components/pages/Penjualan.js
// v2.8 - Sticky Header & Slim List Item (Aligned with Stock Monitor Style)

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
    <div class="flex flex-col h-full relative overflow-hidden bg-slate-50">
        
        <div class="absolute top-2 right-4 z-[100] flex justify-end items-center pointer-events-none">
    <div class="relative flex items-center bg-white border border-blue-200 rounded-full px-2.5 py-1.5 shadow-md active:scale-95 transition-all pointer-events-auto">
        <i class="ri-customer-service-2-line text-blue-600 text-[10px]"></i>
        <select 
            @change="handleSelectJasa($event, $root.listJasaDB, $root.tambahJasa)"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
            <option value="" disabled selected>Pilih Jasa</option>
            <option v-for="j in $root.listJasaDB" :key="j.id" :value="j.id">
                {{ j.name }} (+{{ formatRupiah(j.price).replace('Rp', '').trim() }})
            </option>
        </select>
        <span class="text-[8px] font-black uppercase text-blue-700 ml-1 tracking-tighter">+ JASA</span>
    </div>
</div>

       <div ref="scrollContainer" 
     class="flex-1 flex flex-col min-h-0 bg-white mx-4 mt-2 rounded-t-2xl border-x border-t border-slate-100 shadow-sm relative overflow-hidden">

    <div :class="cart.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'" 
         class="flex-1 no-scrollbar px-4 pt-2 pb-6">
        
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                <i class="ri-shopping-basket-line text-2xl opacity-20"></i>
            </div>
            <p class="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Keranjang Kosong</p>
        </div>

        <div v-else class="flex flex-col gap-2">
            <div v-for="item in cart" :key="item.id" 
                class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col gap-2 animate-slide-up">
                
                <div class="flex items-center justify-between">
                    <div class="min-w-0 flex-1">
                        <div class="text-[11px] font-black text-slate-700 uppercase leading-tight truncate">{{ item.name }}</div>
                        <div class="text-[9px] font-bold text-slate-400 mt-0.5">
                            {{ formatRupiah(item.price_sell) }} <span class="mx-1 opacity-30">×</span> {{ item.qty }}
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                        <button @click="updateQty(item.id, -1)" class="w-7 h-7 flex items-center justify-center rounded-md text-red-500 font-black active:scale-75 transition-all">-</button>
                        <span class="text-[11px] font-black text-slate-700 min-w-[20px] text-center">{{ item.qty }}</span>
                        <button @click="updateQty(item.id, 1)" class="w-7 h-7 flex items-center justify-center rounded-md text-blue-600 font-black active:scale-75 transition-all">+</button>
                    </div>
                </div>

                <div v-if="item.extraCharge > 0" 
                    class="flex justify-between items-center bg-blue-100/30 p-2 rounded-lg border border-blue-100">
                    <div class="flex items-center gap-2">
                        <i class="ri-fire-fill text-blue-500 text-xs"></i>
                        <div class="flex flex-col">
                            <span class="text-[8px] font-black text-blue-800 uppercase tracking-tighter">{{ item.extraChargeName || 'JASA' }}</span>
                            <span class="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">{{ formatRupiah(item.extraCharge) }} × {{ item.extraChargeQty }}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button @click="updateJasaQty(item, -1)" class="w-6 h-6 flex items-center justify-center text-orange-500 font-black bg-white border border-blue-100 rounded-md">-</button>
                        <span class="text-[10px] font-black text-slate-700 min-w-[15px] text-center">{{ item.extraChargeQty }}</span>
                        <button @click="updateJasaQty(item, 1)" class="w-6 h-6 flex items-center justify-center text-blue-600 font-black bg-white border border-blue-100 rounded-md">+</button>
                    </div>
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
