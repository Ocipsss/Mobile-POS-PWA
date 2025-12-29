// components/pages/Penjualan.js //
// v1.6 - Slim Cart View (Sync with Header Search) //

const PagePenjualan = {
    props: ['cart'], // Menerima data cart dari app.js
    setup(props) {
        // Fungsi untuk menambah jumlah qty
        const updateQty = (id, n) => {
            const item = props.cart.find(i => i.id === id);
            if (item) {
                item.qty += n;
                // Jika qty dikurangi sampai 0, hapus dari keranjang
                if (item.qty <= 0) {
                    const index = props.cart.indexOf(item);
                    props.cart.splice(index, 1);
                }
            }
        };

        // Fungsi hapus semua item
        const clearCart = () => {
            if (confirm("Kosongkan keranjang belanja?")) {
                props.cart.length = 0;
            }
        };

        const formatRupiah = (val) => "Rp " + (val || 0).toLocaleString('id-ID');

        return { updateQty, clearCart, formatRupiah };
    },
    template: `
        <div class="flex flex-col gap-4 pb-32">
            
            <div class="flex justify-between items-center px-1 mt-2">
                <div>
                    <span class="font-black text-gray-700 uppercase text-[10px] tracking-widest">Item Terpilih</span>
                    <div class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{{ cart.length }} Produk dalam daftar</div>
                </div>
                <button v-if="cart.length > 0" @click="clearCart" class="text-[10px] text-red-500 font-black uppercase tracking-wider border-none bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                    Hapus Semua
                </button>
            </div>

            <div class="flex flex-col gap-3">
                <div v-for="item in cart" :key="item.id" 
                    class="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between animate-slide-up">
                    
                    <div class="flex gap-3 items-center min-w-0">
                        <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i class="ri-shopping-bag-3-line text-xl"></i>
                        </div>
                        
                        <div class="min-w-0">
                            <div class="text-sm font-bold text-gray-800 truncate leading-tight">{{ item.name }}</div>
                            <div class="text-[11px] font-black text-blue-600 mt-0.5">{{ formatRupiah(item.price_sell) }}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100 ml-2">
                        <button @click="updateQty(item.id, -1)" class="w-8 h-8 flex items-center justify-center border-none bg-white rounded-lg shadow-sm active:bg-red-50">
                            <i class="ri-subtract-line text-xs font-bold"></i>
                        </button>
                        
                        <span class="text-sm font-black text-gray-700 w-4 text-center">{{ item.qty }}</span>
                        
                        <button @click="updateQty(item.id, 1)" class="w-8 h-8 flex items-center justify-center border-none bg-white rounded-lg shadow-sm text-blue-500 active:bg-blue-50">
                            <i class="ri-add-line text-xs font-bold"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="cart.length === 0" class="flex flex-col items-center justify-center py-20 opacity-40">
                <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i class="ri-shopping-cart-line text-5xl text-gray-300"></i>
                </div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-center text-gray-500 px-10 leading-relaxed">
                    Keranjang Kosong<br>
                    <span class="font-medium normal-case text-gray-400">Gunakan kolom pencarian di atas untuk menambah produk</span>
                </p>
            </div>

        </div>`
};
