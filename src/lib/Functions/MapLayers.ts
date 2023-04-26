
// Library imports:
import L from "leaflet";
import { convertF } from "./ConvertUnit";
import { chartF } from "./Chart";
import type CSS from 'csstype'

// Imports from Stores.svelte:
import type { Point, Ridge, Crd, Dataset } from "../Stores";
import { chartTypes } from "../Stores";

// The marker icon:
let markerIcon = L.icon({
  iconUrl: 'marker.svg',
  shadowUrl: 'marker-shadow.svg',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Create the loading HTML element:
let loadingIconHTML = document.createElement("div");

// Create the CSS of the loading icon:
let loadingIconStyle: CSS.Properties = {
  translate: "-50% -50%",
  border: "3px solid #f3f3f3",
  borderRadius: "50%",
  borderTop: "3px solid #3498db",
  width: "20px",
  height: "20px",
}

// Assign the made properties to the loading HTML element:
Object.assign(loadingIconHTML.style, loadingIconStyle);

// Make the loading HTML element spin:
loadingIconHTML.animate([
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(360deg)' }
], {
  duration: 2000,
  iterations: Infinity
})

// Create the Leaflet loading icon:
let loadingIcon = L.divIcon({
  iconSize: [0, 0],
  className: "Something to remove the white background",
  html: loadingIconHTML,
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

export function createRidge(label: string, ridgePoints: Point[], crd: Crd, h: number) {
  let color = "#00ff00";
  let crds = convertF.PosToLatLng(ridgePoints)

  let datasets: Dataset[] = []
  chartTypes.forEach(chartType => {
    datasets.push({
      type: chartType,
      updated: false,
      dataset: chartF.createDataset(label, color)
    })
  })

  let ridge: Ridge = {
    color,
    label,
    points: ridgePoints,
    datasets: datasets,
    marker: {
      onMap: createMarker(crd),
      crd,
      pos: convertF.LatLngToPos(crd),
      mapHeight: h
    },

    polyline: {
      crds,
      onMap: createPolyline(crds).setStyle({color}),
    }
  }

  chartF.updateDataset(ridge.datasets.find(dataset => dataset.type == "Hillshade"), {
    points: ridge.points,
  })

  return ridge
}