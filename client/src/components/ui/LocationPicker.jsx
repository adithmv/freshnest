import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { getCurrentLocation } from "../../lib/location";
import { Navigation, MapPin, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function DraggableMarker({ position, onMove }) {
  useMapEvents({
    click(e) { onMove(e.latlng); }
  });
  return position ? (
    <Marker
      position={position}
      draggable
      eventHandlers={{ dragend: e => onMove(e.target.getLatLng()) }}
    />
  ) : null;
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 15, { duration: 1 }); }, [position]);
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function searchLocation(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
    );
    return await res.json();
  } catch {
    return [];
  }
}

export default function LocationPicker({ value, onChange, onClose }) {
  const [position, setPosition]         = useState(value || null);
  const [address, setAddress]           = useState("");
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const [locating, setLocating]         = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const defaultCenter = position || { lat: 12.3375, lng: 75.7985 };

  useEffect(() => {
    if (position) {
      setLoadingAddress(true);
      reverseGeocode(position.lat, position.lng).then(addr => {
        setAddress(addr);
        setLoadingAddress(false);
      });
    }
  }, [position]);

  async function handleDetectLocation() {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      setPosition(loc);
    } catch (err) {
      alert(err.message);
    }
    setLocating(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchLocation(searchQuery);
    setSearchResults(results);
    setSearching(false);
  }

  function selectSearchResult(result) {
    const pos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setPosition(pos);
    setSearchResults([]);
    setSearchQuery("");
  }

  function handleConfirm() {
    if (!position) return;
    onChange({ ...position, address });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f2f2f2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 19, fontWeight: 700 }}>Set location</h2>
            <p style={{ fontSize: 13, color: "#494848", marginTop: 3 }}>Click on the map or drag the pin to set your location</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#494848" }}>
            <X size={20} />
          </button>
        </div>

        {/* Search bar */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #f2f2f2", position: "relative" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1px solid #e8e8e8", borderRadius: 8, padding: "9px 14px" }}>
              <Search size={14} color="#494848" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for a place or address..."
                style={{ border: "none", outline: "none", fontSize: 14, width: "100%", fontFamily: "inherit" }}
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              style={{ background: "#111", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              {searching ? "..." : "Search"}
            </button>
          </form>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 24, right: 24, background: "white", border: "1px solid #e8e8e8", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden" }}>
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => selectSearchResult(r)}
                  style={{ padding: "12px 16px", cursor: "pointer", borderBottom: i < searchResults.length - 1 ? "1px solid #f5f5f5" : "none", fontSize: 13, color: "#444", display: "flex", alignItems: "flex-start", gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                  <MapPin size={13} color="#494848" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>{r.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detect location button */}
        <div style={{ padding: "10px 24px", borderBottom: "1px solid #f2f2f2" }}>
          <button
            onClick={handleDetectLocation}
            disabled={locating}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid #e8e8e8", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "#27ae60", fontFamily: "inherit", fontWeight: 500 }}
          >
            <Navigation size={13} color="#27ae60" />
            {locating ? "Detecting your location..." : "Use my current location"}
          </button>
        </div>

        {/* Map */}
        <div style={{ flex: 1, minHeight: 300 }}>
          <MapContainer
            center={[defaultCenter.lat, defaultCenter.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%", minHeight: 300 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <DraggableMarker
              position={position ? [position.lat, position.lng] : null}
              onMove={latlng => setPosition({ lat: latlng.lat, lng: latlng.lng })}
            />
            <RecenterMap position={position ? [position.lat, position.lng] : null} />
          </MapContainer>
        </div>

        {/* Selected address */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #f2f2f2", background: "#fafafa" }}>
          {position ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 14 }}>
              <MapPin size={14} color="#c9521e" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: "#494848", marginBottom: 2 }}>Selected location</div>
                <div style={{ fontSize: 13, color: "#444", lineHeight: 1.5 }}>
                  {loadingAddress ? "Getting address..." : address}
                </div>
                <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>
                  {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#bbb", marginBottom: 14 }}>No location selected — click on the map to set one</p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!position}
            style={{ width: "100%", background: "#111", color: "white", border: "none", borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: position ? "pointer" : "not-allowed", opacity: position ? 1 : 0.4, fontFamily: "inherit" }}
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
