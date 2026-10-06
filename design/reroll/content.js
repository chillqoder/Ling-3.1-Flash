'use strict';

const SECTIONS = [
  {
    id: 'manifesto',
    title: 'MANIFESTO',
    sub: 'why we exist',
    kicker: 'specimen 01 — the idea',
    headline: 'STATIC IS DEAD.',
    size: 1.34,
    html: `
      <p>REROLL is a vibe-coding studio. We prompt, prune and ship AI-native products at the speed of thought — and we'd rather be wrong in an interesting way than right in a boring one.</p>
      <p>This site rerolled its identity the moment you opened it. New palette, new shapes, new mood — same nervous system. That's our thesis in a single gesture: <em>systems over screens, regeneration over templates.</em></p>
      <ul>
        <li><b>Software should feel alive</b> — not load like a form</li>
        <li><b>No templates</b>, no stock layouts, no "just fine"</li>
        <li><b>Every ship is a seed</b>, not a monument</li>
      </ul>`,
  },
  {
    id: 'services',
    title: 'SERVICES',
    sub: 'what we do',
    kicker: 'specimen 02 — capabilities',
    headline: 'WHAT WE <em>DO</em>',
    size: 1.12,
    html: `
      <ul>
        <li><b>0→1 Sprints</b> — bring a hunch, leave with a shipped product in ten days.</li>
        <li><b>Living Websites</b> — sites with generative identities that recompile per visitor.</li>
        <li><b>AI Feature Drops</b> — agents, copilots and quiet magic wired into your product.</li>
        <li><b>Internal Tools, Fast</b> — dashboards and ops panels in days, not quarters.</li>
      </ul>
      <p>If it can be prompted, prototyped and deployed — <em>we build it.</em></p>`,
  },
  {
    id: 'work',
    title: 'WORK',
    sub: 'selected projects',
    kicker: 'specimen 03 — selected work',
    headline: 'ODD JOBS, <em>WELL DONE</em>',
    size: 1.24,
    html: `
      <ul>
        <li><b>NOVA BANK</b> — real-time money movement for 2M accounts; the dashboard hums like a synth.<span class="yr">2025</span></li>
        <li><b>HEX GARDEN</b> — a marketplace where every listing is a living organism; 31k unique storefronts generated.<span class="yr">2024</span></li>
        <li><b>SABLE OS</b> — a writing environment for people who think in fragments.<span class="yr">2024</span></li>
        <li><b>PULSEGRID</b> — energy trading that reads like a symphony; cut analyst response time 64%.<span class="yr">2023</span></li>
        <li><b>MIRE</b> — a horror game that generates its own levels from your heartbeat.<span class="yr">2023</span></li>
      </ul>`,
  },
  {
    id: 'process',
    title: 'PROCESS',
    sub: 'the method',
    kicker: 'specimen 04 — the method',
    headline: 'INGEST. HALLUCINATE. PRUNE. <em>SHIP.</em>',
    size: 1.08,
    html: `
      <ol>
        <li data-n="01"><b>Ingest</b> — we read the room, then politely ruin the brief.</li>
        <li data-n="02"><b>Hallucinate</b> — forty prototypes in four days. Volume is a strategy.</li>
        <li data-n="03"><b>Prune</b> — kill everything that doesn't spark. Ruthless, lovingly.</li>
        <li data-n="04"><b>Ship</b> — deploy, measure, mutate. The work is never done; it keeps vibing.</li>
      </ol>
      <p class="dim">No roadmaps carved in stone. Just a compass and a high tolerance for interesting failures.</p>`,
  },
  {
    id: 'seed',
    title: 'THE SEED',
    sub: 'this site',
    kicker: 'specimen 05 — the seed',
    headline: 'THIS SITE IS A <em>SEED</em>',
    size: 0.9,
    html: `
      <p>Every load rolls a new identity — palette, shapes, typography, pattern, logo — all derived from one 24-bit number. Right now this universe is <code>0xSEED</code>. The seed travels with the URL: share it and someone else gets your exact galaxy.</p>
      <p>The studio works the same way. We don't ship snowflakes; we ship <em>generators</em>.</p>
      <button class="seedcta" type="button">⟳ reroll the universe</button>`,
  },
  {
    id: 'contact',
    title: 'CONTACT',
    sub: 'signal us',
    kicker: 'specimen 06 — signal us',
    headline: 'DROP A <em>BRIEF</em>',
    size: 0.94,
    html: `
      <p>Reykjavík, remote everywhere — we work in your timezone, or invent a new one.</p>
      <div class="brief">
        <input type="text" placeholder="describe your product…" aria-label="describe your product" autocomplete="off">
        <button type="button" aria-label="send brief">⏎</button>
      </div>
      <div class="briefstatus" aria-live="polite"></div>
      <p class="dim">hello@reroll.studio · are.na / github / x — @reroll</p>
      <p class="dim">or just throw a specimen at the wall and see what sticks.</p>`,
  },
];

const LINES = [
  'ship it',
  'weirder.',
  'the grid is a cage',
  'prompt: make me feel something',
  'kill your darlings',
  'volume is a strategy',
  'vibe check: passing',
  'no templates, ever',
  'make it breathe',
  'deploy, mutate, repeat',
  'that spark? keep it.',
  'fifty prototypes, four days',
];
