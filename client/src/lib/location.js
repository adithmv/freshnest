export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error("Location access denied. Please allow location to continue.")),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

export function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)}m away`
  return `${(metres / 1000).toFixed(1)}km away`
}
