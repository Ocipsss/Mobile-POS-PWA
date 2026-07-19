import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

export function usePhysicalScanner() {
  // State reaktif untuk menyimpan hasil scan terakhir
  const scannedBarcode = ref('')
  
  // Variabel internal untuk mencatat ketikan dan waktu
  let inputBuffer = ''
  let lastKeyTime = performance.now()

  // Dengarkan event keydown secara global di window
  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    const currentTime = performance.now()

    // Scanner fisik mengetik sangat cepat (biasanya < 20ms per karakter).
    // Jika jeda antar ketikan lebih dari 50ms, itu kemungkinan jari manusia. Reset buffer.
    if (currentTime - lastKeyTime > 50) {
      inputBuffer = ''
    }
    lastKeyTime = currentTime

    // Abaikan tombol modifier (seperti Shift, Ctrl, Alt) agar tidak merusak barcode
    if (event.key.length > 1 && event.key !== 'Enter') return

    // Scanner selalu mengirimkan 'Enter' di akhir pembacaan barcode
    if (event.key === 'Enter') {
      if (inputBuffer.length > 0) {
        scannedBarcode.value = inputBuffer // Perbarui nilai reaktif
        inputBuffer = '' // Kosongkan buffer untuk scan berikutnya
      }
      return
    }

    // Tambahkan karakter ke dalam buffer
    inputBuffer += event.key
  })

  return {
    scannedBarcode
  }
}
