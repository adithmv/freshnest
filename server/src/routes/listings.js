import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res) => {
  const { lat, lng, radius = 3000, category } = req.query
  try {
    if (lat && lng) {
      const { data, error } = await supabaseAdmin.rpc('nearby_listings', { lat: parseFloat(lat), lng: parseFloat(lng), radius_meters: parseFloat(radius) })
      if (error) throw error
      return res.json({ data })
    }
    let query = supabaseAdmin.from('listings').select('*, seller_profiles(shop_name, avg_rating), categories(name)').eq('status', 'active').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
    if (category) query = query.eq('category_id', category)
    const { data, error } = await query
    if (error) throw error
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('listings').select('*, seller_profiles(shop_name, avg_rating, description), categories(name)').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Listing not found' })
  res.json({ data })
})

router.post('/', requireAuth, async (req, res) => {
  const { title, description, price, total_quantity, category_id, tags, is_veg, expires_at, unit_label } = req.body
  if (!title || !price || !total_quantity || !expires_at) return res.status(400).json({ error: 'title, price, total_quantity, expires_at are required' })
  const { data, error } = await supabaseAdmin.from('listings').insert({ seller_id: req.user.id, title, description, price, total_quantity, available_qty: total_quantity, category_id, tags, is_veg, expires_at, unit_label: unit_label || 'packet' }).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({ data })
})

router.patch('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('listings').update(req.body).eq('id', req.params.id).eq('seller_id', req.user.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ data })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin.from('listings').update({ status: 'removed' }).eq('id', req.params.id).eq('seller_id', req.user.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ message: 'Listing removed' })
})

export default router
