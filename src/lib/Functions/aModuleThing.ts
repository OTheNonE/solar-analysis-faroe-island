import { get } from "svelte/store";
import type { Point, Pos, Ridge, Crd, Window, BoundingBox } from "../Stores";
import { system } from "../Stores";
import { getHeight } from "./GetHeight";
import { convertF } from "./ConvertUnit";
import { isOverlapping2D, keepValueBetween } from "./Functions";
import { chartF } from "./Chart";
// import { createMarker, createPolyline } from "./MapLayers";
import type { GeoTIFFImage } from "geotiff";
import { getBoundingBox, getGeoTIFFImage } from "./FetchFunctions";

export function myFunction(x) {
    return x + 1
}