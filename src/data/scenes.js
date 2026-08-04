// ---------------------------------------------------------------------------
// ALL SCENE TEXT LIVES HERE. Edit freely — nothing else needs to change.
//
// The story is told from HER point of view: every narration line is her inner
// voice, and in a text exchange she is `me` (right side) and the boy is
// `him` (left side).
//
//   'plain string'   -> her narration / inner voice
//   me('...')        -> her text message   (bubble, right side)
//   him('...')       -> his text message   (bubble, left side)
//   calendarBeat()   -> the one-shot "a year went by" montage
//
// Wrap any line containing an apostrophe in "double quotes" — "don't", not
// 'don't', which ends the string early and breaks the build.
//
// A scene is { id, background, lines }. `background` is a filename in
// src/assets — it renders a labeled placeholder until the real art is dropped
// in, so the game always runs.
// ---------------------------------------------------------------------------

export const me = (text) => ({ type: 'me', text });
export const them = (text) => ({ type: 'them', text });
export const him = them; // this story's "other person"

/**
 * Two (or more) reply buttons. Each option is { label, reply } — `label` is the
 * button text, `reply` is the message she sends after picking it, which lands
 * in the conversation as her bubble. Omit `reply` to just carry on.
 */
export const choice = (options) => ({ type: 'choice', options });

/** "N hours later" card — the clock hands sweep forward, then it continues. */
export const clockBeat = (opts = {}) => ({
  type: 'clock',
  hours: 3,
  from: '15:00',
  label: '3 HOURS LATER',
  ms: 2200,
  ...opts,
});

/** Rips the day number from `from` to `to` over `ms`, holds, then continues. */
export const calendarBeat = (opts = {}) => ({
  type: 'calendar',
  from: 1,
  to: 365,
  ms: 2100,
  ...opts,
});

/** Strings are shorthand for narration; objects pass through. */
export function normalizeLine(line) {
  if (typeof line === 'string') return { type: 'narration', text: line };
  return { type: 'narration', text: '', ...line };
}

/**
 * Swap the background from this line onward — `bg('phone.png', 'it buzzed')`.
 * It sticks until another bg() line or the next scene, so switch back with a
 * second bg() when the moment is over. Works on any line: narration, me(),
 * him(), a beat, or a choice option's `reply` — wrapping the reply is how a
 * pick swaps the background, since the reply takes the choice line's place.
 */
export const bg = (background, line) => ({
  ...normalizeLine(line),
  bg: background,
});

/**
 * Start a song from this line onward. Resolves exactly like bg(): the most
 * recent song() at or before the current line wins, falling back to the
 * scene's own `music`, and it stops when the scene ends. Use it to time a
 * track to a moment rather than to a whole scene.
 */
export const song = (file, line) => ({
  ...normalizeLine(line),
  music: file,
});

/**
 * Fire a one-shot sound as this line comes up — a door, an engine. Unlike
 * song() it doesn't stick or loop; it plays once and rings out on its own even
 * as she taps on through the next lines, and it stops when the scene ends.
 *
 * Pass `{ ms }` to cut a long recording down to the part you want: it plays for
 * that long, then fades out over 600ms. Without it the file plays to its end,
 * which is only what you want for a clip that's already the right length.
 */
export const sfx = (file, line, { ms } = {}) => ({
  ...normalizeLine(line),
  sfx: { file, ms },
});

/**
 * Something said out loud instead of texted — for the scenes where they're
 * actually together, so his words don't turn up as a text bubble. It types as
 * narration, which is right: this is still her POV, she's quoting him. The
 * quote marks are added for you, so pass the words alone.
 */
export const aloud = (text) => ({ type: 'narration', text: `"${text}"` });

export const scenes = [
  // --- 1. the hallway, her POV ---------------------------------------------
  {
    id: 'hallway',
    title: 'the hallway',
    background: 'hallway.png',
    lines: [
      'axxx gad dayuuuum his so fineee, and i like his style tooo...',
      bg(
        'hallwayHeLooksAtHer.png',
        'ohhh his looking at me, quick ignore ignore like im not looking'
      ),

      clockBeat({ hours: 3, from: '15:00', label: '3 HOURS LATER' }),
    ],
  },

  // --- 2. the bus pulls up --------------------------------------------------
  {
    id: 'bus',
    title: 'the bus',
    background: 'bus.png',
    lines: ['ahhh now school has ended and the bus just arrived'],
  },

  // --- 3. riding home, looking back ------------------------------------------
  {
    id: 'bus-window',
    title: 'the ride home',
    background: 'inBusLookingOutWindow.png',
    lines: ['i will miss my friends and that hot guy too😔'],
  },

  // --- 4. her room: he texts first, then a year goes by ---------------------
  // It's her night, so the camera lives on HER bed shot: every line she narrates
  // or sends is over her art, and it stays on her through some of his messages
  // too — we're watching her read them. It only cuts to his room for the first
  // "heyyy" and for the lines where he says how he feels, then comes straight
  // back to her.
  {
    id: 'bedroom',
    title: 'he texts first',
    background: 'hndrinTextsHim.png',
    speakers: { me: 'Me', them: 'Alan' },
    lines: [
      'almost 2am i should sleep now, but i wanna watch one more episode of kim jong young then sleep',

      // same bed shot, her phone lighting up — and buzzing
      sfx(
        'notification.mp3',
        bg('phoneNotification.png', 'Then my phone buzzed.')
      ),

      // one cut to his room, so we see who it is
      bg('alanTextingHer.png', him('heyyy')),

      bg('hndrinTextsHim.png', 'dayumm i never expected him to send a message'),

      me('heyyy'),
      him('mana to hndrinee'), // still on her — she's the one reading it
      me('balee, soo why you textingg me'),

      bg('alanTextingHer.png', him('idkk i just wanted to know youu moree')),
      him('u just look so pretty and i really like your stylee'),

      // his line stays up while she decides, then her reply cuts back to her
      choice([
        {
          label: 'ohhh thankuuu chavet ta wasa mn dbennn',
          reply: bg('hndrinTextsHim.png', me('ohhh thankuuu chavet ta wasa mn dbennn')),
        },
        {
          label: 'stop ittt im shyyy',
          reply: bg('hndrinTextsHim.png', me('stop ittt im shyyy')),
        },
      ]),

      calendarBeat(),

      bg(
        'hndrinTextsHim.png',
        'A whole year of nights like that. We never stopped talking.'
      ),

      bg(
        'alanTextingHer.png',
        him('sooo. school starts on monday, do you want me to drive you there??')
      ),

      choice([
        {
          label: 'yes please dadddyyy',
          reply: bg('hndrinTextsHim.png', me('yes please dadddyyy')),
        },
        {
          // no `reply` — this one never advances, it just gets smaller
          label: 'no',
          taunts: [
            'cmooon hndrin',
            'you have no choicee',
            'the no button is getting shy',
            'be fr rn',
            'its basically gone now',
            'ok you cant even click it anymore',
          ],
        },
      ]),
    ],
  },

  // --- 5. monday morning: he pulls up outside her house ---------------------
  // One beat, no chatter — the art says the rest.
  {
    id: 'pickup',
    title: 'he pulls up',
    background: 'drivingToHer.png',
    lines: ['finnally he has arrived, and we can talk irl'],
  },

  // --- 6. the car ride — the one she waited a year for ----------------------
  // motion:'driving' rumbles the shot and slides light across it for the whole
  // scene. The sound follows the story instead: the engine turns over as she
  // gets in, and the song only comes up when he actually hands her the music.
  {
    id: 'car',
    title: 'the car ride',
    background: 'weInTheCar.png',
    motion: 'driving',
    // named here so the one thing he says out loud carries his name — it's the
    // only scene where he speaks rather than texts
    speakers: { me: 'Me', them: 'Alan' },
    lines: [
      sfx(
        'carStart.mp3',
        'first day of the new school year and im in HIS car. not the bus. HIS car 💅'
      ),
      'and it smells so goodd in here im gonna passs',

      him('put whatever you want on, i wanna know what you listen too'),

      // She picks the music, so the song starts when she does: each reply
      // carries its own song(), which then plays for the rest of the ride.
      choice([
        {
          label: 'after hours',
          sub: 'the weeknd',
          reply: song(
            'afterHoursSong-theWeekend.MP3',
            me('after hours. obviouslyy 🖤')
          ),
        },
        {
          label: 'house of balloons',
          sub: 'the weeknd',
          reply: song(
            'houseOfBallons-theWeekend.MP3',
            me('house of balloons, trust mee')
          ),
        },
        {
          label: 'too close to stars',
          sub: 'the weeknd',
          reply: song(
            'tooclosetostars.mp3',
            me('too close to stars. this one is myyy song')
          ),
        },
        {
          label: 'M',
          sub: 'anil emre daldal',
          reply: song(
            'M-anilEmreDaldal.MP3',
            me('M. dont judge me its my favouritee')
          ),
        },
      ]),

      // No `ms` here on purpose — the engine runs its full length underneath
      // the rest of the ride instead of being cut to a beat.
      sfx(
        'carAccelerate.mp3',
        bg(
          'lookingAtEachOtherInCar.png',
          'then he turned and looked at meee. right at me. and floored ittt 😳'
        )
      ),
      'and i didnt look away this time. i looked right back at himm',
      'everything outside just went blurryy and i forgot how to breathe',

      bg(
        'HoldingHandsInCar.png',
        'then his hand just... landed on mine. and stayed there'
      ),

      choice([
        {
          label: 'dont move. dont breathe',
          reply: 'i did NOT move. i didnt even breathe. i just let it happenn 🫠',
        },
        {
          label: 'hold it back',
          reply: 'so i held his hand back. and he smiled at the road like an idiott',
        },
        {
          // the joke branch — the only one that swaps the shot, and it lands
          // with the slap itself
          label: 'slap him',
          reply: sfx(
            'slapSoundEffect.MP3',
            bg(
              'slappedalan.png',
              'so i slapped himmm. i dont even know why i did thatt 😭'
            )
          ),
        },
      ]),
    ],
  },

  // --- 7. out of the car, into the new school year -------------------------
  // Arriving IS this scene's first beat: "we pulled up" is the cut to the
  // school, which is also where the driving motion stops — they've parked, so
  // the shot has to stop moving. keepMusic carries the song she picked in the
  // car straight through the cut instead of fading it out at the scene break.
  {
    id: 'school',
    title: 'the new school year',
    background: 'school.png',
    keepMusic: true,
    lines: [
      'we pulled up at school way tooo fast. i wanted that road to be longerr',
      'a whole year of texting him at 2am and now his right here next to mee 🤍',
      'new school year. same hallway, same teachers, same annoying bitches',
      'but at least i see my maaan 💅💅',
    ],
  },
];
