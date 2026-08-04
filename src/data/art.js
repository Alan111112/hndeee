// Every image in src/assets, resolved by filename at runtime.
//
// A plain `import` of a file that doesn't exist yet fails the Vite build, which
// would make it impossible to reference art before it's drawn. Globbing instead
// means a missing file is simply absent from the map (callers fall back to a
// labeled placeholder), and dropping the real file into src/assets picks it up
// automatically — hashed and bundled — with no code change.
const files = import.meta.glob('../assets/*.{png,jpg,jpeg,webp,gif,svg}', {
  eager: true,
  import: 'default',
});

/** Resolve `name` (e.g. 'bedroom.png') from src/assets, or undefined. */
export function art(name) {
  return name ? files[`../assets/${name}`] : undefined;
}

// Music and sound effects, globbed for the same reason: a scene can name a
// track before the file exists, and until it's dropped in the scene simply
// plays silent. The pattern is case-sensitive and phones hand back .MP3 as
// often as .mp3, so both spellings of every extension are listed.
const tracks = import.meta.glob('../assets/*.{mp3,MP3,ogg,OGG,m4a,M4A,wav,WAV}', {
  eager: true,
  import: 'default',
});

/** Resolve a track name (e.g. 'carSong.mp3') from src/assets, or undefined. */
export function audio(name) {
  return name ? tracks[`../assets/${name}`] : undefined;
}
