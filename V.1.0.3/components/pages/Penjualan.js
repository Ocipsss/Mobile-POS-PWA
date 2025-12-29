/*
const PagePenjualan = {
    props: ['cart', 'selectedMember', 'payMethod', 'cashAmount'],
    emits: ['update:payMethod', 'update:cashAmount', 'checkout'],
    setup(props, { emit }) {
        const formatRupiah = (val) => {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
        };

        const totalBelanja = Vue.computed(() => {
            return props.cart.reduce((acc, item) => acc + (item.price_sell * item.qty), 0);
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

        const scrollContainer = Vue.ref(null);
        const scrollToBottom = () => {
            Vue.nextTick(() => {
                if (scrollContainer.value) {
                    scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight, behavior: 'smooth' });
                }
            });
        };

        Vue.watch(() => props.cart.length, (n, o) => { if (n > o) scrollToBottom(); });
        Vue.watch(() => props.cart, () => { scrollToBottom(); }, { deep: true });

        return { formatRupiah, totalBelanja, kembalian, updateQty, scrollContainer };
    },
    template: `
    <div class="flex flex-col h-full relative overflow-hidden bg-gray-50">
        
        <div ref="scrollContainer" 
             :class="payMethod ? 'pb-80' : 'pb-40'"
             class="flex-1 overflow-y-auto px-4 no-scrollbar transition-all duration-500">
            
            <div v-if="cart.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-400 py-20">
                <i class="ri-shopping-cart-2-line text-6xl mb-4 opacity-10"></i>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Keranjang Kosong</p>
            </div>

            <div v-else class="flex flex-col gap-3 mt-4">
                <div v-for="item in cart" :key="item.id" 
                    class="bg-white p-3 rounded-[1.5rem] border border-gray-100 flex items-center justify-between shadow-sm animate-slide-up">
                    <div class="flex gap-3 items-center min-w-0">
                        <div class="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                            <i class="ri-shopping-bag-3-fill text-2xl"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[13px] font-black text-gray-800 truncate uppercase tracking-tight">{{ item.name }}</div>
                            <div class="text-[11px] font-bold text-blue-600">{{ formatRupiah(item.price_sell) }}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <button @click="updateQty(item.id, -1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-red-600 font-black border-none bg-transparent">-</button>
                        <span class="text-[12px] font-black text-gray-700 w-4 text-center">{{ item.qty }}</span>
                        <button @click="updateQty(item.id, 1)" class="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-blue-600 font-black border-none bg-transparent">+</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl z-50">
            
            <div v-if="payMethod === 'cash'" class="mb-3 animate-slide-up">
                <div class="bg-blue-600 p-5 rounded-[2.5rem] shadow-2xl shadow-blue-300">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white text-3xl flex-shrink-0">
                            <i class="ri-money-dollar-circle-fill"></i>
                        </div>
                        <div class="flex-1">
                            <label class="text-[8px] text-blue-200 font-black uppercase tracking-widest block mb-1">Nominal Tunai</label>
                            <input type="number" inputmode="numeric" :value="cashAmount" 
                                @input="$emit('update:cashAmount', $event.target.value)"
                                class="w-full bg-transparent border-none text-white text-2xl font-black outline-none p-0 m-0 leading-none"
                                placeholder="0">
                        </div>
                        <div class="text-right border-l border-white/10 pl-4 min-w-[100px]">
                            <label class="text-[8px] text-blue-200 font-black uppercase tracking-widest block mb-1">Kembali</label>
                            <div class="text-sm text-white font-black truncate">
                                {{ formatRupiah(kembalian).replace('Rp', '').trim() }}
                            </div>
                        </div>
                    </div>

                    <button @click="(!cashAmount || cashAmount == 0) ? $emit('update:cashAmount', totalBelanja) : $emit('checkout')"
                        :disabled="cashAmount > 0 && Number(cashAmount) < totalBelanja"
                        class="w-full border-none py-4 rounded-2xl bg-white/20 text-white font-black uppercase text-[11px] tracking-widest transition-all">
                        {{ (!cashAmount || cashAmount == 0) ? 'BAYAR UANG PAS' : (Number(cashAmount) < totalBelanja ? 'UANG KURANG' : 'KONFIRMASI BAYAR') }}
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <div class="flex gap-2 p-1 bg-gray-100 rounded-[2rem] shadow-inner">
                    <button @click="$emit('update:payMethod', payMethod === 'cash' ? null : 'cash')"
                        :class="payMethod === 'cash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-transparent text-gray-400'"
                        class="flex-1 py-4 rounded-[1.8rem] border-none text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1">
                        <i class="ri-money-cny-box-line text-lg"></i>
                        <span>Cash</span>
                    </button>

                    <button @click="$emit('update:payMethod', payMethod === 'qris' ? null : 'qris')"
                        :class="payMethod === 'qris' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-transparent text-gray-400'"
                        class="flex-1 py-4 rounded-[1.8rem] border-none text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1">
                        <i class="ri-qr-code-line text-lg"></i>
                        <span>QRIS</span>
                    </button>

                    <button @click="$emit('update:payMethod', payMethod === 'tempo' ? null : 'tempo')"
                        :class="payMethod === 'tempo' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-transparent text-gray-400'"
                        class="flex-1 py-4 rounded-[1.8rem] border-none text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1">
                        <i class="ri-calendar-todo-line text-lg"></i>
                        <span>Tempo</span>
                    </button>
                </div>

                <template v-if="payMethod === 'qris' || payMethod === 'tempo'">
                    <button @click="$emit('checkout')"
                        :class="payMethod === 'qris' ? 'bg-purple-600 shadow-purple-200' : 'bg-orange-500 shadow-orange-200'"
                        class="w-full border-none py-5 rounded-[2.5rem] text-white font-black text-[11px] uppercase tracking-[0.2em] animate-slide-up shadow-xl mt-1">
                        PROSES {{ payMethod.toUpperCase() }} SEKARANG
                    </button>
                </template>
            </div>
        </div>
    </div>
    `
};

*/


/*
const PagePenjualan = {
    props: ['cart', 'selectedMember', 'payMethod', 'cashAmount'],
    emits: ['update:payMethod', 'update:cashAmount', 'checkout'],
    setup(props, { emit }) {
        const formatRupiah = (val) => {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
        };

        const totalBelanja = Vue.computed(() => {
            return props.cart.reduce((acc, item) => acc + (item.price_sell * item.qty), 0);
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

        const scrollContainer = Vue.ref(null);
        const scrollToBottom = () => {
            Vue.nextTick(() => {
                if (scrollContainer.value) {
                    scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight, behavior: 'smooth' });
                }
            });
        };

        Vue.watch(() => props.cart.length, (n, o) => { if (n > o) scrollToBottom(); });
        Vue.watch(() => props.cart, () => { scrollToBottom(); }, { deep: true });

        return { formatRupiah, totalBelanja, kembalian, updateQty, scrollContainer };
    },
    template: `
    <div class="flex flex-col h-full relative overflow-hidden bg-white">
        
        <div ref="scrollContainer" 
             :class="payMethod ? 'pb-80' : 'pb-24'"
             class="flex-1 overflow-y-auto px-4 no-scrollbar transition-all duration-500">
            
            <div v-if="cart.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-300 py-20">
                <i class="ri-shopping-cart-2-line text-5xl mb-2 opacity-20"></i>
                <p class="text-[10px] font-bold uppercase tracking-widest opacity-50">Keranjang Kosong</p>
            </div>

            <div v-else class="flex flex-col gap-3 mt-4">
                <div v-for="item in cart" :key="item.id" 
                    class="bg-gray-50 p-3 rounded-2xl flex items-center justify-between shadow-sm animate-slide-up border border-gray-100">
                    <div class="flex gap-3 items-center min-w-0">
                        <div class="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-50">
                            <i class="ri-shopping-bag-3-fill text-xl"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[13px] font-black text-gray-800 truncate uppercase tracking-tight">{{ item.name }}</div>
                            <div class="text-[11px] font-bold text-blue-600">{{ formatRupiah(item.price_sell) }}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-50">
                        <button @click="updateQty(item.id, -1)" class="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 font-black border-none bg-transparent">-</button>
                        <span class="text-[12px] font-black text-gray-700 w-4 text-center">{{ item.qty }}</span>
                        <button @click="updateQty(item.id, 1)" class="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 font-black border-none bg-transparent">+</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50">
            
            <div v-if="payMethod === 'cash'" class="mb-4 animate-slide-up">
                <div class="bg-blue-600 p-4 rounded-[2rem] shadow-xl shadow-blue-200">
                    <div class="flex items-center gap-3 mb-4">
                        <i class="ri-money-dollar-circle-fill text-white text-3xl"></i>
                        <div class="flex-1">
                            <label class="text-[8px] text-blue-200 font-black uppercase block mb-1">Input Tunai</label>
                            <input type="number" inputmode="numeric" :value="cashAmount" 
                                @input="$emit('update:cashAmount', $event.target.value)"
                                class="w-full bg-transparent border-none text-white text-xl font-black outline-none p-0 leading-none"
                                placeholder="0">
                        </div>
                        <div class="text-right border-l border-white/20 pl-3">
                            <div class="text-[8px] text-blue-200 font-black uppercase mb-1">Kembali</div>
                            <div class="text-sm text-white font-black">{{ formatRupiah(kembalian).replace('Rp', '').trim() }}</div>
                        </div>
                    </div>
                    <button @click="(!cashAmount || cashAmount == 0) ? $emit('update:cashAmount', totalBelanja) : $emit('checkout')"
                        class="w-full border-none py-4 rounded-2xl bg-white/20 text-white font-black uppercase text-[11px] tracking-widest transition-all">
                        {{ (!cashAmount || cashAmount == 0) ? 'BAYAR UANG PAS' : (Number(cashAmount) < totalBelanja ? 'UANG KURANG' : 'KONFIRMASI BAYAR') }}
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <div class="flex gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                    <button @click="$emit('update:payMethod', payMethod === 'cash' ? null : 'cash')"
                        :class="payMethod === 'cash' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'"
                        class="flex-1 py-3 rounded-xl border-none text-[10px] font-black uppercase transition-all">
                        CASH
                    </button>
                    <button @click="$emit('update:payMethod', payMethod === 'qris' ? null : 'qris')"
                        :class="payMethod === 'qris' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'"
                        class="flex-1 py-3 rounded-xl border-none text-[10px] font-black uppercase transition-all">
                        QRIS
                    </button>
                    <button @click="$emit('update:payMethod', payMethod === 'tempo' ? null : 'tempo')"
                        :class="payMethod === 'tempo' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'"
                        class="flex-1 py-3 rounded-xl border-none text-[10px] font-black uppercase transition-all">
                        TEMPO
                    </button>
                </div>

                <div v-if="payMethod === 'qris' || payMethod === 'tempo'" class="mt-1">
                    <button @click="$emit('checkout')"
                        class="w-full border-none py-4 rounded-[2rem] bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest animate-slide-up shadow-xl">
                        PROSES {{ (payMethod || '').toUpperCase() }} SEKARANG
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
};
*/



const PagePenjualan = {
    props: ['cart', 'selectedMember', 'payMethod', 'cashAmount'],
    emits: ['update:payMethod', 'update:cashAmount', 'checkout'],
    setup(props, { emit }) {
        const formatRupiah = (val) => {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
        };

        const totalBelanja = Vue.computed(() => {
            return props.cart.reduce((acc, item) => acc + (item.price_sell * item.qty), 0);
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

        const scrollContainer = Vue.ref(null);
        const scrollToBottom = () => {
            Vue.nextTick(() => {
                if (scrollContainer.value) {
                    scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight, behavior: 'smooth' });
                }
            });
        };

        Vue.watch(() => props.cart.length, (n, o) => { if (n > o) scrollToBottom(); });
        Vue.watch(() => props.cart, () => { scrollToBottom(); }, { deep: true });

        return { formatRupiah, totalBelanja, kembalian, updateQty, scrollContainer };
    },
    template: `
    <div class="flex flex-col h-full relative overflow-hidden bg-white">
        
        <div ref="scrollContainer" 
             :class="payMethod ? 'pb-72' : 'pb-24'"
             class="flex-1 overflow-y-auto px-3 no-scrollbar transition-all duration-500">
            
            <div v-if="cart.length === 0" class="h-64 flex flex-col items-center justify-center text-gray-300">
                <i class="ri-shopping-cart-2-line text-4xl mb-2 opacity-20"></i>
                <p class="text-[9px] font-bold uppercase tracking-widest opacity-50">Keranjang Kosong</p>
            </div>

            <div v-else class="flex flex-col gap-2 mt-3">
                <div v-for="item in cart" :key="item.id" 
                    class="bg-gray-50 p-2 pl-3 rounded-xl flex items-center justify-between animate-slide-up border border-gray-100 shadow-sm">
                    
                    <div class="flex gap-3 items-center min-w-0">
                        <div class="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-50">
                            <i class="ri-shopping-bag-3-fill text-lg"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[12px] font-black text-gray-800 truncate uppercase leading-tight">{{ item.name }}</div>
                            <div class="text-[10px] font-bold text-blue-600 leading-tight">{{ formatRupiah(item.price_sell) }}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-gray-100 shadow-sm">
                        <button @click="updateQty(item.id, -1)" 
                            class="w-7 h-7 flex items-center justify-center rounded-md text-red-600 font-black border-none bg-transparent hover:bg-red-50">-</button>
                        <span class="text-[11px] font-black text-gray-700 min-w-[18px] text-center">{{ item.qty }}</span>
                        <button @click="updateQty(item.id, 1)" 
                            class="w-7 h-7 flex items-center justify-center rounded-md text-blue-600 font-black border-none bg-transparent hover:bg-blue-50">+</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50">
            
            <div v-if="payMethod === 'cash'" class="mb-4 animate-slide-up">
                <div class="bg-blue-600 p-4 rounded-[1.5rem] shadow-xl shadow-blue-200 border border-blue-500">
                    <div class="flex items-center gap-3 mb-4">
                        <i class="ri-money-dollar-circle-fill text-white text-3xl"></i>
                        <div class="flex-1">
                            <label class="text-[8px] text-blue-200 font-black uppercase block mb-1">Tunai</label>
                            <input type="number" inputmode="numeric" :value="cashAmount" 
                                @input="$emit('update:cashAmount', $event.target.value)"
                                class="w-full bg-transparent border-none text-white text-xl font-black outline-none p-0 leading-none"
                                placeholder="0">
                        </div>
                        <div class="text-right border-l border-white/20 pl-3">
                            <div class="text-[8px] text-blue-200 font-black uppercase mb-1">Kembali</div>
                            <div class="text-sm text-white font-black">{{ formatRupiah(kembalian).replace('Rp', '').trim() }}</div>
                        </div>
                    </div>
                    <button @click="(!cashAmount || cashAmount == 0) ? $emit('update:cashAmount', totalBelanja) : $emit('checkout')"
                        class="w-full border-none py-3.5 rounded-xl bg-white/20 text-white font-black uppercase text-[10px] tracking-widest transition-all">
                        {{ (!cashAmount || cashAmount == 0) ? 'UANG PAS' : (Number(cashAmount) < totalBelanja ? 'KURANG' : 'KONFIRMASI') }}
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <div class="flex gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                    <button v-for="m in ['cash', 'qris', 'tempo']" 
                        @click="$emit('update:payMethod', payMethod === m ? null : m)"
                        :class="payMethod === m ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'"
                        class="flex-1 py-2.5 rounded-xl border-none text-[10px] font-black uppercase transition-all">
                        {{ m }}
                    </button>
                </div>

                <div v-if="payMethod === 'qris' || payMethod === 'tempo'" class="mt-1">
                    <button @click="$emit('checkout')"
                        class="w-full border-none py-4 rounded-[1.5rem] bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest animate-slide-up shadow-xl">
                        PROSES {{ (payMethod || '').toUpperCase() }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
};
