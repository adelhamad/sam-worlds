type IconName = 'stages' | 'help' | 'sound' | 'mute' | 'kick' | 'grab' | 'move' | 'delete' | 'characters' | 'objects' | 'glasses' | 'slow' | 'pause' | 'play' | 'reset' | 'party' | 'check' | 'arrow' | 'close' | 'ball' | 'crate' | 'spikes' | 'bumper' | 'launchpad';

const paths: Record<IconName, string> = {
  stages: 'M4 4h16v16H4z M8 8h3v3H8z M14 8h3v3h-3z M8 14h3v3H8z M14 14h3v3h-3z',
  help: 'M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-1.1.9-1.6 1.4-1.6 2.6 M12 17h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  sound: 'M4 9v6h4l5 4V5L8 9H4Z M17 8a6 6 0 0 1 0 8 M19 5a10 10 0 0 1 0 14',
  mute: 'M4 9v6h4l5 4V5L8 9H4Z M17 9l5 6 M22 9l-5 6',
  kick: 'M13 2 5 13h6l-1 9 9-12h-6l1-8Z',
  grab: 'M8 13V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 4-3 7-7 7h-2c-2 0-3-1-4-3l-3-5a1.5 1.5 0 0 1 2.5-1.5L8 13Z',
  move: 'M12 2v20 M2 12h20 M12 2 9 5 M12 2l3 3 M22 12l-3-3 M22 12l-3 3 M12 22l-3-3 M12 22l3-3 M2 12l3-3 M2 12l3 3',
  delete: 'M4 7h16 M9 7V4h6v3 M6 7l1 14h10l1-14 M10 11v6 M14 11v6',
  characters: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21v-3c0-3 3-5 8-5s8 2 8 5v3H4Z',
  objects: 'M3 7 12 3l9 4v10l-9 4-9-4V7Z M3 7l9 4 9-4 M12 11v10',
  glasses: 'M2 10h3 M19 10h3 M11 11h2 M5 9h6v6H5z M13 9h6v6h-6z',
  slow: 'M12 8v5l3 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  pause: 'M7 4h4v16H7z M15 4h4v16h-4z',
  play: 'M7 4v16l13-8L7 4Z',
  reset: 'M4 11a8 8 0 1 1 2 6 M4 4v7h7',
  party: 'M4 20 10 7l7 7L4 20Z M14 3v3 M20 7l-2 2 M19 17h3 M5 3l2 2 M14 18l1 3',
  check: 'M4 12l5 5L20 6',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  close: 'M5 5l14 14 M19 5 5 19',
  ball: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M4 8c4-1 8 1 10 5 M17 4c-2 4-2 8 1 12',
  crate: 'M3 5h18v16H3z M3 9h18 M8 5v16 M16 5v16',
  spikes: 'M2 20 7 5l5 15L17 5l5 15H2Z',
  bumper: 'M4 14h16v5H4z M6 14V9h12v5 M8 9V6h8v3',
  launchpad: 'M3 18h18v3H3z M6 14h12v4H6z M12 11V2 M8 6l4-4 4 4',
};

export function RagdollIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
