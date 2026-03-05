import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import listingsRouter from './routes/listings.js'
import ordersRouter from './routes/orders.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/listings', listingsRouter)
app.use('/api/orders',   ordersRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))
app.use((err, _req, res, _next) => { console.error(err.stack); res.status(500).json({ error: 'Internal server error' }) })

app.listen(PORT, () => console.log(`FreshNest server running on http://localhost:${PORT}`))
