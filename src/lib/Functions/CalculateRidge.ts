
import workerUrl from "src/lib/Functions/CalculateRidgeWorker?worker&url";
import type { Pos, Point } from "../Stores";

// The function calling the worker.
export async function getRidgePoints(pos: Pos) {

  // Create a worker
  const worker = new Worker(workerUrl, { type: 'module' })

  // Send a value to the worker.
  worker.postMessage(pos)

  // Wait for the worker to process the sent value and recieve the calculated value.
  const result = await runWorker(worker);

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