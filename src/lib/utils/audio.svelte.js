import points from '$lib/state/points.svelte.js';
import position from '$lib/state/position.svelte.js';
import { onMount } from 'svelte';
import star from '$lib/assets/sounds/star.wav?url';
import bg1 from '$lib/assets/sounds/bg1.wav?url';
import bg2 from '$lib/assets/sounds/bg2.wav?url';
import bg3 from '$lib/assets/sounds/bg3.wav?url';
import bg4 from '$lib/assets/sounds/bg4.wav?url';
import bg5 from '$lib/assets/sounds/bg5.wav?url';
import bg6 from '$lib/assets/sounds/bg6.wav?url';
import bg7 from '$lib/assets/sounds/bg7.wav?url';
import bg8 from '$lib/assets/sounds/bg8.wav?url';
import bg9 from '$lib/assets/sounds/bg9.wav?url';

let ResonanceAudio = $state(null);
export const init = () => onMount(async () => ResonanceAudio = (await import('resonance-audio')).ResonanceAudio);

let ctx = $state(null);
let gain = $state(null);
let scene = $state(null);
let initialized = false;
const sources = $state([]);

const bgs = [bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9];
const buffers = [];

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

      gain.gain.value = 30 / sources.length;
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
    scene = new ResonanceAudio(ctx, { ambisonicOrder: 3 });

    if (ctx.destination.maxChannelCount > 2) {
      ctx.destination.channelCountMode = 'max';
      ctx.destination.channelCount = 16;
      scene.ambisonicOutput.channelCount = 16;
    }

    scene.output.connect(ctx.destination);

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

  $effect(async () => {
    if (!ResonanceAudio || !ctx) return;

    bgs.map(async bg => {
      const buffer = await (await fetch(bg)).arrayBuffer();
      buffers.push(await ctx.decodeAudioData(buffer));
    });

    await play(scene, Math.floor(Math.random() * bgs.length));
  });
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const play = async (scene, i) => {
  const source = scene.createSource();

  const node = new AudioBufferSourceNode(ctx, { buffer: buffers[i] });
  node.connect(source.input);
  node.start();

  let start = true;
  let x = Math.random() * 20;
  let y = 15 + Math.random() * 20 - 10;
  let z = Math.random() * 20;

  const walk = () => {
    x += 2 * Math.random() - 1;
    y += 2 * Math.random() - 1;
    z += 2 * Math.random() - 1;
    source.setPosition(x, y, z);
    start && requestAnimationFrame(walk);
  };

  walk();

  await sleep(8000 + Math.random() * 8000);

  start = false;

  await play(scene, Math.floor(Math.random() * bgs.length));
};
