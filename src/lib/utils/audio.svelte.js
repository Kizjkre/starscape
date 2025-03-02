import points from '$lib/state/points.svelte.js';
import position from '$lib/state/position.svelte.js';
import { onMount } from 'svelte';
import star from '$lib/assets/star.wav?url';

let ResonanceAudio = $state(null);
export const init = () => onMount(async () => ResonanceAudio = (await import('resonance-audio')).ResonanceAudio);

let ctx = $state(null);
let gain = $state(null);
let scene = $state(null);
let initialized = false;
const sources = $state([]);

const factor = 10000;

$effect.root(() => {
  $effect(async () => {
    if (!points.p || !position.p || !ctx || !scene) return;

    if (!initialized) {
      initialized = true;
      const buffer = await (await fetch(star)).arrayBuffer();
      const sample = await ctx.decodeAudioData(buffer);
      points.p.forEach(({ x, y, z }, i) => {
        const source = scene.createSource();
        source.setPosition(x, y, z);
        sources.push(source);

        const node = new AudioBufferSourceNode(ctx, { buffer: sample });
        node.loop = true;
        node.connect(source.input);
        node.start(Math.random() * 10 + i);
      });

      gain.gain.value = 1 / sources.length;
    }

    points.p.forEach(({ x, y, z }, i) => {
      sources[i]?.setPosition(factor * x, factor * y, factor * z);
    });

    scene.setListenerFromMatrix(position.p);
  });

  $effect(() => {
    if (!ResonanceAudio) return;

    ctx = new AudioContext();
    gain = new GainNode(ctx);
    scene = new ResonanceAudio(ctx);

    if (ctx.destination.maxChannelCount > 2) {
      ctx.destination.channelCountMode = 'max';
      ctx.destination.channelCount = 16;
      scene.ambisonicOutput.channelCount = 16;
    }

    scene.output.connect(ctx.destination, {
      ambisonicOrder: 3
    });

    const dimensions = {
      width: 1000,
      height: 1000,
      depth: 1000
    };

    const material = {
      left: 'transparent',
      right: 'transparent',
      up: 'transparent',
      down: 'transparent',
      front: 'transparent',
      back: 'transparent'
    };

    scene.setRoomProperties(dimensions, material);
    scene.setListenerPosition(0, 15, 0);
    scene[ctx.destination.maxChannelCount <= 2 ? 'output' : 'ambisonicOutput'].connect(ctx.destination);
  });
});
