import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import logo from '../assets/ExpinSoft-Logo.png'
import { CONTACT_EMAIL } from '../data/contact'

const services = [
  { label: 'AI Agents & Chatbots', href: '/ai-agents-chatbots' },
  { label: 'Workflow Automation', href: '/workflow-automation' },
  { label: 'Telegram / Discord Bots', href: '/telegram-discord-bots' },
  { label: 'Crypto Trading Bots', href: '/crypto-trading-bots' },
  { label: 'Mining & Node Tools', href: '/mining-node-tools' },
  { label: 'Mobile App Development', href: '/mobile-app-development' },
  { label: 'SaaS Development', href: '/saas-development' },
  { label: 'React / Next.js', href: '/react-nextjs-development' },
  { label: 'E-Commerce Development', href: '/ecommerce-development' },
  { label: 'Smart Contracts', href: '/smart-contracts' },
]
const technologies = [
  'React / React Native','Node.js','Python','Java','.NET / C#',
  'Azure','AWS','Flutter','Unity 3D','PostgreSQL'
]

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="ready">
          <p className="small">READY TO START?</p>
          <h2>Let's Build Something<br /><span style={{color:'var(--orange)'}}>Extraordinary</span> Together</h2>
          <Link to="/contact" className="btn">Start Your Project</Link>
        </div>

        <div className="fcols">
          <div className="fcol">
            <h3>Services</h3>
            <div className="flink-grid">
              {services.map(s => <Link key={s.label} to={s.href}>{s.label}</Link>)}
            </div>
          </div>
          <div className="fcol">
            <h3>Technologies</h3>
            <div className="flink-grid">
              {technologies.map(t => <Link key={t} to="/technologies">{t}</Link>)}
            </div>
          </div>
          <div className="fcol">
            <h3>Company</h3>
            <Link to="/about">About ExpinSoft</Link>
            <Link to="/">Careers</Link>
            <Link to="/insights">Blog & Insights</Link>
            <Link to="/portfolio">Portfolio</Link>
            <Link to="/">Press & Media</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>

        <div className="locs">
          <h3>Our Offices</h3>
          <div className="loc-codes">
            <span>Coquitlam, Canada</span>
            <span>Karachi, Pakistan</span>
          </div>
          <div className="loc-meta">
            <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={16} strokeWidth={1.75} /> {CONTACT_EMAIL}</a>
            <span><Phone size={16} strokeWidth={1.75} /> +1 (832) 555-0190</span>
          </div>
        </div>

        <div className="fbottom">
          <div className="fbottom-brand">
            <img src={logo} alt="ExpinSoft" width="480" height="118" className="fbottom-logo" loading="lazy" />
            <p>© ExpinSoft 2026. All rights reserved.</p>
          </div>
          <div className="links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
