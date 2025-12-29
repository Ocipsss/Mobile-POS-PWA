// components/pages/Penjualan.js //

//Halaman Penjualan 1.2 //
const PagePenjualan = {
    props: ['cart'], // Menerima data cart dari app.js
    setup(props) {
        const searchQuery = Vue.ref("");
        const searchResults = Vue.ref([]);

        // Fungsi cari produk dari database
        const searchProduct = async () => {
            if (searchQuery.value.length < 2) {
                searchResults.value = [];
                return;
            }
            const allProducts = await db.products.toArray();
            searchResults.value = allProducts.filter(p => 
                p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                (p.code && p.code.includes(searchQuery.value))
            );
        };

        // Tambah ke keranjang
        const addToCart = (product) => {
            const existing = props.cart.find(item => item.id === product.id);
            if (existing) {
                existing.qty++;
            } else {
                props.cart.push({
                    id: product.id,
                    name: product.name,
                    price_sell: product.price_sell,
                    qty: 1
                });
            }
            searchQuery.value = "";
            searchResults.value = [];
        };

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

        const formatRupiah = (val) => "Rp " + val.toLocaleString('id-ID');

        return { searchQuery, searchResults, searchProduct, addToCart, updateQty, formatRupiah };
    },
    template: `
        <div class="flex flex-col gap-4 pb-24">
            <div class="relative">
                <div class="search-box">
                    <i class="ri-search-line text-gray-400"></i>
                    <input v-model="searchQuery" @input="searchProduct" type="text" placeholder="Ketik nama produk..." class="w-full">
                    <i class="ri-qr-scan-2-line text-blue-500 text-xl"></i>
                </div>

                <div v-if="searchResults.length > 0" class="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-[50] max-h-60 overflow-y-auto">
                    <div v-for="p in searchResults" :key="p.id" @click="addToCart(p)" 
                        class="p-4 border-b border-gray-50 flex justify-between items-center active:bg-gray-50">
                        <div>
                            <div class="text-sm font-bold text-gray-800">{{ p.name }}</div>
                            <div class="text-[10px] text-green-600 font-bold">{{ formatRupiah(p.price_sell) }}</div>
                        </div>
                        <i class="ri-add-circle-fill text-blue-600 text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="mb-2 flex justify-between items-center px-1">
                <span class="font-bold text-gray-700 uppercase text-[10px] tracking-widest">Item Terpilih</span>
                <span @click="cart.length = 0" class="text-xs text-red-500 font-bold cursor-pointer">Hapus Semua</span>
            </div>

            <div v-for="item in cart" :key="item.id" class="cart-item border border-gray-100 shadow-sm animate-slide-up">
                <div class="flex gap-3 items-center">
                    <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                        <i class="ri-shopping-bag-3-line text-xl"></i>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-gray-800">{{ item.name }}</div>
                        <div class="text-xs text-gray-400 font-mono">{{ formatRupiah(item.price_sell) }}</div>
                    </div>
                </div>
                <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                    <button @click="updateQty(item.id, -1)" class="w-8 h-8 flex items-center justify-center border-none bg-white rounded shadow-sm text-xs">-</button>
                    <span class="text-xs font-bold w-4 text-center">{{ item.qty }}</span>
                    <button @click="updateQty(item.id, 1)" class="w-8 h-8 flex items-center justify-center border-none bg-white rounded shadow-sm text-xs text-blue-500">+</button>
                </div>
            </div>

            <div v-if="cart.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-300">
                <i class="ri-shopping-cart-line text-6xl mb-2"></i>
                <p class="text-xs font-bold uppercase tracking-widest text-center px-10">Keranjang kosong.<br>Cari produk di atas untuk mulai.</p>
            </div>
        </div>`
};

// end halaman penjualan 1.2 //