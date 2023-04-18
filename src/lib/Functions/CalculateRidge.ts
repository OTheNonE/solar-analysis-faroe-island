import { get } from "svelte/store";
import type { Point, Pos, Ridge, Crd, Window, BoundingBox } from "../Stores";
import { system } from "../Stores";
import { getHeight } from "./GetHeight";
import { convertF } from "./ConvertUnit";
import { isOverlapping2D, keepValueBetween } from "./Functions";
import { getBoundingBox, getGeoTIFFImage } from "./FetchFunctions";
import type { GeoTIFFImage } from "geotiff";
import workerUrl from "src/lib/Functions/CalculateRidge?worker&url";

interface getRidgePointSettings {
  image: GeoTIFFImage,
  boundingBox: BoundingBox,
  dataset_length: number,
  window?: Window,
  ridgePointsIn?: Point[],
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// When this script is created as worker, this will wait for its inside to be finished.
addEventListener('message', async (e:MessageEvent<Pos>) => {
  let pos = e.data;
  let points = await getRidgePoints_Init(pos)
  postMessage(points)
})

// The function calling the worker.
export async function getRidgePoints(pos: Pos) {
  
  // Les hetta:
  // https://github.com/webpack/webpack/discussions/
  
  // Skal eg fara til webpack5 ístaðin fyri vite?
  // https://www.taniarascia.com/how-to-use-webpack/

  // Create a worker
  // const url = new URL("src/lib/Functions/CalculateRidge?worker&url", import.meta.url);
  // const worker = new Worker(url, { type: 'module' })

  const worker = new Worker(workerUrl, { type: 'module' })

  // const worker = new workerUrl()

  // Send a value to the worker.
  worker.postMessage(pos)

  // Wait for the worker to process the sent value and recieve the calculated value.
  const result: Point[] = await runWorker(worker);

  // Terminate the worker.
  worker.terminate();

  return result
}

// An await function that will wait for a message from the worker
function runWorker(worker: Worker): Promise<Point[]> {
  return new Promise(resolve => {
    worker.onmessage = (e:MessageEvent<Point[]>) => {
      resolve(e.data)
    }
  })
}

export async function getRidgePoints_Init(pos_m: Pos) {

  // let start = Date.now()

  const DSM_Base = new URL(import.meta.url)
  const DSM_25M = new URL('FO_DSM_2017_FOTM_25M_DEFLATE_UInt16.tif', DSM_Base.origin);
  const DSM_5M = new URL('FO_DSM_2017_FOTM_5M_DEFLATE_UInt16.tif', DSM_Base.origin);

  // Load the 25M resolution map.
  let image_25M = await getGeoTIFFImage(DSM_25M);
  let bbox_25M = getBoundingBox(image_25M);
  
  let px_m = convertF.PosToPixel(pos_m, bbox_25M)
  let h_m = await getHeight(image_25M, px_m) + 2.5

  // Get the ridge from the 25M map.
  let ridgePoints_25M = await _getRidgePoints(pos_m, h_m, {
    image: image_25M,
    boundingBox: bbox_25M,
    dataset_length: 360,
  })

  // Load the 5M resolution map.
  let image_5M = await getGeoTIFFImage(DSM_5M);
  let bbox_5M = getBoundingBox(image_5M);
  
  // Specify the radius of merging.
  let radius = Math.floor(1000);

  // Convert all points found in the ridge from 25M to windows.
  let windows = getMergedWindows(ridgePoints_25M, radius)

  // Map the position values [m] to pixel values [#].
  windows = windows.map(window => {

    let pos_min: Pos = { x: window.xmin, y: window.ymin }
    let pos_max: Pos = { x: window.xmax, y: window.ymax }

    let px_min = convertF.PosToPixel(pos_min, bbox_5M);
    let px_max = convertF.PosToPixel(pos_max, bbox_5M);

    return { xmin: px_min.x, ymin: px_min.y, xmax: px_max.x, ymax: px_max.y }
  })

  // Find new ridges from 5M resolution map using the found windows.
  let dataset_length_5M = 360 * 2;
  let ridgePoints_5M: Point[] = createInitialRidge(h_m, pos_m, dataset_length_5M);
  for (let i = 0; i < windows.length; i++) {

    await _getRidgePoints(pos_m, h_m, {
      image: image_5M,
      boundingBox: bbox_5M,
      dataset_length: dataset_length_5M,
      window: windows[i],
      ridgePointsIn: ridgePoints_5M,
    })
  }

  // let end = Date.now()
  // console.log(`Function execution time is: ${end-start} ms`)

  return ridgePoints_5M
}

async function _getRidgePoints(pos_m: Pos, h_m: number, options: getRidgePointSettings) {

  let image = options.image;
  let bbox = options.boundingBox;
  let window = options.window;
  let ridgePointsIn = options.ridgePointsIn

  // The angles are divided by every dv degrees:
  let dataset_length = options.dataset_length;
  let dv_rad = 2 * Math.PI / dataset_length;
  let dv_deg = 360 / dataset_length;
  
  let center = get(system).settings.center_of_FO;
  let d_min = get(system).settings.d_min;

  const r_earth = 6371000;
  
  // Get bounding box values:
  let map_resolution = (bbox.heightRatio + bbox.widthRatio) / 2

  let pos_m_wrt_bbox: Pos = {
    x: pos_m.x + center.x - bbox.xmin,
    y: pos_m.y + center.y - bbox.ymax
  }

  if (!window) {
    window = {
      xmin: 0,
      ymin: bbox.pixelHeight,
      xmax: bbox.pixelWidth,
      ymax: 0,
    }
  }

  // The values are read from the raster image:
  let data = await getHeight(image, window);

  // The point array keeping track of the points with the highest r value:
  let ridgePoints = ridgePointsIn ? ridgePointsIn : createInitialRidge(h_m, pos_m, dataset_length);

  // Loop through every point...
  for (let i = 0; i < data.heights.length; i++) {

    // If the given height is 0 or 255 (255 is seawater), then continue (wont be highest value).
    let height = data.heights[i];
    if (height == 255 || height == 0) continue;

    // Calculate the pixel coordinate.
    let px = {
      x: i % data.w + window.xmin,
      y: Math.floor(i / data.w) + window.ymax,
    }

    let pos_wrt_bbox: Pos = {
      x: px.x * bbox.widthRatio,
      y: -px.y * bbox.heightRatio
    }
    
    let d: Pos = {
      x: pos_wrt_bbox.x - pos_m_wrt_bbox.x,
      y: pos_wrt_bbox.y - pos_m_wrt_bbox.y,
    }
  
    // If the total distance is smaller than 150, it can bring
    // errors, and therefore, skip the point.
    let d_abs = Math.sqrt(d.x**2 + d.y**2);
    if (d_abs < d_min) continue;

    // Calculate the angle between the current position and marker:
    let azi = -Math.atan2(d.y, d.x) + Math.PI/2
    if (azi < 0) {
      azi += 2 * Math.PI
    }

    // Calculate the height to distance ratio (h/d):
    let r = (height - d_abs**2 / (2 * r_earth) - h_m) / d_abs
    
    // Calculate the radius of the points area:
    let v_c = 1.4241 * map_resolution / d_abs

    // Calculate the index which to store the new point:
    let start = Math.floor((azi - v_c) / dv_rad);
    let end = Math.floor((azi + v_c) / dv_rad);

    let diff = end - start
    for (let j = 0; j <= diff; j++) {

      let index = keepValueBetween(j + start, 0, dataset_length);

      // If the calculated ratio is greater than the current, replace it.
      if (ridgePoints[index] == undefined || ridgePoints[index].r < r) {
        
        // if (height == 0) { console.log(`d = ${d_abs}, r = ${r}`) }
                  
        let pos = {
          x: pos_wrt_bbox.x + bbox.xmin - center.x, 
          y: pos_wrt_bbox.y + bbox.ymax - center.y
        }
        
        let alt = Math.atan2(height - h_m, d_abs);
        ridgePoints[index] = {
          x: pos.x, 
          y: pos.y, 
          h: height, 
          d: d_abs, 
          azi: azi * 180 / Math.PI,
          alt: alt * 180 / Math.PI, 
          r
        }
      }
    }
  }

  ridgePoints.sort((a, b) => a.azi - b.azi)

  return ridgePoints
}

function getMergedWindows(points: Point[], radius: number) {

  let windows: Window[] = []
  points.forEach(point => {
    if (point.h == 0) { return }

    windows.push({
      xmin: point.x - radius,
      ymin: point.y - radius,
      xmax: point.x + radius,
      ymax: point.y + radius,
    })
  })
  
  // Merge all intersecting windows.
  let changeMade = true
  while (changeMade) {
    changeMade = false;

    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        if (isOverlapping2D(windows[i], windows[j])) {
          changeMade = true
  
          windows[i] = {
            xmin: Math.min(windows[i].xmin, windows[j].xmin),
            xmax: Math.max(windows[i].xmax, windows[j].xmax),
            ymin: Math.min(windows[i].ymin, windows[j].ymin),
            ymax: Math.max(windows[i].ymax, windows[j].ymax),
          }
  
          windows.splice(j, 1)
        }
      }
    }
  }

  return windows
}

function createInitialRidge(h_m: number, pos_m: Pos, dataset_length: number) {
  const dv_rad = 2 * Math.PI / dataset_length;
  const r_earth = 63001041

  const d_horizon = Math.sqrt(h_m * h_m + 2 * r_earth * h_m);
  const h_horizon = -r_earth * h_m / (r_earth + h_m);
  const r_horizon = (h_horizon - h_m) / d_horizon;
  const alt_horizon = Math.atan2(h_horizon - h_m, d_horizon)
  // const v_horizon = Math.asin(r_earth / (r_earth + h_m))

  let ridgePoints: Point[] = [];

  for (let index = 0; index < dataset_length; index++) {
    let dv = index * dv_rad;

    ridgePoints.push({
      x: pos_m.x - d_horizon * Math.sin(-dv),
      y: pos_m.y + d_horizon * Math.cos(-dv),
      r: r_horizon,
      h: h_horizon,
      azi: dv * 180 / Math.PI,
      alt: alt_horizon * 180 / Math.PI,
      d: d_horizon,
    })
  }

  return ridgePoints
}