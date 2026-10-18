// Google Analytics 4. Inactive unless VITE_GA_MEASUREMENT_ID (e.g. G-XXXXXXX) is set
// at build time - then gtag.js loads after the page is idle so it never delays
// rendering. Mark `generate_lead` as a key event in GA4 to count it as a conversion.
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

let loaded = false
function load() {
  if (loaded || !GA_ID || typeof window === 'undefined') return
  loaded = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

export function initAnalytics() {
  if (!GA_ID || typeof window === 'undefined') return
  const start = () => ('requestIdleCallback' in window ? window.requestIdleCallback(load, { timeout: 4000 }) : setTimeout(load, 2000))
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}

// Lead form submitted. `form` identifies which form (contact, quote, consult, home).
export function trackLead(form, extra = {}) {
  if (!GA_ID || typeof window === 'undefined') return
  load()
  window.gtag('event', 'generate_lead', { form_name: form, page_path: window.location.pathname, ...extra })
}
