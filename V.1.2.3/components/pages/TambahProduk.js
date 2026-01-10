// components/pages/TambahProduk.js //

const PageTambahProduk = {
    emits: ['open-scanner'],
    setup(props, { emit }) {
        const product = Vue.ref({
            image: null, name: '', code: '', category: 'Umum', unit: 'pcs', price_modal: 0, price_sell: 0, qty: 0,
            pack_price: 0, pack_size: 1
        });

        const displayModal = Vue.ref("");
        const displaySell = Vue.ref("");
        const displayPack = Vue.ref("");
        const listCategories = Vue.ref([]);

        const loadCategories = async () => {
            const data = await db.categories.toArray();
            listCategories.value = data;
        };

        const formatDisplay = (val) => {
            if (!val) return "";
            return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        };

        const updateNumber = (field, event) => {
            let rawValue = event.target.value.replace(/\D/g, "");
            let numValue = parseInt(rawValue) || 0;
            product.value[field] = numValue;
            
            if (field === 'price_modal') displayModal.value = formatDisplay(numValue);
            if (field === 'price_sell') displaySell.value = formatDisplay(numValue);
            
            if (field === 'pack_price') {
                displayPack.value = formatDisplay(numValue);
                if (product.value.pack_size > 0) {
                    const unitModal = Math.round(numValue / product.value.pack_size);
                    product.value.price_modal = unitModal;
                    displayModal.value = formatDisplay(unitModal);
                }
            }
        };

        const clearInitialSize = () => {
            if (product.value.pack_size === 1) {
                product.value.pack_size = null;
            }
        };

        const updatePackSize = () => {
            if (product.value.pack_price > 0 && product.value.pack_size > 0) {
                const unitModal = Math.round(product.value.pack_price / product.value.pack_size);
                product.value.price_modal = unitModal;
                displayModal.value = formatDisplay(unitModal);
            }
        };

        const takePhoto = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const size = 400; 
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        const min = Math.min(img.width, img.height);
                        const sx = (img.width - min) / 2;
                        const sy = (img.height - min) / 2;
                        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
                        product.value.image = canvas.toDataURL('image/jpeg', 0.7);
                    };
                };
            };
            input.click();
        };

        const saveProduct = async () => {
    // 1. Validasi Input Dasar
    if(!product.value.name || !product.value.price_sell) {
        alert("Nama dan Harga Jual wajib diisi!");
        return;
    }

    try {
        // 2. CEK DUPLIKASI KODE PRODUK
        // Kita hanya cek jika kode tidak kosong
        if (product.value.code) {
            const existingProduct = await db.products
                .where('code')
                .equals(product.value.code)
                .first();

            if (existingProduct) {
                alert(`Gagal! Produk dengan kode "${product.value.code}" sudah terdaftar (Nama: ${existingProduct.name}).`);
                return; // Berhenti di sini, tidak lanjut menyimpan
            }
        }

        // 3. Jika lolos pengecekan, lanjutkan simpan
        const productData = JSON.parse(JSON.stringify(product.value));
        const localId = await db.products.add(productData);

        if (typeof fdb !== 'undefined') {
            await fdb.ref('products/' + localId).set({
                ...productData,
                id: localId,
                updatedAt: new Date().toISOString()
            });
        }

        alert("Produk Berhasil Disimpan!");
        
        // Reset Form
        product.value = { 
            image: null, name: '', code: '', category: 'Umum', 
            unit: 'pcs', price_modal: 0, price_sell: 0, qty: 0, 
            pack_price: 0, pack_size: 1 
        };
        displayModal.value = ""; 
        displaySell.value = ""; 
        displayPack.value = "";

    } catch (err) { 
        alert("Gagal menyimpan: " + err.message); 
    }
};

        Vue.onMounted(loadCategories);

        return { product, takePhoto, saveProduct, displayModal, displaySell, displayPack, updateNumber, updatePackSize, clearInitialSize, listCategories, emit };
    },
    template: `
        <div class="flex flex-col gap-3 pb-24">
            <div class="p-5 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-3">
                
                <div class="flex flex-col items-center mb-2">
                    <div @click="takePhoto" class="w-40 h-40 bg-gray-50 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 relative">
                        <img v-if="product.image" :src="product.image" class="w-full h-full object-cover">
                        <div v-else class="text-center text-gray-400 p-4">
                            <i class="ri-camera-lens-line text-4xl"></i>
                            <span class="block text-[10px] mt-2 uppercase font-black">Foto Produk</span>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nama Produk</label>
                    <input v-model="product.name" type="text" class="form-control" placeholder="Contoh: Indomie Goreng">
                </div>

                <div class="form-group">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Kode / Barcode</label>
                    <div class="flex items-stretch gap-2 h-12"> 
                        <input v-model="product.code" type="text" class="form-control flex-1 !m-0" placeholder="Scan atau manual...">
                        <button @click="$emit('open-scanner')" class="bg-blue-50 text-blue-600 border-none px-4 rounded-xl flex items-center justify-center active:bg-blue-100 transition-all">
                            <i class="ri-qr-scan-2-line text-xl"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="form-group">
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Kategori</label>
                        <select v-model="product.category" class="form-control">
                            <option value="Umum">Umum</option>
                            <option v-for="cat in listCategories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Satuan</label>
                        <select v-model="product.unit" class="form-control">
                            <option value="pcs">pcs</option>
                            <option value="bks">bks</option>
                            <option value="btg">btg</option>
                            <option value="rtg">rtg</option>
                        </select>
                    </div>
                </div>

                <hr class="border-gray-50 my-1">

                <div class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-3">
                    <div class="flex justify-between items-center px-1">
                        <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">Kalkulator Grosir</span>
                        <i class="ri-calculator-line text-blue-400"></i>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="form-group">
                            <label class="text-[9px] font-black text-gray-400 uppercase mb-1 block">Harga 1 Pak</label>
                            <input :value="displayPack" @input="updateNumber('pack_price', $event)" type="text" inputmode="numeric" class="form-control !bg-white font-bold" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="text-[9px] font-black text-gray-400 uppercase mb-1 block">Isi Per Pak</label>
                            <input v-model.number="product.pack_size" @input="updatePackSize" @focus="clearInitialSize" type="number" class="form-control !bg-white font-bold" placeholder="1">
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="form-group">
                        <label class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 block">Harga Modal (/pcs)</label>
                        <input :value="displayModal" @input="updateNumber('price_modal', $event)" type="text" inputmode="numeric" class="form-control font-bold text-red-600 bg-red-50/20" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label class="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 block">Harga Jual (/pcs)</label>
                        <input :value="displaySell" @input="updateNumber('price_sell', $event)" type="text" inputmode="numeric" class="form-control font-bold text-green-600 bg-green-50/20" placeholder="0">
                    </div>
                </div>

                <div class="form-group">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Stok Awal</label>
                    <input v-model.number="product.qty" type="number" class="form-control font-bold" placeholder="0">
                </div>

                <button @click="saveProduct" class="w-full mt-4 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase active:scale-95 transition-all">
                    Simpan Produk
                </button>
            </div>
        </div>
    `
};
