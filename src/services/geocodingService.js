export const geocodeAddress = async (address) => {
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
      }
    } else {
      return {
        success: false,
        error: 'Endereço não encontrado',
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao geocodificar: ' + error.message,
    }
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
