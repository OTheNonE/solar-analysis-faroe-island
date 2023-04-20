
<script lang="ts">
  // Imports:
  import { system } from 'src/lib/Stores';
  import type { Sun, Pos, Ridge, ChartTypes } from 'src/lib/Stores';
  import { chartTypes } from 'src/lib/Stores';
  import { chartF } from './Functions/Chart';
  import { updateColorOfLayer } from './Functions/MapLayers';

  // Variables:
  let locations: Ridge[] = [];
  let selected_ridges: Ridge[] = [];
  let noneSelect: 'none' | Ridge = 'none';
  let chartType: ChartTypes = "Hillshade";

  $system.chart.sun = {
    dataset: chartF.createDataset('Sun', "#ffff00"),
    show: false,
    color: "#ffff00",
    date: "2022-01-01"
  }
  let sun = $system.chart.sun;
  chartF.updateSunDataset(sun.dataset, new Date(sun.date))

  
  // Dynamically updated:
  $: sun = $system.chart.sun;
  $: $system.chart.chartType = chartType
  $: $system.chart.selected = selected_ridges;
  $: locations = $system.stored.ridges;

  // Functions:
  function sunSwitch() {
    if (sun.show) {
      chartF.removeDataset(sun.dataset)
      sun.show = false
    } else {
      chartF.addDataset(sun.dataset)
      sun.show = true
    }
  }

  function addLocation(location: Ridge) {
    noneSelect = 'none';
    selected_ridges = [...selected_ridges, location]

    let dataset = location.datasets.find(x => x.type == chartType)

    if (dataset.updated == false) {
      chartF.updateDataset(dataset, {
        points: location.points
      })
    }

    chartF.addDataset(dataset.dataset)
  }

  function removeLocation(index: number) {
    let removed_location = selected_ridges.splice(index, 1)[0]
    selected_ridges = selected_ridges;

    let dataset = removed_location.datasets.find(x => x.type == chartType)
    chartF.removeDataset(dataset.dataset)
  }

  // function townSelected(town: Ridge, item?: Ridge) {
  //   for (let o of selected) {
  //     if (town.label == o.label && item == undefined) {
  //       return true
  //     } else if (town.label == o.label && town.label != item.label) {
  //       return true
  //     }
  //   }
  //   return false
  // }

  function townSelected(location: Ridge) {
    for (let o of selected_ridges) {
      if (location.label == o.label) {
        return true
      }
    }
    return false
  }

</script>

<div class='settings'>

  <header> Chart Type </header>

  <select bind:value={chartType} on:change={chartF.changeChartType}>
    {#each chartTypes as chartType}
    <option value={chartType}> {chartType} </option>
    {/each}
  </select>

  <br>
  
  <header> Locations </header>

  <div class="select">

    <button class="showSun" on:click={sunSwitch}> 
      {sun.show ? 'Hide' : 'Show'} sun
    </button>

    <input class="colorpicker" type="color" 
    bind:value={sun.color}
    on:change={() => chartF.changeChartColor(sun.dataset, sun.color)}/>

    {#each selected_ridges as item, index}

    <button on:click={() => {removeLocation(index)}}> Remove </button>

    <div class="name"> {item.label} </div>

    <!-- on:change riggar ikki pga okkurt við {#each} -->
    <!-- <select disabled={selected.length == towns.length} 
    bind:value={item}
    on:change={() => chartF.updateDatasets(selected.map(a => a.dataset))}>
      {#each towns as town} {#if !townSelected(town, item)}
      <option value={town}> {town.name} </option>
      {/if} {/each}
    </select> -->

    <input class="colorpicker" type="color"
    bind:value={item.color}
    on:change={() => {
      item.datasets.forEach(dataset => {
        chartF.changeChartColor(dataset.dataset, item.color)
      })
      updateColorOfLayer(item.polyline.onMap, item.color)
    }}/>

    {/each}
    
    <button class="placeholder"> Remove </button>
  
    <!-- {#key selected} Hesin blokkurin virkar áðrenn ein bygd verður vald... -->

    <select disabled={selected_ridges.length == locations.length} 
    bind:value={noneSelect}
    on:change={() => {addLocation(noneSelect)}}>
      {#each locations as location} {#if !townSelected(location)}
      <option value={location}> {location.label} </option>
      {/if} {/each}
      <option value='none'> none </option>
    </select>
    <!-- {/key} -->
    
  </div>

  <input type="date" bind:value={sun.date}
  on:change={() => chartF.updateSunDataset(sun.dataset, new Date(sun.date))}>

  <!-- <DateInput bind:value={sun.date}
  on:input={() => chartF.updateSunDataset(sun.dataset, sun.date)}
  format={'yyyy-MM-dd'}/> -->


</div>



<style>

  .name {
    font-size: 8;
  }

  .select {
    display: grid;
    grid-template-columns: min-content auto min-content;
    grid-template-rows: auto;
  }

  .colorpicker {
    height: 100%;
  }

  .showSun {
    grid-column-start: span 2;
    justify-self: stretch;
  }

  .placeholder {
    visibility: hidden;
  }

  .settings {
    width: 100%;
  }

</style>