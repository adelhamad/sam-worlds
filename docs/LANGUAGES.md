# Language courses — authoring guide

Two courses live on the home's **Languages** shelf: **Yalla Arabic** (spoken Levantine
Arabic) and **Bonjour French**. Both are *data*: unit files full of phrases and real-life
scenes. The planner (`src/engine/lang/`) turns them into lessons; you never write
questions by hand.

Read this whole page before writing a unit. The worked example is
`src/content/arabic/units/u01.ts`.

## What these courses are for

The owner's brief: apps like Duolingo teach "a few things" that are "not useful in real
life". Sam (7.5) should finish a unit able to **say something to a real person the same
day**. So:

- **Teach what a child says at home**, to Mama, Baba, Teta, Jiddo, cousins, a shopkeeper:
  greetings, asking for things, feelings, play, food at the table, the phone call with
  Teta. Never textbook sentences nobody says ("The boy eats an apple").
- **Whole phrases first.** "biddi mayy" (I want water) is one thing to learn, then it is
  taken apart ("biddi" + "mayy") and rebuilt with other words ("biddi khubz").
- **Every unit has scenes**: a moment in English ("Teta gives you a cookie.") and what
  you say back. This is the heart of the course — write them from real family life.
- **Every unit ends with a real-life mission**: one thing to say to someone at home today.
- **Reuse.** Later phrases are built from earlier words so old words keep coming back.
- Sam is a boy: where the language marks the speaker ("I am tired"), teach the boy's
  form and put the girl's form in the `tip`. Where it marks the *listener* (Arabic
  "kiifak / kiifik"), teach both as a `like` pair.

## Arabic: which Arabic

**Spoken Levantine** (Shaami) — what families in Syria, Lebanon, Palestine and Jordan say
at home — not Modern Standard Arabic. Rules:

- Choose the form understood across the whole Levant; when regions differ, pick the most
  widespread one and mention the other in the `tip` ("Some families say aah.").
  House choices: shu (what), biddi (I want), halla’ (now), mniiH (good), ktiir (very / a
  lot), shway (a little), wein (where), hoon (here), leish (why), eimta (when), miin
  (who), ’addeish (how much), fii / ma fii (there is / there is not), mish (not), kamaan
  (also, more), khalaS (enough, done), yalla (come on), ee (yes) with "aah" as its `like`
  pair, la’ (no).
- Formulas everyone uses in their standard form are welcome: shukran, il-Hamdilla,
  inshalla, SabaaH il-kheir, ma‘ is-salaameh.
- `text` is written the way family would text it in Arabic letters, without vowel marks
  except where a mark is how people really tell two words apart (كيفِك) or a shadda helps
  (بدّي).
- `say` is for the device's voice, which reads Standard Arabic: spell the phrase **as it
  sounds**, with vowel marks, so the voice lands close to the dialect — e.g. `text: "هلّق"`,
  `say: "هَلَّأ"`; `text: "منيح"`, `say: "مْنيح"`. Give `say` whenever the plain text would
  be read wrongly; leave it out when it reads fine.

### How Arabic sounds are written in Latin letters (`roman`)

A 7-year-old English reader must be able to sound it out roughly; the voice does the rest.
No digits (no 3, 7, 2).

| Sound | Write | Example |
|---|---|---|
| short vowels | a e i o u | marHaba, mish |
| long vowels | aa ee ii oo | baaba, mniiH, ktiir, yoom |
| "ay" as in day | ei | wein, beit, ahlein |
| ء, and ق when said as a tiny stop | ’ | la’, halla’, ’ahweh |
| ع | ‘ | ‘ammo, ma‘ |
| ح | H | marHaba, SabaaH |
| خ / غ | kh / gh | khubz, ghurfeh |
| ش / ج | sh / j | shu, jiddo |
| ص ض ط ظ (heavy) | S D T Z | SabaaH, tfaDDal, Tayyib |
| ث ذ as people say them | t / s, d / z | tlaateh, haada |
| doubled letter (shadda) | double it | biddi, yalla, halla’ |
| the "the" | il- (or is-, ish-… when it melts) | il-beit, is-salaameh |
| final ة | -eh, or -a after H kh gh ‘ S D T Z r | madraseh, ghurfa… pick one and stay with it |

Capital letters are only ever H S D T Z; everything else is lower-case, also at the
start of a phrase. Keep the same spelling for the same word everywhere.

## French

Everyday spoken French for a child: tutoiement with family and friends ("tu"), "vous"
only where a child would really use it (a shopkeeper, a teacher) and say so in the `tip`.
Sam finished the first Duolingo section, so start from real use, not from zero: whole
useful phrases from unit 1. `text` carries correct accents and French spacing before
? and ! is NOT used (write "Ça va?" — the audit and the tiles are simpler that way).
No `roman`. `say` is rarely needed.

## A unit file

One file per unit: `src/content/<arabic|french>/units/uNN.ts`, exporting one
`LangUnitPack` (types in `src/content/langCourse.ts` and `src/engine/lang/types.ts` — read
them, every field is documented). Register it in the course file's `packs` list, in order.

```ts
export const U05: LangUnitPack = {
  unit: { name, icon, hue, blurb, souvenir, lessons: [...] },
  phrases: [...],   // every phrase this unit teaches
  scenes: [...],    // every scene this unit uses
};
```

**Four lessons per unit, always in this shape:**

| # | kind | What it holds |
|---|---|---|
| 1 | `words` | `teach`: 4 new phrases (3–5) |
| 2 | `words` | `teach`: 4 more |
| 3 | `talk` | `teach`: 2–4 phrases that are short SENTENCES built from the unit's words (each with `words`), and `scenes`: 5–7 real-life moments |
| 4 | `letters` | Arabic units 1–14: the unit's two `letters` and 1–3 `spell` words. Arabic units 15+ and all French units: `spell`: 4–6 single words from this unit (Arabic also `letters`: three earlier letters to write again). Always a `mission`. |

About 11 phrases and 5–7 scenes per unit.

### Phrases

- `id`: kebab-case Latin, unique in the whole course, permanent. Use the roman spelling
  without capitals or marks: `marhaba`, `biddi-mayy`.
- `en`: the meaning in ≤ 6 simple words a 7-year-old knows. Two phrases must never have
  the same `en` unless they are a `like` pair.
- `like`: **this is how wrong answers stay fair.** The planner offers other phrases as the
  "other options". List in `like` every phrase that means (almost) the same or would be
  an equally fine answer wherever this one is the answer — and list it both ways. Ask
  yourself for every phrase: "if this were the right answer, which other phrase of the
  course could a fair person also accept?"
- `topic`: a loose group (`"greeting"`, `"family"`, `"food"`, `"feeling"`, `"number"`,
  `"place"`, `"action"`, `"polite"`, `"time"`, `"thing"`…). Other options are drawn from
  the same topic first, so use a handful of topics consistently.
- `words`: for every phrase of 2–5 words, the words in speaking order (Arabic: each with
  its `roman`). They must spell the `text` exactly (punctuation aside). This is what
  "build the sentence" uses — sentences in lesson 3 MUST have it.
- `art`: only an icon name from `src/content/iconNames.ts`, only when it truly shows the
  thing (water → `cup`, apple → `apple`). Most phrases have none. **Never an emoji** —
  not in any string, anywhere.
- `tip`: ≤ 14 simple words; shown when the phrase is taught and when it is missed. Use it
  for the girl's form, a regional variant, when to say it, or how to answer it. Never
  the words "wrong", "fail" or "bad".

### Scenes

```ts
{ id: "teta-cookie", setup: "Teta gives you a cookie.", who: { name: "Teta" },
  reply: ["yislamo", "shukran"], alsoOk: ["shukran-teta"] }
{ id: "teta-asks", setup: "Teta smiles and asks you.", who: { name: "Teta" },
  line: "kiifak", reply: ["mniih", "hamdilla"] }
```

- `setup`: ≤ 14 simple English words, a moment a child knows. `who` when someone is there.
- `line`: what they say to you (a phrase id) — it is shown and spoken.
- `reply`: the right things to say; the first is the model answer.
- `alsoOk`: **every other phrase taught so far that would also be acceptable there** — be
  generous; anything listed is never used as a wrong option. A scene whose wrong options
  could be argued right is the worst bug this course can have.
- A scene may only use phrases taught in this lesson or earlier (the audit checks).
- Vary the people (Mama, Baba, Teta, Jiddo, a cousin, a friend, a shopkeeper) and places.

### The unit itself

`icon` / `souvenir.icon`: `iconRef("<name>")` from `src/content/iconNames.ts`. `hue`: a
bright colour that is not cyan (`#22d3ee` is reserved). `blurb` ≤ 8 words. Lesson `name`
≤ 22 characters. `mission` ≤ 16 words, something to SAY to a real person today, quoting
the phrase in its roman / French form.

## How it is spoken

1. **The device's best voice.** `rankedVoices(lang)` in `src/engine/feedback/speech.ts`
   ranks the installed voices with the pure `src/engine/feedback/voiceRank.ts`: natural
   before novelty (Apple's Eddy, Grandma, Zarvox… are listed explicitly), premium before
   enhanced before default, on-device before network, then the locale (ar-SA, ar-001,
   ar-AE, ar-EG; fr-FR, fr-CA, fr-BE, fr-CH). The parent can choose another voice and a
   slower speed. No device has a Levantine voice: the Arabic one reads Standard Arabic,
   so each phrase's `say` only approximates the dialect.
2. **The parent's own recording wins.** When a phrase (or a letter's name) has been
   recorded, lessons play that clip instead (`useVoice` → `src/engine/feedback/clips.ts`);
   "slowly" plays it at 0.75 speed with the pitch kept. Without a clip and without a
   device voice, the lesson shows the words.
3. **Where the parent records:** Parent Section → **Voices** (`/parent/voices`, same
   password): per unit, record / play / delete each phrase, or "Record them in a row";
   letters have their own group. Keys: `ar:<phraseId>`, `ar:letter:<letterId>`
   (`src/engine/feedback/clipKeys.ts`) — so **never rename a phrase or letter id**, or
   its recording is orphaned.
4. **Clips live only in IndexedDB on that device** (table `voiceClips`, db version 3).
   They are not in the localStorage safety mirror (too big), are not synced to another
   device, and a progress reset never clears them; only the Voices page deletes them.

5. **Speaking practice** (Parent Section → Voices → "Speaking practice", SettingsRow
   `speakPractice`, **off by default**). When on, each opening slide gets a round mic
   button once the phrase has been heard: the child taps, says it (tap to stop, or it
   stops by itself after 4 s), then hears the model (the parent's clip, else the device
   voice) and then his own take, back to back; Pogo is always glad. Once per lesson, about
   a third of the way in, a speaking break (an interlude like the gift — never judged,
   pays nothing) asks for one of the lesson's phrases. **His takes are never stored**:
   memory only, object URL revoked when the slide or break ends. One mic stream per
   lesson, asked for on the child's first tap and released when the lesson screen closes.
   If the mic is refused or missing, lessons silently look as with the switch off and the
   Voices page says why. Code: `src/engine/feedback/speakBack.ts`, `recorder.ts`,
   `src/modules/tour/lang/useSpeakTurn.ts`, `SpeakTurn.tsx`, `SpeakBreak.tsx`.

`scripts/audit-voices.ts` checks the ranking on fixture voice lists and that every phrase
and letter of every course has a clip key that round-trips.

## Check your work

```
bun scripts/audit-lang.ts arabic     # or: french
bunx tsc --noEmit -p .
bunx eslint src/content/<arabic|french>
```

The audit checks every rule above and then plans every lesson dozens of times and checks
every question (options that could also be right, phrases never shown, scenes without
enough fair options…). Fix what it reports — but it cannot know the language: **it does
not catch a wrong translation, an unnatural phrase, a bad `say`, or a missing `like` /
`alsoOk`.** Those are on you. Read each finished unit once more as a native speaker
would, and once more as a 7-year-old.

ESLint caps files at 500 lines: one unit per file stays well under it.

## Syllabus — Yalla Arabic (24 units)

The meanings listed are the unit's core; word them as a Levantine family would. Do not
teach another unit's core words early. Letters are fixed: two per unit, in alphabet order.

| # | Unit | Core | Letters |
|---|---|---|---|
| 1 | Hello! | hello, hi, Mom, Dad, how are you (to a boy / girl), fine, thank God, goodbye | ا ب |
| 2 | Me and You | I, you (boy / girl), what's your name, my name is…, how old are you, I am seven, where are you from, boy, girl | ت ث |
| 3 | Magic Words | yes (ee / aah), no, thank you (shukran, yislamo), you're welcome, please (to a man / woman), here you go (tfaDDal), sorry, never mind (ma‘lesh), excuse me | ج ح |
| 4 | My Family | grandma, grandpa, brother, sister, uncle (father's / mother's side), aunt (both sides), cousin, this is my…, baby, family | خ د |
| 5 | I Want | I want…, do you want (boy / girl), I don't want, water, more / also, enough / done, a little, a lot, give me, please give me water | ذ ر |
| 6 | At the Table | bread, cheese, yoghurt, rice, chicken, egg, apple, banana, tasty, I'm hungry, I'm thirsty, I'm full, bon appétit (SaHtein) and its answer | ز س |
| 7 | One to Ten | one … ten, how many, how old, count with me | ش ص |
| 8 | How I Feel | happy, upset, tired, sleepy, scared, sick, what's the matter, nothing, I love you (to a man / woman), hug | ض ط |
| 9 | Come and Go | come here, go, look, listen, sit, stand up, wait, let's go (yalla), take, bring, slowly, quickly | ظ ع |
| 10 | Where Is It? | where, here, there, up, down, inside, outside, next to, where is Mama, I don't know | غ ف |
| 11 | My Home | house, room, kitchen, bathroom, bed, door, window, table, chair, garden, at home | ق ك |
| 12 | Colours and Sizes | red, blue, green, yellow, white, black, big, small, pretty / nice, what colour, I like… | ل م |
| 13 | Let's Play | let's play, ball, toy, game, my turn, your turn, I won, again, with me, do you want to play | ن ه |
| 14 | Body and Clothes | hand, foot, head, eye, mouth, tummy hurts, wash your hands, shirt, trousers, shoes, get dressed, put on your shoes | و ي |
| 15 | Today and Tomorrow | today, tomorrow, yesterday, now, later, morning, evening, night, good morning / its answer, good night / its answer, days of the week (a few) | reading |
| 16 | Bigger Numbers | eleven … twenty, the tens to a hundred, how much is it, expensive, cheap, money | reading |
| 17 | At the Shop | I want to buy, do you have…, a kilo of…, how much, that's all, here's the money, the change, bag | reading |
| 18 | School and Friends | school, friend, teacher, book, pen, notebook, I understand, I don't understand, say it again, homework | reading |
| 19 | Animals and Outside | cat, dog, bird, horse, fish, tree, sun, moon, sea, mountain, look at the… | reading |
| 20 | Weather | hot, cold, rain, snow, wind, summer, winter, it's raining, I'm cold, put on a jacket | reading |
| 21 | Visiting Family | welcome (ahla w sahla) and its answer, come in, how is the family, say hi to…, I missed you, happy holiday, congratulations, many happy returns | reading |
| 22 | On the Phone | hello (on the phone), who is it, it's Sam, how are you Teta, what are you doing, I miss you, see you soon, kisses | reading |
| 23 | What I Did | I went, I ate, I drank, I played, I slept, I saw; I am going to…; I am …ing now | reading |
| 24 | Everyday Sayings | inshalla, il-Hamdilla, bless you after a haircut / bath (na‘iiman) and its answer, may God give you strength (ya‘Tiik il-‘aafyeh) and its answer, sweet dreams, take care | reading |

## Syllabus — Bonjour French (16 units)

| # | Unit | Core |
|---|---|---|
| 1 | Salut! | hi, hello, how are you / it's going well, and you, goodbye, see you tomorrow, good night |
| 2 | Moi | my name is, I am … years old, I live in…, what's your name, how old are you, boy, girl, friend |
| 3 | Les mots magiques | yes, no, please (tu / vous), thank you, you're welcome, sorry, excuse me, it's okay |
| 4 | Ma famille | mum, dad, brother, sister, grandma, grandpa, uncle, aunt, cousin, this is my…, I have a… |
| 5 | Je veux | I want / I would like, do you want, I don't want, water, more, a little, a lot, that's enough, can I have… |
| 6 | À table | bread, cheese, milk, apple, chicken, rice, I'm hungry, I'm thirsty, it's delicious, enjoy your meal, I'm full |
| 7 | Un, deux, trois | one … twelve, how many, how old |
| 8 | Je me sens | happy, sad, tired, scared, sick, what's wrong, I'm fine, I love you, a hug |
| 9 | Viens! | come, go, look, listen, sit down, wait, let's go, quickly, slowly, give me, take |
| 10 | C'est où? | where is, here, there, on, under, in, next to, I don't know, at home, at school |
| 11 | On joue? | shall we play, ball, game, my turn, your turn, I won, again, with me, well done |
| 12 | Les couleurs | red, blue, green, yellow, black, white, big, small, pretty, what colour, I like, I don't like |
| 13 | L'école | school, teacher, friend, book, pencil, I understand, I don't understand, can you repeat, homework, break time |
| 14 | Aujourd'hui | today, tomorrow, yesterday, now, later, morning, evening, the days of the week, what time is it |
| 15 | Dehors | sun, rain, hot, cold, cat, dog, tree, park, it's raining, let's go outside |
| 16 | Au magasin | I would like…, how much is it, a baguette, an ice cream, here you are, the change, have a good day |
