import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api, auth } from './lib/api';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || '917389098246').replace(/\D/g, '');
const CONTACT_PHONE = '917389098246';
const SOCIALS = {
  instagram: 'https://instagram.com/hiral.jewels',
  facebook: 'https://facebook.com/hiraljewelss/',
  youtube: 'https://youtube.com/@Hiral_Jewels'
};

function whatsappInquiry(product) {
  const text = `Hello Hiral Jewels, I am interested in ${product?.name || 'a jewellery piece'}. Please share the latest price and details.`;
  const url = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function SocialIcons({ compact = false }) {
  return (
    <div className={`social-icons${compact ? ' compact' : ''}`} aria-label="Hiral Jewels social media">
      <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 2A3.2 3.2 0 0 0 4 7.2v9.6A3.2 3.2 0 0 0 7.2 20h9.6a3.2 3.2 0 0 0 3.2-3.2V7.2A3.2 3.2 0 0 0 16.8 4H7.2Zm9.05 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>
      </a>
      <a href={SOCIALS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6h1.8V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3h2.8v8h3.2Z"/></svg>
      </a>
      <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" title="YouTube">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.6 15.9V8.1l6.5 3.9-6.5 3.9Z"/></svg>
      </a>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img className="footer-logo" src="/hiral-jewels-logo.png" alt="Hiral Jewels logo" />
        <div><strong>HIRAL JEWELS</strong><span>Thoughtfully made. Beautifully yours.</span></div>
      </div>
      <SocialIcons />
    </footer>
  );
}

function getBag() {
  try { return JSON.parse(localStorage.getItem('hiral_jewels_bag') || '[]'); } catch { return []; }
}

function saveBag(items) {
  localStorage.setItem('hiral_jewels_bag', JSON.stringify(items));
  window.dispatchEvent(new Event('hiral-bag-updated'));
}

function addToBag(product) {
  const bag = getBag();
  const existing = bag.find(item => String(item.id) === String(product.id));
  const next = existing
    ? bag.map(item => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item)
    : [...bag, { ...product, quantity: 1 }];
  saveBag(next);
}

function removeFromBag(id) {
  saveBag(getBag().filter(item => String(item.id) !== String(id)));
}

function setBagQuantity(id, quantity) {
  if (quantity <= 0) return removeFromBag(id);
  saveBag(getBag().map(item => String(item.id) === String(id) ? { ...item, quantity } : item));
}

function BagLink() {
  const [count, setCount] = useState(getBag().reduce((sum, item) => sum + Number(item.quantity || 1), 0));
  useEffect(() => {
    const update = () => setCount(getBag().reduce((sum, item) => sum + Number(item.quantity || 1), 0));
    window.addEventListener('hiral-bag-updated', update);
    return () => window.removeEventListener('hiral-bag-updated', update);
  }, []);
  return <Link className="bag" to="/bag">Bag ({count})</Link>;
}

function MetalTicker() {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await api.request('/api/market/prices');
      setPrices(data);
    } catch (err) {
      console.error('All India Bullion market prices unavailable', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5 * 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="metal-ticker" aria-label="All India Bullion gold and silver rates">
      <div><span>24K GOLD · 999</span><b>{loading ? 'Loading…' : prices ? `${money(prices.gold.inrPer10g)} / 10g` : '—'}</b></div>
      <div><span>SILVER · 999</span><b>{loading ? 'Loading…' : prices ? `${money(prices.silver.inrPerKg)} / kg` : '—'}</b></div>
      {prices?.rateDate ? <small>{prices.source} · {prices.rateDate}</small> : <small>All India Bullion reference</small>}
    </div>
  );
}

function Storefront() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api.request('/api/products').then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    const section = document.querySelector('#story');
    if (!section) return;
    const targets = section.querySelectorAll('.journal-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -70px 0px' });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const visible = useMemo(() => products.filter(p => {
    const matchesCategory = category === 'All' || p.category === category;
    const text = `${p.name} ${p.category} ${p.material} ${p.stone}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [products, query, category]);

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/" onClick={closeMenu}><img src="/hiral-jewels-logo.png" alt="Hiral Jewels logo" /><span>HIRAL JEWELS</span></Link>
        <nav className={menuOpen ? 'mobile-menu-open' : ''}>
          <a href="#collection" onClick={closeMenu}>Collection</a>
          <a href="#story" onClick={closeMenu}>Our Story</a>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <Link to="/admin" onClick={closeMenu}>Admin</Link>
          <Link to="/bag" onClick={closeMenu}>Bag</Link>
        </nav>
        <div className="header-right"><SocialIcons compact /><MetalTicker /><BagLink /></div>
        <button className={`mobile-menu-toggle${menuOpen ? ' is-open' : ''}`} type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
          <span></span><span></span><span></span>
        </button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">EST. 2024 · DHAR</p>
          <h1>Jewels that<br /><i>hold a story.</i></h1>
          <p>Thoughtfully designed jewellery, shaped by heritage and finished for modern moments.</p>
          <a className="text-link" href="#collection">Explore collection ↗</a>
        </div>
        <img src="https://images.unsplash.com/photo-1588444650733-d0767b753fc8?auto=format&fit=crop&w=1500&q=85" alt="Jewellery" />
      </section>

      {/* <section className="story" id="story">
        <p className="eyebrow">THE HIRAL JOURNAL</p>
        <h2>Not made to follow.<br /><i>Made to be remembered.</i></h2>
        {/* <p>Every Hiral Jewel begins with a feeling. Designed in Jaipur and made with attention to the smallest detail.</p> */}
      {/* </section>  */}




      <main id="collection" className="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CURATED COLLECTION</p>
            <h2>The Collection</h2>
          </div>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search jewellery..." />
        </div>

        <div className="filters">
          {categories.map(item => (
            <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {visible.map(product => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image || '/hiral-jewels-logo.png'} alt={product.name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/hiral-jewels-logo.png'; }} />
                {product.featured ? <span>Featured</span> : null}
              </div>
              <p className="eyebrow">{product.category}</p>
              <h3>{product.name}</h3>
              <p className="muted">{product.material} · {product.stone}</p>
              <button className="gold-btn add-bag-btn" onClick={() => addToBag(product)}>Add to Bag</button>
              <button className="whatsapp-btn" onClick={() => whatsappInquiry(product)}>WhatsApp Inquiry ↗</button>
            </article>
          ))}
        </div>
      </main>

      <section className="story" id="story">
        <div className="story-header journal-reveal journal-reveal-header">
          <p className="eyebrow">THE HIRAL JOURNAL</p>

          <h2>
            Not made to follow.
            <br />
            <i>Made to be remembered.</i>
          </h2>

          <p className="story-intro">
            Hiral Jewels began its journey in 2024 with a simple vision —
            to make jewellery more than just an accessory. Every piece is
            created to carry beauty, emotion, trust and a story of its own.
          </p>
        </div>

        {/* JOURNEY */}
        <div className="story-timeline">

          <div className="story-item journal-reveal journal-reveal-item">
            <div className="story-year">2024</div>

            <div className="story-content">
              <span>THE BEGINNING</span>
              <h3>A Journey That Began With a Dream</h3>

              <p>
                Every beautiful journey starts with a first step.
                In 2024, Hiral Jewels was born with a passion for timeless
                jewellery and a commitment to creating an experience our
                customers could truly trust.
              </p>

              <p>
                Our beginning was never just about jewellery.
                It was about creating relationships that last longer
                than the sparkle of a piece.
              </p>
            </div>
          </div>

          <div className="story-item journal-reveal journal-reveal-item">
            <div className="story-year">2025</div>

            <div className="story-content">
              <span>GROWING WITH TRUST</span>
              <h3>Every Customer Became Part of Our Story</h3>

              <p>
                With every customer, every order and every new design,
                Hiral Jewels continued to grow.
              </p>

              <p>
                Our customers inspired us to explore new designs,
                improve our service and keep raising our standards.
              </p>

              <div className="story-highlight">
                “Every purchase became a memory.
                Every customer became a part of the Hiral family.”
              </div>
            </div>
          </div>

          <div className="story-item journal-reveal journal-reveal-item">
            <div className="story-year">2026</div>

            <div className="story-content">
              <span>A NEW CHAPTER</span>
              <h3>Tradition Meets Modern Elegance</h3>

              <p>
                Today, Hiral Jewels is stepping into a new chapter.
                With a growing collection, a stronger digital presence
                and a vision for the future, we continue to bring together
                traditional craftsmanship and modern elegance.
              </p>

              <div className="story-motto">
                <span>Our philosophy</span>
                <strong>Create beautifully. Serve honestly. Grow together.</strong>
              </div>
            </div>
          </div>

        </div>

        {/* VALUES */}
        <div className="story-values">

          <div className="story-section-heading">
            <p className="eyebrow">WHAT WE BELIEVE IN</p>
            <h3>Values that define <i>Hiral.</i></h3>
          </div>

          <div className="values-grid">

            <div className="value-card">
              <span>01</span>
              <h4>Purity</h4>
              <p>
                Because trust begins with what you can believe in.
              </p>
            </div>

            <div className="value-card">
              <span>02</span>
              <h4>Quality</h4>
              <p>
                Because every detail matters when it becomes part
                of someone's special moment.
              </p>
            </div>

            <div className="value-card">
              <span>03</span>
              <h4>Craftsmanship</h4>
              <p>
                Jewellery is not simply made — it is carefully crafted.
              </p>
            </div>

            <div className="value-card">
              <span>04</span>
              <h4>Transparency</h4>
              <p>
                Because our customers deserve honesty at every step.
              </p>
            </div>

            <div className="value-card">
              <span>05</span>
              <h4>Trust</h4>
              <p>
                Because for us, a relationship is more valuable than a sale.
              </p>
            </div>

          </div>
        </div>

        {/* HIRAL PROMISE */}
        <div className="hiral-promise">

          <p className="eyebrow">THE HIRAL PROMISE</p>

          <h3>
            Jewellery that feels as special
            <br />
            <i>as the moment it represents.</i>
          </h3>

          <p>
            Whether it is a gift for someone you love, a celebration,
            a wedding, a milestone or simply something beautiful for yourself,
            we want every Hiral Jewels experience to be memorable.
          </p>

          <strong>
            Beautiful jewellery. Honest service. Lasting trust.
          </strong>

        </div>

        {/* BEHIND EVERY PIECE */}
        <div className="story-behind">

          <div>
            <p className="eyebrow">BEHIND EVERY PIECE</p>

            <h3>
              Crafted with care.
              <br />
              <i>Chosen with emotion.</i>
            </h3>
          </div>

          <div>
            <p>
              Every piece of jewellery has a journey of its own —
              from an idea and design to craftsmanship, finishing
              and finally reaching you.
            </p>

            <p>
              We pay attention to the details that make jewellery
              feel special, because we know that the smallest details
              can become part of someone's biggest memories.
            </p>
          </div>

        </div>

        {/* CUSTOMERS */}
        <div className="story-customers">

          <p className="eyebrow">OUR CUSTOMERS — OUR STORY</p>

          <h3>
            Your stories are the
            <br />
            <i>most beautiful chapters.</i>
          </h3>

          <p>
            Hiral Jewels is not built by jewellery alone.
            It is built by the people who trusted us, celebrated
            with us and chose us for their special moments.
          </p>

          <strong>
            Your smiles, celebrations and stories are the heart
            of The Hiral Journal.
          </strong>

        </div>

        {/* VISION */}
        <div className="story-vision">

          <p className="eyebrow">OUR VISION</p>

          <h3>
            From a dream in 2024
            <br />
            <i>to a legacy for tomorrow.</i>
          </h3>

          <p>
            We started in 2024 with a dream.
            Today, we are building something much bigger —
            a jewellery brand people remember for its elegance,
            quality and trust.
          </p>

          <p>
            Our journey is still being written.
          </p>

          <div className="journey-end">
            <span>2024 — WE BEGAN.</span>
            <span>2025 — WE GREW.</span>
            <span>2026 — WE EVOLVED.</span>
            <span>TOMORROW — WE BUILD A LEGACY.</span>
          </div>

          <div className="brand-signature">
            <strong>HIRAL JEWELS</strong>
            <span>More than jewellery. A story worth wearing.</span>
          </div>

        </div>

      </section>


      <section className="bag-section"><p className="eyebrow">SHOPPING BAG</p><h2>Your jewellery bag</h2><p className="muted">View your selected pieces and send the complete enquiry to Hiral Jewels.</p><Link className="gold-btn" to="/bag">Open Bag ↗</Link></section>

      <SiteFooter />
    </>
  );
}


function PageHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <Link className="brand" to="/" onClick={closeMenu}><img src="/hiral-jewels-logo.png" alt="Hiral Jewels logo" /><span>HIRAL JEWELS</span></Link>
      <nav className={menuOpen ? 'mobile-menu-open' : ''}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/collection" onClick={closeMenu}>Collection</Link>
        <Link to="/about" onClick={closeMenu}>Our Story</Link>
        <Link to="/contact" onClick={closeMenu}>Contact</Link>
        <Link to="/admin" onClick={closeMenu}>Admin</Link>
      </nav>
      <div className="header-right"><SocialIcons compact /><MetalTicker /><BagLink /></div>
      <button className={`mobile-menu-toggle${menuOpen ? ' is-open' : ''}`} type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
        <span></span><span></span><span></span>
      </button>
    </header>
  );
}

function SimplePage({ eyebrow, title, children }) {
  return (
    <>
      <PageHeader />
      <main className="simple-page">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

function AboutPage() {
  return (
    <SimplePage eyebrow="THE HIRAL STORY" title={<>Made with heritage.<br /><i>Designed for now.</i></>}>
      <div className="story-page-grid">
        <img src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1100&q=85" alt="Hiral jewellery craftsmanship" />
        <div>
          <p>Hiral Jewels brings together traditional Indian jewellery language and a clean contemporary point of view.</p>
          <p>From delicate everyday pieces to statement creations, every design is considered for proportion, comfort and character.</p>
          <p className="muted">Our promise is simple: jewellery should feel personal today and remain meaningful for years.</p>
        </div>
      </div>
    </SimplePage>
  );
}

function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.request('/api/enquiries', { method: 'POST', body: JSON.stringify(form) });
      setSent(true);
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <PageHeader />
      <main className="contact-page">
        <div>
          <p className="eyebrow">GET IN TOUCH</p>
          <h1>Let's find your<br /><i>perfect piece.</i></h1>
          <p className="muted contact-intro">For product questions, custom requests or appointments, send us a message.</p>
          <button type="button" className="whatsapp-btn contact-whatsapp" onClick={() => whatsappInquiry({ name: 'Hiral Jewels collection' })}>WhatsApp Us ↗</button>
          <div className="contact-details">
            <p><b>Studio</b><br />DHAR, Madhya Pradesh</p>
            <p><b>Hours</b><br />Mon–Sat · 10:00–07:00</p>
            <p><b>Phone / WhatsApp</b><br /><a href="tel:+917389098246">+91 73890 98246</a></p>
            <p><b>Email</b><br />tanishmahajan1997@gmail.com</p>
          </div>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <label>Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Phone<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Message<textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></label>
          {sent && <div className="success">Thank you. Your enquiry has been received.</div>}
          {error && <div className="error">{error}</div>}
          <button className="gold-btn">Send enquiry</button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.request(`/api/products/${id}`).then(setProduct).catch(() => setProduct(null));
    api.request('/api/products').then(items => setRelated(items.filter(x => String(x.id) !== String(id)).slice(0, 3))).catch(() => { });
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) return <><PageHeader /><main className="simple-page"><h1>Product not found</h1><Link className="text-link" to="/collection">← Back to collection</Link></main></>;

  return (
    <>
      <PageHeader />
      <main className="detail-page">
        <Link className="back-link" to="/collection">← Back to collection</Link>
        <section className="detail-grid">
          <div className="detail-image"><img src={product.image || '/hiral-jewels-logo.png'} alt={product.name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/hiral-jewels-logo.png'; }} /></div>
          <div className="detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>
            <button className="whatsapp-btn detail-whatsapp" onClick={() => whatsappInquiry(product)}>WhatsApp Inquiry ↗</button>
            <p className="detail-description">{product.description || 'A timeless Hiral Jewels piece, crafted with considered detail.'}</p>
            <div className="specs">
              <div><span>Material</span><b>{product.material || '—'}</b></div>
              <div><span>Stone</span><b>{product.stone || '—'}</b></div>
              <div><span>Availability</span><b>{Number(product.stock) > 0 ? `${product.stock} in stock` : 'Made to order'}</b></div>
            </div>
            <button className="gold-btn detail-add" onClick={() => addToBag(product)}>Add to Bag</button>
            <button className="outline-btn detail-add" onClick={() => whatsappInquiry(product)}>Enquire on WhatsApp ↗</button>
            <div className="detail-notes">
              <p><b>Authenticity</b><br />Every piece is checked before dispatch.</p>
              <p><b>Care</b><br />Store separately and keep away from chemicals and moisture.</p>
            </div>
          </div>
        </section>
        <section className="related">
          <p className="eyebrow">YOU MAY ALSO LIKE</p>
          <h2>More pieces</h2>
          <div className="product-grid">
            {related.map(x => <article className="product-card" key={x.id}>
              <Link className="product-image" to={`/product/${x.id}`}><img src={x.image} alt={x.name} /></Link>
              <p className="eyebrow">{x.category}</p><h3><Link className="product-name" to={`/product/${x.id}`}>{x.name}</Link></h3>
              <button className="gold-btn add-bag-btn" onClick={() => addToBag(x)}>Add to Bag</button>
              <button className="whatsapp-btn" onClick={() => whatsappInquiry(x)}>WhatsApp Inquiry ↗</button>
            </article>)}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function BagPage() {
  const [bag, setBag] = useState(getBag());
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const update = () => setBag(getBag());
    window.addEventListener('hiral-bag-updated', update);
    return () => window.removeEventListener('hiral-bag-updated', update);
  }, []);

  async function sendBagEmail(e) {
    e.preventDefault();
    if (!bag.length) return;
    setSending(true); setStatus('');
    try {
      const data = await api.request('/api/orders/email', {
        method: 'POST',
        body: JSON.stringify({ customer, items: bag })
      });
      setStatus(data.message || 'Your bag enquiry has been sent.');
    } catch (err) {
      console.error('Bag email failed:', err);
      setStatus(err.message || 'Could not send the bag email. Please try again.');
    } finally { setSending(false); }
  }

  const totalItems = bag.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  return (
    <>
      <PageHeader />
      <main className="bag-page">
        <div className="bag-title"><p className="eyebrow">HIRAL JEWELS</p><h1>Your <i>Bag</i></h1><p className="muted">{totalItems} item{totalItems === 1 ? '' : 's'} selected</p></div>
        {bag.length === 0 ? (
          <section className="empty-bag"><h2>Your bag is empty</h2><p className="muted">Add jewellery from the collection and it will appear here.</p><Link className="gold-btn" to="/collection">Explore Collection ↗</Link></section>
        ) : (
          <div className="bag-layout">
            <section className="bag-items">
              {bag.map(item => (
                <article className="bag-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div><p className="eyebrow">{item.category}</p><h2>{item.name}</h2><p className="muted">{item.material} · {item.stone}</p>
                    <div className="quantity"><button onClick={() => setBagQuantity(item.id, Number(item.quantity || 1) - 1)}>−</button><b>{item.quantity}</b><button onClick={() => setBagQuantity(item.id, Number(item.quantity || 1) + 1)}>+</button></div>
                  </div>
                  <button className="remove-bag" onClick={() => removeFromBag(item.id)}>Remove</button>
                </article>
              ))}
            </section>
            <form className="bag-form" onSubmit={sendBagEmail}>
              <p className="eyebrow">SEND ENQUIRY</p><h2>Send this bag to Hiral Jewels</h2>
              <p className="muted">Your selected products will be emailed to <b>tanishmahajan1997@gmail.com</b>.</p>
              <label>Name<input required value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} /></label>
              <label>Phone<input required value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} /></label>
              <label>Your Email<input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} /></label>
              <label>Message<textarea value={customer.message} onChange={e => setCustomer({ ...customer, message: e.target.value })} placeholder="Any size, customization or delivery questions?" /></label>
              {status && <div className="success">{status}</div>}
              <button className="gold-btn" disabled={sending}>{sending ? 'Sending…' : 'Send Bag by Email ↗'}</button>
              <button type="button" className="whatsapp-btn" onClick={() => whatsappInquiry({ name: `Bag enquiry (${totalItems} items)` })}>Send Bag on WhatsApp ↗</button>
            </form>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      auth.setToken(data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="login-card" onSubmit={submit}>
        <Link to="/" className="back-link">← Store</Link>
        <img className="login-logo" src="/hiral-jewels-logo.png" alt="Hiral Jewels logo" />
        <p className="eyebrow">HIRAL JEWELS</p>
        <h1>Admin Login</h1>
        {error && <div className="error">{error}</div>}
        <label>Username<input value={username} onChange={e => setUsername(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="gold-btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        {/* <small>Demo: admin / admin123</small> */}
      </form>
    </div>
  );
}


async function fileToProductImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  const maxSize = 1400;
  const quality = 0.84;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not process the image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const blankProduct = {
  name: '', category: 'Earrings', material: '18K Gold', stone: '',
  price: '', image: '', description: '', stock: 0, featured: false
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [form, setForm] = useState(blankProduct);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  async function handleImageUpload(file) {
    if (!file) return;
    setImageLoading(true);
    setMessage('');
    try {
      const dataUrl = await fileToProductImage(file);
      setForm(prev => ({ ...prev, image: dataUrl }));
    } catch (err) {
      setMessage(err.message);
    } finally {
      setImageLoading(false);
    }
  }

  async function load() {
    try {
      const [p, e] = await Promise.all([
        api.request('/api/products'),
        api.request('/api/enquiries')
      ]);
      setProducts(p);
      setEnquiries(e);
    } catch {
      auth.clear();
      navigate('/admin');
    }
  }

  useEffect(() => { load(); }, []);

  function logout() {
    auth.clear();
    navigate('/admin');
  }

  async function saveProduct(e) {
    e.preventDefault();
    try {
      const path = editingId ? `/api/products/${editingId}` : '/api/products';
      await api.request(path, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) })
      });
      setMessage(editingId ? 'Product updated.' : 'Product added.');
      setForm(blankProduct);
      setEditingId(null);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function edit(product) {
    setEditingId(product.id);
    setForm({
      ...product,
      featured: Boolean(product.featured)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.request(`/api/products/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function updateStatus(id, status) {
    await api.request(`/api/enquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    load();
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <img className="admin-logo" src="/hiral-jewels-logo.png" alt="Hiral Jewels logo" />
          <div><p className="eyebrow">HIRAL JEWELS</p>
            <h1>Admin Dashboard</h1></div>
        </div>
        <div className="admin-actions">
          <Link to="/">View Store</Link>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="admin-content">
        <section className="stats">
          <div><span>Products</span><b>{products.length}</b></div>
          <div><span>Enquiries</span><b>{enquiries.length}</b></div>
          <div><span>Featured</span><b>{products.filter(p => p.featured).length}</b></div>
        </section>

        <section className="admin-grid">
          <form className="panel product-form" onSubmit={saveProduct}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">INVENTORY</p>
                <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
              </div>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blankProduct); }}>Cancel</button>}
            </div>

            {message && <div className="notice">{message}</div>}

            <label>Product name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>Category<input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
            <label>Material<input value={form.material} onChange={e => setForm({ ...form, material: e.target.value })} /></label>
            <label>Stone<input value={form.stone} onChange={e => setForm({ ...form, stone: e.target.value })} /></label>
            <label>Price<input required type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label>
            <label>Stock<input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></label>
            <label>Image URL
              <input
                value={form.image && !form.image.startsWith('data:image/') ? form.image : ''}
                onChange={e => setForm({ ...form, image: e.target.value })}
                placeholder="https://example.com/product-image.jpg"
              />
            </label>

            <div className="image-upload-box">
              <div className="image-upload-heading">
                <span>Or upload image</span>
                <small>Mobile gallery / camera supported</small>
              </div>
              <input
                className="image-file-input"
                id="product-image-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={e => handleImageUpload(e.target.files?.[0])}
              />
              <label className="outline-btn image-upload-label" htmlFor="product-image-upload">
                {imageLoading ? 'Processing image...' : '📷 Add Image'}
              </label>

              {form.image ? (
                <div className="image-preview">
                  <img
                    src={form.image}
                    alt="Product preview"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.classList.add('image-preview-error');
                    }}
                  />
                  <div className="image-preview-error-text">Image URL could not be loaded. Use a direct image URL or upload an image.</div>
                </div>
              ) : (
                <div className="image-preview empty">Image preview will appear here</div>
              )}
            </div>

            <label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
            <label className="check"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured product</label>
            <button className="gold-btn">{editingId ? 'Update product' : 'Add product'}</button>
          </form>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CATALOGUE</p>
                <h2>Products</h2>
              </div>
            </div>

            <div className="admin-list">
              {products.map(product => (
                <div className="admin-product" key={product.id}>
                  <img src={product.image || '/hiral-jewels-logo.png'} alt="" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/hiral-jewels-logo.png'; }} />
                  <div>
                    <b>{product.name}</b>
                    <span>{product.category} · {money(product.price)}</span>
                    <small>Stock: {product.stock}</small>
                  </div>
                  <button onClick={() => edit(product)}>Edit</button>
                  <button className="danger" onClick={() => remove(product.id)}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="panel enquiries">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CUSTOMERS</p>
              <h2>Enquiries</h2>
            </div>
          </div>
          {enquiries.length === 0 ? <p className="muted">No enquiries yet.</p> : enquiries.map(item => (
            <div className="enquiry" key={item.id}>
              <div><b>{item.name}</b><span>{item.phone} · {item.email}</span></div>
              <p>{item.message}</p>
              <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Storefront />} />
      <Route path="/collection" element={<Storefront />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/bag" element={<BagPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

