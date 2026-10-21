import { useEffect, useRef, useState } from 'react'
import { trackLead } from './analytics'

// Visually hidden but present in the DOM: people never fill it, naive bots do.
const HONEYPOT_STYLE = { position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }

const FALLBACK_ERROR = "We couldn't send your message right now. Please try again, or email contact@expinsoft.com directly."

// Shared state + submission for every lead form. Posts to /api/lead (the Vercel
// Serverless Function in api/lead.js, which emails the lead), and
// reports success only after the server confirms the email was sent.
export function useLeadForm(formId, initial) {
  const [form, setForm] = useState(initial)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')
  const startedAt = useRef(0)
  const honeypot = useRef(null)

  useEffect(() => { startedAt.current = Date.now() }, [])

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async e => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          form: formId,
          page: window.location.pathname,
          website: honeypot.current?.value || '',
          elapsedMs: Date.now() - startedAt.current,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || FALLBACK_ERROR)
      setStatus('sent')
      trackLead(formId, form.service ? { service: form.service } : {})
    } catch (err) {
      setStatus('error')
      // fetch() network failures surface as TypeError ("Failed to fetch").
      setError(err instanceof TypeError ? FALLBACK_ERROR : err.message)
    }
  }

  const honeypotField = {
    wrapperProps: { 'aria-hidden': true, style: HONEYPOT_STYLE },
    // Deliberately meaningless name: autofill must never fill it for real visitors.
    inputProps: { ref: honeypot, type: 'text', name: 'ae_hp_confirm', tabIndex: -1, autoComplete: 'off', defaultValue: '' },
  }

  return { form, onChange, onSubmit, status, error, sending: status === 'sending', sent: status === 'sent', honeypotField }
}
