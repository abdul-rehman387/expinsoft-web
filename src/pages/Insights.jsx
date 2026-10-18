import { useState } from 'react'
import { Link } from 'react-router-dom'
import ConsultForm from '../components/ConsultForm'
import { blogPosts } from '../data/blogPosts'

const featured = {
  tag: 'Industry Report',
  h: 'The State of Custom Software Development: 2026 Industry Report',
  desc: 'We surveyed 200+ CTOs and engineering leaders to uncover the trends shaping how enterprises build, buy, and scale software this year - from AI-assisted development to the return of platform engineering.',
  img: '1515879218367-8466d910aaa4',
}

const categories = ['All', 'Mobile', 'AI', 'Web', 'Cloud']

export default function Insights() {
  const [tab, setTab] = useState('All')
  const filtered = tab === 'All' ? blogPosts : blogPosts.filter(b => b.cat === tab)

  return (
    <>
      <section className="intro">
        <div className="wrap">
          <span className="ghost">INSIGHTS</span>
          <div className="intro-grid">
            <div>
              <p className="crumb">
                <Link to="/">Home</Link>
                <span className="sep">/</span>
                <span className="cur">Insights</span>
              </p>
              <p className="eyebrow orange" style={{ marginBottom: 14 }}>Blog & Insights</p>
              <h1>Software Development Blog &amp; Insights</h1>
              <p className="lead">
                Practical, engineering-led perspectives on mobile, AI, cloud, and software strategy -
                written by the team that ships the projects, not a marketing desk.
              </p>
              <div className="pillars">
                {['120+ Articles Published', '50k+ Monthly Readers', 'Written by Our Engineers', 'No Fluff, No Filler'].map(p => (
                  <div key={p}>{p}</div>
                ))}
              </div>
            </div>
            <ConsultForm title={'Have a Project\nin Mind?'} />
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="case">
            <div>
              <p style={{ color: 'var(--orange)', fontFamily: 'Poppins', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{featured.tag}</p>
              <h3>{featured.h}</h3>
              <p>{featured.desc}</p>
              <Link to="/" className="btn">Read Full Report</Link>
            </div>
            <div className="case-img">
              <img src={`https://images.unsplash.com/photo-${featured.img}?w=700&q=80&auto=format`} alt="" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--gray-bg)' }}>
        <div className="wrap">
          <div className="head">
            <p className="eyebrow orange">Browse by Topic</p>
            <h2>Latest Articles</h2>
          </div>
          <div className="ins-tabs">
            {categories.map(t => (
              <button key={t} className={`ins-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          <p className="grid-label">Showing {filtered.length} of {blogPosts.length} articles</p>
          <div className="blog-grid">
            {filtered.map(b => (
              <div key={b.slug} className="blog">
                <div className="img">
                  <img src={`https://images.unsplash.com/photo-${b.img}?w=600&q=80&auto=format`} alt="" loading="lazy" />
                </div>
                <div className="bd">
                  <span className="blog-meta">{b.topic} · {b.readTime}</span>
                  <h3>{b.h}</h3>
                  <p>{b.p}</p>
                  <Link to={`/insights/${b.slug}`} className="more">Read Article →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band grad-blue">
            <div className="txt">
              <p className="eyebrow" style={{ color: 'var(--orange)', marginBottom: 12 }}>Stay in the Loop</p>
              <h2>Get New Articles in Your Inbox</h2>
              <p>One email a month - engineering deep-dives, industry trends, and no sales pitches. Unsubscribe any time.</p>
              <Link to="/" className="btn" style={{ background: 'var(--orange)' }}>Subscribe to the Newsletter</Link>
            </div>
            <div className="pic">
              <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80&auto=format" alt="" loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
