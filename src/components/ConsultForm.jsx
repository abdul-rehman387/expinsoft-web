import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { trackLead } from '../lib/analytics'

export default function ConsultForm({ title = "Let's Discuss\nYour Project" }) {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const onSubmit = e => { e.preventDefault(); trackLead('consult'); setSent(true) }

  return (
    <div className="form-card">
      <h2 className="form-title" style={{ whiteSpace: 'pre-line' }}>{title}</h2>
      {sent ? (
        <p className="success-msg"><CheckCircle2 size={18} strokeWidth={1.75} /> Thank you! We'll be in touch shortly.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="fld">
            <input name="name" value={form.name} onChange={onChange} placeholder="Your Name*" required />
          </div>
          <div className="fld">
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email Address*" required />
          </div>
          <div className="fld">
            <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone Number" />
          </div>
          <div className="fld">
            <textarea name="message" value={form.message} onChange={onChange} placeholder="Tell us about your project…" rows={4} />
          </div>
          <p className="agree">
            By submitting you agree to our <Link to="/privacy">Privacy Policy</Link>.
          </p>
          <div className="submit">
            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
              Send Message →
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
