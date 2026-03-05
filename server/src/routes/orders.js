import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth, async (req, res) => {
  const { listing_id, quantity, delivery_address, delivery_notes } = req.body
  if (!listing_id || !quantity || !delivery_address) return res.status(400).json({ error: 'listing_id, quantity, delivery_address are required' })
  const { data: listing, error: listingErr } = await supabaseAdmin.from('listings').select('id, seller_id, price, available_qty, status, expires_at').eq('id', listing_id).single()
  if (listingErr || !listing) return res.status(404).json({ error: 'Listing not found' })
  if (listing.status !== 'active') return res.status(400).json({ error: 'Listing is no longer available' })
  if (new Date(listing.expires_at) < new Date()) return res.status(400).json({ error: 'This listing has expired' })
  if (listing.available_qty < quantity) return res.status(400).json({ error: `Only ${listing.available_qty} packets available` })
  const { data, error } = await supabaseAdmin.from('orders').insert({ buyer_id: req.user.id, seller_id: listing.seller_id, listing_id, quantity, unit_price: listing.price, total_amount: listing.price * quantity, delivery_address, delivery_notes, payment_method: 'cod' }).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json({ data })
})

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('orders').select('*, listings(title, images, price), profiles!seller_id(full_name)').eq('buyer_id', req.user.id).order('placed_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ data })
})

router.get('/seller', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('orders').select('*, listings(title), profiles!buyer_id(full_name, phone)').eq('seller_id', req.user.id).order('placed_at', { ascending: false })
  if (error) return res.status(400).json({ error: error.message })
  res.json({ data })
})

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body
  const timestamps = { confirmed: 'confirmed_at', ready: 'ready_at', picked_up: 'picked_up_at', delivered: 'delivered_at', cancelled: 'cancelled_at' }
  const updateData = { status }
  if (timestamps[status]) updateData[timestamps[status]] = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('orders').update(updateData).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json({ data })
})

export default router
