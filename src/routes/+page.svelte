<script>
  import raw from '$lib/assets/data/hipparcos-voidmain.csv?url';
  import data from '$lib/state/data.svelte.js';
  import { init as initAudio } from '$lib/utils/audio.svelte.js';
  import { init as initGraphics, handleResize, handleLock, handleKeydown, handleKeyup, handleMousemove } from '$lib/utils/graphics.svelte.js';
  import Worker from '$lib/workers/csv.js?worker';
  import { onMount } from 'svelte';

  let div = $state(null);
  let canvas = $state(null);
  onMount(async () => {
    await initAudio();
    canvas = await initGraphics();
    div.innerHTML = '';
    div.appendChild(canvas);
  });

  onMount(() => {
    const worker = new Worker();

    worker.onmessage = event => {
      if (event.data.status === 'success') data.d = event.data.data;
      else console.error(event.data.message);
    };

    worker.postMessage(raw);
  });

//   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  let hidden = $state(false);

  const handleHide = () => hidden = true;
</script>

<svelte:document onclick={handleLock} onkeydown={handleKeydown} onkeyup={handleKeyup} onmousemove={handleMousemove}></svelte:document>
<svelte:window onresize={handleResize}></svelte:window>

<svelte:head>
  <title>starscape</title>
</svelte:head>

<div bind:this={div}></div>

<div class="absolute bg-black/50 flex justify-center h-full items-center left-0 top-0 w-full" class:hidden={hidden} onclick={handleHide} onkeydown={handleHide} role="button" tabindex="-1">
  <div class="flex flex-col gap-4 items-center">
    <h1 class="text-9xl text-white">starscape</h1>
    <h3 class="animate-bounce text-white text-xl">click to start</h3>
  </div>
</div>
