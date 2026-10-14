// Mockup only. Placeholder VPA, never a real one.
const UPI = 'upi://pay?pa=yourname@okbank&pn=Tushar%20Pathak&am=1999&cu=INR&tn=Tegaki%20T-4F2A'
document.querySelectorAll('[data-qr]').forEach((el) => {
  const q = qrcode(0, 'M'); q.addData(UPI); q.make()
  el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true })
  el.querySelector('svg').setAttribute('role', 'img')
  el.querySelector('svg').setAttribute('aria-label', 'UPI QR code for ₹1,999 to Tushar Pathak, note Tegaki T-4F2A')
})
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => {
  const t = b.textContent; b.textContent = 'Copied'; setTimeout(() => (b.textContent = t), 1400)
}))
function attach(scope) {
  const root = document.querySelector(scope)
  root.querySelector('[data-drop]').classList.add('hidden')
  root.querySelector('[data-file]').classList.remove('hidden')
  root.querySelector('[data-submit]').removeAttribute('disabled')
}
function detach(scope) {
  const root = document.querySelector(scope)
  root.querySelector('[data-drop]').classList.remove('hidden')
  root.querySelector('[data-file]').classList.add('hidden')
  root.querySelector('[data-submit]').setAttribute('disabled', '')
}
