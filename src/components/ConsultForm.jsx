import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useLeadForm } from '../lib/useLeadForm'

export default function ConsultForm({ title = "Let's Discuss\nYour Project" }) {
  const { form, onChange, onSubmit, sending, sent, error, honeypotField } =
    useLeadForm('consult', { name: '', email: '', phone: '', message: '' })

  return (
    <div className="form-card">
      <h2 className="form-title" style={{ whiteSpace: 'pre-line' }}>{title}</h2>
      {sent ? (
        <p className="success-msg" role="status"><CheckCircle2 size={18} strokeWidth={1.75} /> Thank you! We'll be in touch shortly.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div {...honeypotField.wrapperProps}><input {...honeypotField.inputProps} /></div>
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
            <button type="submit" className="btn" disabled={sending} style={{ width: '100%', justifyContent: 'center' }}>
              {sending ? 'Sending…' : 'Send Message →'}
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      )}
    </div>
  )
}
