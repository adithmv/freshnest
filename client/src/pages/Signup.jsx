import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react'

const ROLES = [
  { value: 'buyer',  label: 'Buyer',  desc: 'I want to order food' },
  { value: 'seller', label: 'Seller', desc: 'I want to sell food' },
  { value: 'rider',  label: 'Rider',  desc: 'I want to deliver food' },
]

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'buyer' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    const { error } = await signUp(form)
    setLoading(false)
    if (error) return setError(error.message)
    if (form.role === 'seller') navigate('/dashboard')
    else navigate('/browse')
  }

  const field = (label, key, type, placeholder, Icon) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 14px' }}>
        <Icon size={15} color="#ccc" />
        <input
          type={type}
          required
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent' }}
        />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, background: '#111', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={14} color="white" />
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700 }}>FreshNest</span>
        </Link>

        <div style={{ background: 'white', border: '1px solid #efefef', borderRadius: 14, padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create account</h1>
          <p style={{ fontSize: 14, color: '#999', marginBottom: 28 }}>Join the FreshNest community</p>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fdd', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#c00', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {field('Full name', 'fullName', 'text', 'Your name', User)}
            {field('Email', 'email', 'email', 'you@example.com', Mail)}
            {field('Phone', 'phone', 'tel', '+91 98765 43210', Phone)}
            {field('Password', 'password', 'password', '••••••••', Lock)}

            {/* Role selector */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 10 }}>I am joining as</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {ROLES.map(r => (
                  <div
                    key={r.value}
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    style={{ flex: 1, border: `1.5px solid ${form.role === r.value ? '#111' : '#e8e8e8'}`, borderRadius: 8, padding: '10px 8px', cursor: 'pointer', textAlign: 'center', background: form.role === r.value ? '#111' : 'white', transition: 'all 0.15s' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.role === r.value ? 'white' : '#111' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: form.role === r.value ? '#aaa' : '#bbb', marginTop: 2 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#111', color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? 'Creating account...' : <> Create account <ArrowRight size={15} /> </>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#999', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#111', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
