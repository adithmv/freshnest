import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import LocationPicker from '../components/ui/LocationPicker'
import { Home, Mail, Lock, User, Phone, ArrowRight, MapPin, Camera, Clock, Store } from 'lucide-react'

const ROLES = [
  { value: 'buyer',  label: 'Buyer',  desc: 'I want to order food' },
  { value: 'seller', label: 'Seller', desc: 'I want to sell food' },
]

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

const DEFAULT_HOURS = { mon: '9:00-21:00', tue: '9:00-21:00', wed: '9:00-21:00', thu: '9:00-21:00', fri: '9:00-21:00', sat: '9:00-21:00', sun: '9:00-21:00' }

export default function Signup() {
  const { signUp, user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'buyer' })
  const [shopForm, setShopForm] = useState({ shopName: '', description: '', shopType: 'home_cook' })
  const [openingHours, setOpeningHours] = useState(DEFAULT_HOURS)
  const [shopLocation, setShopLocation] = useState(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'seller') navigate('/dashboard')
      else navigate('/browse')
    }
  }, [user, profile])

  function handleBanner(e) {
    const file = e.target.files[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    if (form.role === 'seller' && !shopForm.shopName) return setError('Please enter your shop name')
    setLoading(true)

    try {
      const { data, error: signUpError } = await signUp(form)
      if (signUpError) { setError(signUpError.message); setLoading(false); return }

      // If seller, create seller_profile
      if (form.role === 'seller' && data?.user) {
        let bannerUrl = null

        // Upload banner image if provided
        if (bannerFile) {
          const ext = bannerFile.name.split('.').pop()
          const path = `${data.user.id}/banner.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('shop-images')
            .upload(path, bannerFile, { upsert: true })
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('shop-images').getPublicUrl(path)
            bannerUrl = urlData.publicUrl
          }
        }

        await supabase.from('seller_profiles').upsert({
          user_id: data.user.id,
          shop_name: shopForm.shopName,
          description: shopForm.description,
          shop_type: shopForm.shopType,
          banner_image: bannerUrl,
          address: shopLocation?.address || null,
          lat: shopLocation?.lat || null,
          lng: shopLocation?.lng || null,
          opening_hours: openingHours,
          is_open: true,
        }, { onConflict: 'user_id' })
      }

      if (form.role === 'seller') navigate('/dashboard')
      else navigate('/browse')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
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
          style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', padding: '24px 16px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, justifyContent: 'center', textDecoration: 'none', color: '#111' }}>
          <div style={{ width: 28, height: 28, background: '#111', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={14} color="white" />
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700 }}>Home Bite</span>
        </Link>

        <div style={{ background: 'white', border: '1px solid #efefef', borderRadius: 16, padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Create account</h1>
          <p style={{ fontSize: 14, color: '#999', marginBottom: 28 }}>Join the Home Bite community</p>

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
              <div style={{ display: 'flex', gap: 8 }}>
                {ROLES.map(r => (
                  <div
                    key={r.value}
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    style={{ flex: 1, border: `1.5px solid ${form.role === r.value ? '#111' : '#e8e8e8'}`, borderRadius: 8, padding: '10px 6px', cursor: 'pointer', textAlign: 'center', background: form.role === r.value ? '#111' : 'white', transition: 'all 0.15s' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.role === r.value ? 'white' : '#111' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: form.role === r.value ? '#aaa' : '#bbb', marginTop: 2 }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller extra fields */}
            {form.role === 'seller' && (
              <div style={{ borderTop: '1px solid #f2f2f2', paddingTop: 24, marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#494848', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Store size={14} /> Shop details
                </p>

                {/* Banner image */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>Shop banner photo</label>
                  <div
                    onClick={() => fileRef.current.click()}
                    style={{ width: '100%', height: 140, border: '1.5px dashed #e8e8e8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#fafafa', position: 'relative' }}
                  >
                    {bannerPreview ? (
                      <img src={bannerPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#bbb' }}>
                        <Camera size={24} style={{ marginBottom: 6 }} />
                        <div style={{ fontSize: 13 }}>Upload shop photo</div>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleBanner} style={{ display: 'none' }} />
                </div>

                {/* Shop name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Shop name *</label>
                  <input
                    required={form.role === 'seller'}
                    placeholder="e.g. Meena's Kitchen"
                    value={shopForm.shopName}
                    onChange={e => setShopForm(f => ({ ...f, shopName: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Shop type */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Shop type</label>
                  <select
                    value={shopForm.shopType}
                    onChange={e => setShopForm(f => ({ ...f, shopType: e.target.value }))}
                    style={{ width: '100%', border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'white' }}
                  >
                    {[['home_cook','Home Kitchen'], ['bakery','Bakery'], ['tiffin','Tiffin Service'], ['sweet_shop','Sweets & Snacks'], ['other','Other']].map(([val, label]) => (
  <option key={val} value={val}>{label}</option>
                      
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Description</label>
                  <textarea
                    placeholder="Tell customers what makes your food special..."
                    value={shopForm.description}
                    onChange={e => setShopForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', border: '1px solid #e8e8e8', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                {/* Location */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>Shop location</label>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${shopLocation ? '#27ae60' : '#e8e8e8'}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, cursor: 'pointer', background: shopLocation ? '#f0faf4' : 'white', color: shopLocation ? '#27ae60' : '#bbb', fontFamily: 'inherit' }}
                  >
                    <MapPin size={15} color={shopLocation ? '#27ae60' : '#bbb'} />
                    {shopLocation ? shopLocation.address?.slice(0, 50) || 'Location pinned' : 'Pin your shop on the map'}
                  </button>
                </div>

                {/* Opening hours */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} /> Opening hours
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {DAYS.map(day => (
                      <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: '#494848', width: 36, flexShrink: 0 }}>{DAY_LABELS[day]}</span>
                        <input
                          value={openingHours[day]}
                          onChange={e => setOpeningHours(h => ({ ...h, [day]: e.target.value }))}
                          placeholder="9:00-21:00 or Closed"
                          style={{ flex: 1, border: '1px solid #e8e8e8', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#111', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, fontFamily: 'inherit' }}
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

      {/* Location picker modal */}
      {showLocationPicker && (
        <LocationPicker
          value={shopLocation}
          onChange={loc => { setShopLocation(loc); setShowLocationPicker(false) }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  )
}