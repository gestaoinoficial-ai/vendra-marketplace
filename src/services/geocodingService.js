const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

async function geocodeWithGoogle(address) {
  if (!GOOGLE_MAPS_API_KEY) {
    return { success: false, error: 'Chave da API do Google Maps não configurada' }
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    )
    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results[0]) {
      const result = data.results[0]
      return {
        success: true,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        displayName: result.formatted_address,
        source: 'google',
      }
    }

    return { success: false, error: `Google Geocoding: ${data.status}` }
  } catch (error) {
    return { success: false, error: 'Erro ao geocodificar via Google: ' + error.message }
  }
}

async function geocodeWithNominatim(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`
    )
    const data = await response.json()

    if (data && data[0]) {
      return {
        success: true,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name,
        source: 'nominatim',
      }
    }

    return { success: false, error: 'Endereço não encontrado (Nominatim)' }
  } catch (error) {
    return { success: false, error: 'Erro ao geocodificar via Nominatim: ' + error.message }
  }
}

/**
 * Tenta geocodificar via Google Geocoding API; se falhar (chave ausente,
 * sem resultado, erro de rede), cai para o Nominatim (OpenStreetMap).
 * Se ambos falharem, retorna success: false para que o chamador decida
 * seguir sem coordenadas.
 */
export const geocodeAddress = async (address) => {
  const googleResult = await geocodeWithGoogle(address)
  if (googleResult.success) return googleResult

  const nominatimResult = await geocodeWithNominatim(address)
  if (nominatimResult.success) return nominatimResult

  return {
    success: false,
    error: 'Endereço não encontrado',
  }
}

export const haversineDistance = (coord1, coord2) => {
  const R = 6371 // Raio da Terra em km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const getEngineerLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada'))
      return
    }
    navigator.geolocation.watchPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        reject(error)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
  })
}
