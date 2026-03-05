import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Mail, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await signIn(form)
    setLoading(false)
    if (error) return setError(error.message)
    const role = data.user?.user_metadata?.role
    if (role === 'seller') navigate('/dashboard')
    else navigate('/browse')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, background: '#111', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={14} color="white" />
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700 }}>FreshNest</span>
        </Link>

        <div style={{ background: 'white', border: '1px solid #efefef', borderRadius: 14, padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#999', marginBottom: 28 }}>Sign in to your account</p>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fdd', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#c00', marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 14px' }}>
                <Mail size={15} color="#ccc" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 14px' }}>
                <Lock size={15} color="#ccc" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#111', color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? 'Signing in...' : <> Sign in <ArrowRight size={15} /> </>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#999', marginTop: 20 }}>
          No account?{' '}
          <Link to="/signup" style={{ color: '#111', fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
