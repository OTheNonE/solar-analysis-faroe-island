
// Library imports:
import L from "leaflet";

// Imports from Stores.svelte:
import type { Crd } from "src/lib/Stores"

var markerIcon = L.icon({
  iconUrl: 'marker.svg',
  shadowUrl: 'marker-shadow.svg',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export function createPolyline(crds?: Crd[]) {

  if (crds) {
    return L.polyline(crds)
  } else {
    return L.polyline([{lat: 0, lng: 0}, {lat: 0.1, lng: 0.1}]);
  }
}

export function createMarker(crd?: Crd) {

  if (crd) {
    return L.marker(crd, { icon: markerIcon })
  } else {
    return L.marker([0,0], { icon: markerIcon })
  }
}

export function updateColorOfLayer(layer, color) {
  layer.setStyle({
    color,
  })

}