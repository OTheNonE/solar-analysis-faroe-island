
<script>

  // Svelte imports:
  import { onMount } from 'svelte';

  // Library imports:
  import Split from 'split-grid';
  import proj4 from 'proj4';

  // Imports from Stores.svelte:

  // Imports from function typescript files:

  // Components imports:
  import Map from "./lib/Map.svelte";
  import Inputs from "./lib/Inputs.svelte";
  import ChartVisual from './lib/ChartVisual.svelte';

  // Define Faroese projection
  proj4.defs("EPSG:5316","+proj=tmerc +lat_0=0 +lon_0=-7 +k=0.999997 +x_0=200000 +y_0=-6000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

  // Yeaah...
  import * as only_for_compiling2 from 'src/lib/Functions/RidgePopup';
  import CurrentPosition from './lib/CurrentPosition.svelte';

  let rowSplitter //, columnSplitter;

  onMount(() => {
		Split({
			rowGutters: [{
				track: 1,
				element: rowSplitter,
			}],
      
			// columnGutters: [{
			// 	track: 1,
			// 	element: columnSplitter,
			// }],
		})
	});
  
</script>



<div class="root">
	<div class="input">
    <Inputs/>
	</div>
	<div class="map">
    <Map/>
    <CurrentPosition/>
	</div>
	<div class="chart">
    <ChartVisual/>
	</div>

	<div class="row-splitter" bind:this={rowSplitter} />
	<div class="column-splitter"/>
</div>

<style>

  .root {
    display: grid;
    grid-template-areas:
      'top      c-split rights'
      'r-split  c-split rights'
      'bottom   c-split rights';
    grid-template-rows: 1fr 5px 1fr;
    grid-template-columns: auto 5px 300px;
    width: 100vw;
    height: 100vh;
  }

  .input {
    overflow: hidden;
    grid-area: rights;
  }

  .map {
    position: relative;
    overflow: hidden;
    grid-area: top;
  }

  .chart {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    grid-area: bottom;
  }

  .row-splitter {
    grid-area: r-split;
    cursor: row-resize;
    background-color: grey;
  }

  .column-splitter {
    grid-area: c-split;
    background-color: grey;
  }

</style>


