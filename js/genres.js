// Genre and subgenre library. Progressions are Roman numerals relative to the major scale
// (so a minor-key song is written i, bIII, iv, v, bVI, bVII). Each token is one bar;
// one- and two-chord entries are vamps that get stretched to fill four bars.
globalThis.AP = globalThis.AP || {};
(function (AP) {
  'use strict';

  const split = (s) => s.split('|').map((p) => p.trim().split(/\s+/));
  // S(name, default mode, [tempo low, tempo high], progressions, overrides)
  const S = (name, mode, tempo, progs, o) => Object.assign({ name, mode, tempo, progs: split(progs) }, o || {});
  // mel: 'pent' | 'blues' | 'mode' — the default melody scale. feel: playback pattern.
  const G = (name, d, subs) => Object.assign({ name, subs }, d);

  const BLUES12 = 'I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7 | I7 IV7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7';

  AP.GENRES = [
    G('Pop', { mel: 'pent', feel: 'strum', blurb: 'Hook-first writing over short, repeating four-chord loops.' }, [
      S('Mainstream Pop', 'major', [96, 128], 'I V vi IV | vi IV I V | I vi IV V | IV I V vi | I IV vi V | i bVI bIII bVII | i bVII bVI bVII'),
      S('Synth-pop', 'minor', [104, 130], 'i bVI bIII bVII | i bVII bVI bVII | i iv bVI bVII | vi IV I V | I iii IV V', { feel: 'eighth' }),
      S('Indie Pop', 'major', [92, 132], 'I iii IV V | I IV vi V | IVmaj7 I V vi | I vi ii V | i bIII bVII iv'),
      S('Dance Pop', 'minor', [116, 130], 'i bVI bIII bVII | i iv bVI V | vi IV I V | I V vi IV', { feel: 'eighth' }),
      S('Electropop', 'minor', [100, 128], 'i bVI bVII i | i bIII bVI bVII | IV V vi I | vi IV I V', { feel: 'eighth' }),
      S('K-Pop', 'major', [96, 132], 'IVmaj7 V iii7 vi7 | vi IV I V | ii7 V7 Imaj7 vi7 | IV V vi I | i bVI bIII bVII'),
      S('City Pop', 'major', [96, 120], 'IVmaj7 V7 iii7 vi7 | ii7 V7 Imaj7 vi7 | IVmaj7 iii7 ii7 Imaj7 | Imaj7 vi7 ii7 V7sus4 | i7 iv7 bVII7 bIIImaj7', { mel: 'mode' }),
      S('Dream Pop', 'major', [70, 110], 'Imaj7 IVmaj7 | Imaj7 iii7 IVmaj7 IVmaj7 | I bVII IV I | vi7 IVmaj7 Imaj7 V | i bVI bIII bVII', { feel: 'pad' }),
      S('Bedroom Pop', 'major', [72, 104], 'Imaj7 iii7 vi7 IVmaj7 | IVmaj7 iii7 ii7 Imaj7 | ii7 V7 Imaj7 vi7 | i7 bVImaj7 bIIImaj7 bVII', { feel: 'pad' }),
      S('Power Pop', 'major', [120, 160], 'I IV V IV | I V IV V | I bVII IV I | I vi IV V', { feel: 'eighth' }),
      S('Pop Ballad', 'major', [60, 84], 'I V vi iii IV I IV V | I vi IV V | I iii IV iv | I V vi IV | i bVI bIII bVII | i iv bVII bIII', { feel: 'arp' }),
    ]),

    G('Rock', { mel: 'pent', feel: 'eighth', blurb: 'Riff- and guitar-driven; borrowed ♭VII and ♭III chords are everywhere.' }, [
      S('Classic Rock', 'major', [100, 140], 'I bVII IV I | I IV V IV | I bIII IV I | I IV I V | i bVII bVI bVII | i bVI bVII i'),
      S('Hard Rock', 'minor', [110, 150], 'i bVI bVII i | i bVII bVI V | i5 bIII5 IV5 i5 | i bIII bVII IV | I5 bIII5 IV5 I5 | I bVII IV I'),
      S('Punk Rock', 'major', [160, 200], 'I5 IV5 V5 IV5 | I5 V5 IV5 IV5 | I5 bIII5 bVII5 IV5 | I5 IV5 I5 V5 | i5 bVI5 bVII5 i5'),
      S('Pop Punk', 'major', [150, 190], 'I V vi IV | IV I V vi | I5 V5 vi5 IV5 | vi IV I V | i bVI bIII bVII'),
      S('Grunge', 'minor', [80, 130], 'i5 bIII5 bVII5 IV5 | i bVI bIII bVII | i5 bVI5 bIII5 bVII5 | i bVII bVI bVII | I5 bIII5 IV5 bVI5 | I5 IV5 bIII5 bVI5'),
      S('Alternative Rock', 'major', [96, 140], 'vi IV I V | I V ii IV | I iii vi IV | I bVII IV IV | i bIII bVII IV | i bVI bIII bVII'),
      S('Indie Rock', 'major', [104, 150], 'I IV vi IV | I iii IV IV | vi I IV V | I V IV IV | i bVII IV i | i bIII iv bVI'),
      S('Shoegaze', 'major', [76, 120], 'Imaj7 IVmaj7 | I bVII IV IV | Iadd9 vi7 IVmaj7 IVmaj7 | i bVI bIII bVII | i7 bVImaj7', { feel: 'pad' }),
      S('Post-Rock', 'major', [70, 130], 'vi IV I V | I iii vi IV | IVmaj7 I vi V | Iadd9 IVadd9 | i bVI bIII bVII | i bIII bVI iv', { feel: 'arp' }),
      S('Psychedelic Rock', 'mixolydian', [80, 130], 'I bVII IV I | I II IV I | I bIII bVII IV | I bVII | i IV i IV | i bVII bVI bVII', { mel: 'mode' }),
      S('Progressive Rock', 'minor', [80, 150], 'i bVII bVI V | i bVI iv bVII | i IV bVI bVII | I II bVII I | I bVII bVI bVII', { mel: 'mode' }),
      S('Surf Rock', 'minor', [130, 170], 'i bVII bVI V | i iv V V | i iv i V | I vi IV V | I IV V IV', { mel: 'mode' }),
      S('Southern Rock', 'major', [90, 140], 'I bVII IV I | I IV I V | V IV I I | i bVII bVI bVII', { feel: 'strum' }),
      S('Garage Rock', 'major', [130, 170], 'I IV V IV | I bIII IV I | I IV bVII IV | i bIII iv i | i bVII i bVII'),
    ]),

    G('Metal', { mel: 'mode', feel: 'eighth', blurb: 'Power chords and minor-key riffs; the ♭II and ♭V add menace.' }, [
      S('Heavy Metal', 'minor', [110, 160], 'i5 bVI5 bVII5 i5 | i bVII bVI bVII | i bVI iv V | i5 bVII5 bVI5 V5 | i5 bIII5 bVII5 iv5'),
      S('Thrash Metal', 'phrygian', [160, 210], 'i5 bII5 i5 bV5 | i5 bII5 bIII5 bII5 | i5 bVI5 bVII5 i5 | i5 bV5 iv5 bII5'),
      S('Death Metal', 'phrygian', [160, 220], 'i5 bII5 bV5 iv5 | i5 bII5 i5 bvii5 | i5 bIII5 bII5 i5 | i5 bVI5 bV5 iv5'),
      S('Black Metal', 'minor', [140, 200], 'i bVI iv i | i bVI bIII bVII | i v bVI iv | i bvi i bvi | i bII bvii i', { feel: 'pad' }),
      S('Doom Metal', 'minor', [50, 80], 'i5 bIII5 bII5 i5 | i5 bV5 iv5 i5 | i bVI v i | i5 bVI5 | i5 bII5', { feel: 'strum' }),
      S('Power Metal', 'minor', [140, 190], 'i bVI bVII i | i bVII bVI V | bVI bVII i i | i bVI bIII bVII | I V vi IV | IV V vi vi'),
      S('Progressive Metal', 'minor', [90, 160], 'i bVI bII V | i bVII iv bVI | i5 bV5 bVI5 bII5 | i bIII bVII IV | Imaj7 bVImaj7 bIImaj7 I'),
      S('Metalcore', 'minor', [120, 180], 'i bVI bIII bVII | i5 bVI5 bIII5 bVII5 | bVI bVII i i | i iv bVI V'),
      S('Nu Metal', 'minor', [90, 120], 'i5 bII5 i5 bIII5 | i5 bVI5 i5 bVII5 | i5 bVII5 | i bVI bIII bVII'),
      S('Symphonic Metal', 'harmonic', [110, 160], 'i bVI iv V | i V bVI bIII | i bVII bVI V | i iv V i | i bVI bIII bVII', { feel: 'pad' }),
      S('Djent', 'phrygian', [100, 150], 'i5 bII5 | i5 bVII5 bII5 i5 | i5 bV5 bVI5 bII5 | i5 bIII5 bVII5 bVI5'),
    ]),

    G('Jazz', { mel: 'mode', feel: 'strum', swing: true, blurb: 'Seventh chords, ii–V–I motion and chromatic substitutions.' }, [
      S('Swing & Standards', 'major', [110, 180], 'ii7 V7 Imaj7 Imaj7 | Imaj7 vi7 ii7 V7 | iii7 VI7 ii7 V7 | Imaj7 IV7 iii7 VI7 | iiø7 V7 i7 i7 | i7 iv7 iiø7 V7 | i6 iiø7 V7b9 i6'),
      S('Bebop', 'major', [160, 240], 'Imaj7 VI7 ii7 V7 | iii7 bIII°7 ii7 V7 | ii7 bII7 Imaj7 Imaj7 | Imaj7 #i°7 ii7 V7 | i7 iiø7 V7b9 i7 | i6 bVI7 V7 i6'),
      S('Cool Jazz', 'major', [90, 140], 'Imaj7 IVmaj7 iii7 vi7 | ii7 V7sus4 Imaj7 Imaj7 | Imaj9 bVIImaj7 | i9 iv9 bVII7 bIIImaj7 | i7 bVImaj7 iiø7 V7', { feel: 'pad' }),
      S('Modal Jazz', 'dorian', [110, 170], 'i7 IV7 | i7 ii7 | i9 i9 IV9 i9 | i7 bVIImaj7 | Imaj7 II7 | I7sus4 bVIImaj7', { feel: 'pad' }),
      S('Bossa Nova', 'major', [110, 140], 'Imaj7 Imaj7 II7 II7 ii7 bII7 Imaj7 bII7 | Imaj7 vi7 ii7 V7 | Imaj7 #i°7 ii7 V7 | i7 iiø7 V7 i7 | i9 iv9 bVII7 bIIImaj7', { swing: false, feel: 'arp' }),
      S('Jazz Fusion', 'dorian', [96, 140], 'i9 IV13 | i7 bVImaj7 bVII7sus4 i7 | i11 bVII13 | Imaj7 bIIImaj7 bVImaj7 bIImaj7 | I7sus4 bVIImaj9', { swing: false }),
      S('Latin Jazz', 'minor', [110, 180], 'i7 IV7 i7 IV7 | i bVII bVI V7 | i7 iv7 V7 i7 | ii7 V7 Imaj7 VI7 | Imaj7 bVII7', { swing: false }),
      S('Smooth Jazz', 'major', [80, 110], 'Imaj7 iii7 vi7 ii7 | IVmaj7 iii7 ii7 V7sus4 | Imaj9 vi9 | i9 iv9 bVImaj7 V7 | i7 bVImaj7 bVII7sus4 i7', { swing: false, feel: 'pad' }),
      S('Gypsy Jazz', 'minor', [160, 230], 'i6 i6 iv6 i6 | i6 iiø7 V7 i6 | i6 bVI7 V7 i6 | I6 VI7 ii7 V7 | I6 #i°7 ii7 V7'),
      S('Jazz Ballad', 'major', [56, 76], 'Imaj7 vi7 ii7 V7 | iii7 VI7b9 ii7 V7 | Imaj7 iiø7 V7b9 Imaj7 | i7 iv7 iiø7 V7b9 | i9 bVImaj7 iiø7 V7', { feel: 'pad' }),
    ]),

    G('Blues', { mel: 'blues', feel: 'strum', swing: true, bars: 12, blurb: 'Dominant sevenths on I, IV and V; the 12-bar form is home base.' }, [
      S('Delta Blues', 'major', [70, 110], BLUES12 + ' | I7 IV7 I7 V7 | I7 I7 IV7 I7'),
      S('Chicago Blues', 'major', [90, 130], BLUES12 + ' | I7 IV7 I7 V7 | I9 IV9 I9 V9'),
      S('Texas Blues', 'major', [90, 140], BLUES12 + ' | I7 IV7 I7 V7 | I7 bIII IV7 I7'),
      S('Minor Blues', 'minor', [60, 110], 'i7 i7 i7 i7 iv7 iv7 i7 i7 bVI7 V7 i7 V7 | i7 iv7 i7 i7 iv7 iv7 i7 i7 iiø7 V7 i7 V7 | i7 iv7 i7 V7 | i7 bVI7 V7 i7'),
      S('Jazz Blues', 'major', [100, 170], 'I7 IV7 I7 I7 IV7 #iv°7 I7 VI7 ii7 V7 I7 V7 | I7 VI7 ii7 V7 | I7 IV7 iii7 VI7'),
      S('Blues Rock', 'major', [90, 140], BLUES12 + ' | I7 IV7 I7 V7 | I bIII IV I | I5 bVII5 IV5 I5 | i7 bVII IV i7', { feel: 'eighth', swing: false }),
      S('Boogie-Woogie', 'major', [130, 180], BLUES12 + ' | I6 IV6 I6 V7 | I7 IV7 I7 V7', { feel: 'eighth' }),
      S('Slow Blues', 'major', [48, 68], 'I7 IV7 I7 I7 IV7 IV7 I7 VI7 ii7 V7 I7 V7 | ' + BLUES12 + ' | I7 IV7 I7 V7 | i7 iv7 i7 V7', { feel: 'pad' }),
    ]),

    G('R&B & Soul', { mel: 'pent', feel: 'strum', blurb: 'Rich sevenths and ninths with smooth, stepwise voice leading.' }, [
      S('Classic Soul', 'major', [80, 120], 'I vi IV V | I IV I V | I iii IV V | I ii iii IV | i iv i V7 | i7 iv7 bVII bIIImaj7'),
      S('Motown', 'major', [100, 130], 'I vi ii V | I IV V IV | I iii IV V | I IV ii V | i bVII bVI V'),
      S('Neo-Soul', 'minor', [70, 96], 'i9 iv9 bVImaj7 V7#9 | i7 bVImaj7 bVII7sus4 i7 | i9 bIIImaj9 | ii9 V13 Imaj9 vi9 | IVmaj9 iii7 ii9 Imaj9 | Imaj9 bVII9', { mel: 'mode', feel: 'pad' }),
      S('Contemporary R&B', 'minor', [64, 100], 'i7 bVImaj7 bIIImaj7 bVII | i9 iv9 | i7 iv7 bVImaj7 V7 | IVmaj7 V vi7 iii7 | vi7 ii7 V Imaj7 | IVmaj7 iii7 ii7 Imaj7', { feel: 'pad' }),
      S('Quiet Storm', 'major', [60, 84], 'Imaj7 iii7 vi7 ii7 | IVmaj7 V7sus4 Imaj7 Imaj7 | ii9 V13 Imaj9 Imaj9 | i9 iv9 bVII13 bIIImaj9', { mel: 'mode', feel: 'pad' }),
      S('New Jack Swing', 'minor', [100, 116], 'i7 iv7 | i7 bVII iv7 V7 | i7 bVImaj7 V7#9 i7 | I7 IV7', { swing: true }),
      S('Doo-Wop', 'major', [70, 120], 'I vi IV V | I vi ii V7 | I IV I V7 | i bVI iv V7', { feel: 'arp' }),
    ]),

    G('Funk & Disco', { mel: 'pent', feel: 'strum', blurb: 'Groove over harmony: one- and two-chord vamps with dominant and minor sevenths.' }, [
      S('Classic Funk', 'dorian', [96, 120], 'i7 IV7 | i7 | i9 IV9 i9 IV9 | i7 i7 iv7 i7 | I9 | I7 IV7 | I9 I9 IV9 I9'),
      S('P-Funk', 'dorian', [90, 112], 'i7 IV7 | i9 bVII IV7 i9 | i7 bIII IV7 i7 | I7 bVII IV I7'),
      S('Funk Rock', 'mixolydian', [96, 126], 'I7 bVII IV I7 | I7#9 | I7 IV7 | i7 IV7 | i7 bIII IV i7', { feel: 'eighth' }),
      S('Disco', 'minor', [112, 128], 'i7 iv7 bVII bIIImaj7 | i7 bVII bVImaj7 V7 | i7 v7 iv7 V7 | vi7 ii7 V Imaj7 | Imaj7 iii7 IVmaj7 V', { feel: 'offbeat' }),
      S('Boogie & Electro-Funk', 'minor', [104, 120], 'i9 iv9 | i7 bVImaj7 bVII i7 | i7 iv7 bVImaj7 bVII | IVmaj7 V vi7 vi7', { feel: 'offbeat' }),
      S('Go-Go', 'dorian', [84, 100], 'i7 IV7 | i9 | i7 bVII i7 IV7 | I7 IV7', { swing: true }),
    ]),

    G('Hip-Hop', { mel: 'pent', feel: 'pad', blurb: 'Short loops, often two or four chords, with a sampled or moody colour.' }, [
      S('Boom Bap', 'minor', [84, 98], 'i7 iv7 | i9 bVImaj7 | i7 bVII7 bVImaj7 V7 | i7 iv7 bVII7 bIIImaj7 | ii7 V7 Imaj7 vi7 | Imaj7 vi7', { swing: true }),
      S('Trap', 'minor', [120, 160], 'i bVI | i bII | i bVI iv V | i iv bVI V | i bVI bIII bVII | i bvii bVI V', { mel: 'mode', feel: 'arp' }),
      S('Lo-fi Hip-Hop', 'major', [66, 90], 'ii7 V7 Imaj7 vi7 | IVmaj7 iii7 ii7 Imaj7 | Imaj7 vi7 ii7 V7 | Imaj9 IVmaj9 | i9 iv9 bVImaj7 v7 | i7 bVImaj7 bIIImaj7 iv7', { mel: 'mode', swing: true }),
      S('West Coast & G-Funk', 'minor', [86, 104], 'i7 iv7 i7 V7 | i7 bVII7 | i9 iv9 | i7 bVImaj7 V7 i7 | I7 IV7', { feel: 'strum' }),
      S('Drill', 'minor', [136, 146], 'i bVI v i | i bII bVI v | i bVI | i iv bII i', { mel: 'mode', feel: 'arp' }),
      S('Cloud Rap', 'minor', [60, 80], 'i bIII bVI iv | bVImaj7 bVII i i | i7 bVImaj7 | Imaj7 iii7 | Imaj7 IVmaj7 vi7 IVmaj7'),
      S('Jazz Rap', 'minor', [84, 100], 'i9 iv9 bVII13 bIIImaj9 | iiø7 V7b9 i9 i9 | i7 IV7 | ii9 V13 Imaj9 vi9 | Imaj7 bIIImaj7', { mel: 'mode', swing: true }),
      S('Old School', 'minor', [96, 112], 'i7 iv7 | i7 | i bVII i bVII | I7 IV7', { feel: 'strum' }),
    ]),

    G('Electronic', { mel: 'pent', feel: 'eighth', blurb: 'Loop-based harmony; minor keys and slow-moving chords leave room for sound design.' }, [
      S('House', 'minor', [120, 128], 'i7 bVII bVImaj7 bVII | i7 iv7 bVII bIIImaj7 | i7 v7 bVImaj7 bVII | vi7 IVmaj7 I V | Imaj7 vi7 IVmaj7 V', { feel: 'offbeat' }),
      S('Deep House', 'minor', [116, 124], 'i9 iv9 | i7 bIIImaj7 iv7 bVImaj7 | i9 bVImaj7 bVII6 i9 | ii9 V13 Imaj9 Imaj9 | IVmaj7 iii7 ii7 Imaj7', { mel: 'mode', feel: 'offbeat' }),
      S('Techno', 'minor', [124, 140], 'i | i bII | i bVI | i i i bVI | i iv', { mel: 'mode' }),
      S('Trance', 'minor', [130, 140], 'i bVI bIII bVII | i bVI bVII v | i bVII bVI bVII | bVI bVII i i | vi IV I V | IV V vi I', { feel: 'arp' }),
      S('Dubstep', 'minor', [138, 142], 'i bVI bVII i | i bII i bVI | i bVI iv V | i iv bVI v', { mel: 'mode', feel: 'pad' }),
      S('Drum & Bass', 'minor', [165, 176], 'i bVI bIII bVII | i7 v7 bVImaj7 iv7 | i bVII bVI V | i9 bVImaj7 | IVmaj7 V vi7 vi7', { feel: 'pad' }),
      S('Synthwave', 'minor', [84, 118], 'i bVI bIII bVII | i bVII bVI bVII | bVI bVII i i | i iv bVI bVII | vi IV I V | I iii IV V'),
      S('Ambient', 'major', [56, 90], 'Imaj7 IVmaj7 | Isus2 IVsus2 vi7 IVmaj7 | I Vsus4 IVadd9 I | Iadd9 iii7 | i7 bVImaj7 | i bIII bVII iv', { mel: 'mode', feel: 'pad' }),
      S('Future Bass', 'major', [130, 160], 'IVmaj7 V vi7 iii7 | IVmaj7 V6 vi7 Iadd9 | IVmaj7 iii7 vi7 V | bVImaj7 bVII i7 i7 | i7 bVImaj7 bIIImaj7 bVII', { feel: 'pad' }),
      S('EDM & Big Room', 'minor', [124, 130], 'i bVI bIII bVII | i bVII bVI V | vi IV I V | I V vi IV'),
      S('Downtempo & Chillout', 'minor', [70, 100], 'i9 bVImaj7 | i7 iv7 bVImaj7 bVII | i9 bIIImaj7 iv9 bVII | Imaj7 iii7 IVmaj7 iv6 | Imaj9 IVmaj9', { mel: 'mode', feel: 'pad' }),
      S('UK Garage', 'minor', [128, 136], 'i9 iv9 bVII13 bIIImaj9 | i7 iv7 V7#9 i7 | i9 bVImaj7 | ii9 V13 Imaj9 vi9', { mel: 'mode', swing: true, feel: 'offbeat' }),
      S('Vaporwave', 'major', [60, 90], 'IVmaj7 iii7 ii7 Imaj7 | ii9 V13 Imaj9 Imaj9 | Imaj7 vi7 ii7 V7sus4 | i9 iv9 bVII13 bIIImaj9', { mel: 'mode', feel: 'pad' }),
      S('IDM', 'lydian', [90, 150], 'Imaj7 II | Imaj7 vii7 | Imaj9 bVImaj7 bIIImaj7 II | i9 bII | i7 bVImaj7 bIImaj7 v7', { mel: 'mode', feel: 'arp' }),
    ]),

    G('Country', { mel: 'pent', feel: 'strum', blurb: 'Plain major triads on I, IV and V, telling the story without getting in its way.' }, [
      S('Classic Country', 'major', [80, 130], 'I IV V I | I IV I V | I I IV IV V V I I | I V I IV | i bVII bVI V'),
      S('Honky-Tonk', 'major', [100, 150], 'I I7 IV I | I IV V7 I | I IV I V7 | I II7 V7 I', { swing: true }),
      S('Outlaw Country', 'major', [90, 130], 'I bVII IV I | I IV I V | I V IV I | i bVII i bVII | i bIII bVII i'),
      S('Bluegrass', 'major', [120, 170], 'I IV I V | I IV V IV | I V I IV I V I I | I bVII I V | i bVII i V', { feel: 'eighth' }),
      S('Country Pop', 'major', [84, 130], 'I V vi IV | I IV vi V | IV I V vi | vi IV I V | i bVI bIII bVII'),
      S('Americana', 'major', [76, 120], 'I vi IV I | vi IV I V | I iii IV I | I IV vi V | i bVII IV i | i bIII bVII i'),
      S('Western Swing', 'major', [120, 180], 'I6 VI7 II7 V7 | I6 I7 IV6 #iv°7 | I6 IV6 I6 V7 | i6 iv6 V7 i6', { swing: true, mel: 'mode' }),
      S('Country Rock', 'major', [100, 140], 'I bVII IV I | I IV V IV | I V IV IV | i bVII bVI bVII', { feel: 'eighth' }),
    ]),

    G('Folk & Acoustic', { mel: 'pent', feel: 'arp', blurb: 'Open, diatonic chords; modal colours in the traditional styles.' }, [
      S('Traditional Folk', 'major', [80, 130], 'I IV I V | I V vi IV | I IV V I | i bVII i bVII | i bIII bVII i', { feel: 'strum' }),
      S('Indie Folk', 'major', [70, 120], 'I iii IV I | vi IV I I | Iadd9 vi7 IVmaj7 V | I V IV IV | i bVI bIII bVII | i bIII bVII iv'),
      S('Singer-Songwriter', 'major', [68, 120], 'I V vi IV | I iii vi IV | vi V IV V | I IV vi V | i bVII bVI bVII | i iv bVI bVII'),
      S('Celtic', 'dorian', [90, 150], 'i bVII i bVII | i bVII bIII bVII | i IV bVII i | i bIII bVII IV | I bVII I bVII | I IV I bVII', { mel: 'mode', feel: 'strum' }),
      S('Folk Rock', 'major', [96, 136], 'I bVII IV I | I IV V IV | I vi IV V | i bVII IV i | i bVII bVI bVII', { feel: 'strum' }),
      S('Fingerstyle', 'major', [70, 110], 'Iadd9 Vsus4 vi7 IVmaj7 | Imaj7 IVmaj7 | I iii IV V | i7 bVImaj7 bIIImaj7 bVII | i iv bVII bIII'),
    ]),

    G('Latin', { mel: 'mode', feel: 'strum', blurb: 'Tonic–dominant drive and the Andalusian cadence; rhythm carries the style.' }, [
      S('Salsa', 'minor', [160, 210], 'i iv V7 i | i7 iv7 V7 i7 | i bVII bVI V7 | I IV V IV | ii7 V7 I I'),
      S('Reggaeton', 'minor', [88, 100], 'i bVI bIII bVII | i bVI iv V | i iv bVII V | i bVII bVI V | vi IV I V', { feel: 'offbeat' }),
      S('Samba', 'major', [90, 110], 'Imaj7 VI7 ii7 V7 | I6 #i°7 ii7 V7 | Imaj7 IV7 iii7 VI7 | i7 iiø7 V7 i7', { feel: 'arp' }),
      S('Bachata', 'minor', [120, 140], 'i bVII bVI V | i iv V7 i | i iv bVII bIII | I V vi IV | I IV V IV', { feel: 'arp' }),
      S('Tango', 'harmonic', [110, 130], 'i iv V7 i | i iiø7 V7 i | i bVI iv V7 | i V7 i iv'),
      S('Flamenco', 'phrygdom', [90, 180], 'I bII I bII | iv bIII bII I | I bII bIII bII | I bvii bII I | i bVII bVI V'),
      S('Cumbia', 'minor', [80, 110], 'i V7 | i iv V7 i | i bVII bVI V7 | I V7 | I IV V7 I', { feel: 'offbeat' }),
      S('Mariachi & Ranchera', 'major', [90, 160], 'I V7 V7 I | I IV V7 I | I I7 IV V7 | i iv V7 i'),
      S('Latin Pop', 'minor', [90, 128], 'i bVI bIII bVII | i iv V7 i | i bVII bVI V | vi IV I V | I V vi IV'),
      S('Bolero', 'minor', [60, 96], 'i iv V7 i | i7 iv7 bVII7 bIIImaj7 | i bVI iiø7 V7 | Imaj7 vi7 ii7 V7', { feel: 'arp' }),
    ]),

    G('Reggae & Caribbean', { mel: 'pent', feel: 'offbeat', blurb: 'Two-chord vamps with the chords on the offbeat and the bass up front.' }, [
      S('Roots Reggae', 'minor', [60, 90], 'i bVII | i iv | i iv i bVII | i bVI bVII i | I IV | I ii | I V vi IV'),
      S('Ska', 'major', [110, 170], 'I IV V IV | I vi IV V | I IV I V | i bVII bVI V'),
      S('Rocksteady', 'major', [70, 100], 'I vi IV V | I ii | I IV | I IV V IV | i iv bVII i'),
      S('Dub', 'minor', [60, 90], 'i iv | i bVII | i7 iv7 | i v | I IV'),
      S('Dancehall', 'minor', [90, 110], 'i bVI | i bVII bVI bVII | i iv bVI V | I IV V IV'),
      S('Calypso & Soca', 'major', [110, 160], 'I IV V I | I V V I | I IV I V | I vi ii V | i iv V7 i', { feel: 'strum' }),
    ]),

    G('Classical & Cinematic', { mel: 'mode', feel: 'arp', blurb: 'Functional harmony and strong cadences, or big modal shifts for the screen.' }, [
      S('Baroque', 'minor', [70, 120], 'i iv bVII bIII bVI iiø7 V i | i V i iv | i iv V i | I V vi iii IV I IV V | I IV V I'),
      S('Classical Era', 'major', [80, 140], 'I IV V7 I | I vi ii V7 | I V7 I IV | I ii V7 I | i iv V7 i | i iiø7 V7 i'),
      S('Romantic', 'minor', [56, 100], 'i bVI iv V7 | i bII V7 i | i iv bVII bIII | I iii IV iv | I vi IV iv | I III7 vi IV'),
      S('Film Score', 'minor', [60, 110], 'i bVI bIII bVII | i bVI iv V | i bVI | i bIII bVI iv | I bVI bVII I | I v IV I | I iii IV iv', { feel: 'pad' }),
      S('Epic & Trailer', 'minor', [80, 140], 'i bVI bIII bVII | i bVII bVI bVII | bVI bVII i i | i v bVI iv | I V vi IV', { feel: 'eighth' }),
      S('Minimalist', 'major', [80, 140], 'I vi | vi IV I V | Iadd9 vi7 IVmaj7 I | I iii vi IV | i bVI | i bIII bVII iv'),
      S('Impressionist', 'lydian', [50, 90], 'Imaj7 II | Imaj9 II9 | Imaj7 bIIImaj7 bVImaj7 bIImaj7 | I7sus4 bVIImaj7 | i9 bVImaj7 bIImaj7 i9', { feel: 'pad' }),
      S('Video Game & Chiptune', 'major', [110, 170], 'bVI bVII I I | IV V iii vi | I bVII bVI bVII | I V vi IV | i bVII bVI V | i bVI bVII i'),
    ]),

    G('Gospel & Worship', { mel: 'pent', feel: 'strum', blurb: 'Uplifting major-key movement; gospel adds passing sevenths and diminished chords.' }, [
      S('Contemporary Worship', 'major', [66, 130], 'I V vi IV | IV I V vi | vi IV I V | I IV vi V | Isus4 I IV IV | i bVI bIII bVII', { feel: 'pad' }),
      S('Traditional Gospel', 'major', [70, 130], 'I I7 IV iv | I vi7 ii7 V7 | IV #iv°7 I VI7 | ii7 V7 I IV | I III7 vi7 I7 | i iv i V7', { swing: true, mel: 'blues' }),
      S('Gospel Choir', 'major', [80, 140], 'IVmaj7 V iii7 vi7 | ii7 V7sus4 Imaj7 Imaj7 | I iii7 IVmaj7 V7sus4 | Imaj7 I7 IVmaj7 iv6 | i7 iv7 bVImaj7 V7'),
      S('Hymn', 'major', [60, 100], 'I IV I V | I V vi IV | I IV V I | I vi ii V | i iv V i', { feel: 'pad' }),
      S('Spiritual', 'minor', [60, 110], 'i iv i V7 | i bVII i V7 | i iv bVII bIII | I IV I V', { mel: 'blues' }),
    ]),

    G('World', { mel: 'mode', feel: 'strum', blurb: 'Regional harmonic dialects, from West African guitar loops to Hijaz colour.' }, [
      S('Afrobeats', 'minor', [96, 116], 'i bVI bIII bVII | i bVII bVI bVII | i7 iv7 | vi IV I V | I IV vi V | I V vi IV', { mel: 'pent', feel: 'offbeat' }),
      S('Afrobeat', 'dorian', [100, 130], 'i7 IV7 | i7 | i7 bVII | I7 IV7', { mel: 'pent' }),
      S('Highlife', 'major', [100, 130], 'I IV V IV | I vi IV V | I IV I V | I ii V I', { mel: 'pent', feel: 'arp' }),
      S('Middle Eastern', 'phrygdom', [80, 130], 'I bII | I bvii bII I | I iv bvii I | I bII bIII bII | i bII i bvii', { feel: 'pad' }),
      S('Klezmer', 'phrygdom', [100, 180], 'I iv bvii I | I bII bvii I | I iv I bII | i iv V7 i | i bVI V7 i'),
      S('Indian-Inspired', 'mixolydian', [70, 120], 'I | Isus4 I | I bVII | I v | i bVII | i', { feel: 'pad' }),
      S('J-Pop & Anime', 'major', [100, 170], 'IVmaj7 V iii7 vi7 | IV V vi I | vi IV V I | I V vi iii IV I IV V | i bVI bVII i | bVI bVII i i', { mel: 'pent', feel: 'eighth' }),
      S('Balkan', 'harmonic', [110, 190], 'i V7 | i iv V7 i | i bII V7 i | i bVI V7 i | I bII I bII'),
    ]),
  ];
})(globalThis.AP);
