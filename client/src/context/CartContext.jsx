import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  function addToCart(listing) {
    setCart(prev => {
      const exists = prev.find(c => c.id === listing.id)
      if (exists) return prev.map(c => c.id === listing.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...listing, qty: 1 }]
    })
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  function updateQty(id, qty) {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c))
  }

  function clearCart() {
    setCart([])
  }

  const total     = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const itemCount = cart.reduce((s, c) => s + c.qty, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
