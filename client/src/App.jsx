import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import Feed           from './pages/Feed'
import SellerDashboard from './pages/SellerDashboard'
import ListingDetail  from './pages/ListingDetail'
import Orders         from './pages/Orders'
import Cart           from './pages/Cart'
import Checkout       from './pages/Checkout'
import OrderSuccess   from './pages/OrderSuccess'
import NotFound from './pages/NotFound'
import ShopPage from './pages/ShopPage'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'#999' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<Landing />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/signup"      element={<Signup />} />
      <Route path="/browse"      element={<Feed />} />
      <Route path="/listing/:id" element={<ListingDetail />} />
      <Route path="/cart"        element={<Cart />} />
      <Route path="/checkout"    element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
      <Route path="/orders"      element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/dashboard"   element={<ProtectedRoute role="seller"><SellerDashboard /></ProtectedRoute>} />
      <Route path="/shop/:id" element={<ShopPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
