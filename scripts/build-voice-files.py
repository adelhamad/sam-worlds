#!/usr/bin/env python3
"""Builds the voice files the language courses ship with (public/voice/**).

Every phrase, word tile and letter name of the courses gets an mp3, so the
lessons speak on any device, with or without a system voice for the language.

    bun scripts/voice-manifest.ts > /tmp/voice-manifest.json
    uv venv --python 3.12 /tmp/voice-venv
    uv pip install --python /tmp/voice-venv/bin/python edge-tts faster-whisper
    /tmp/voice-venv/bin/python scripts/build-voice-files.py /tmp/voice-manifest.json

Needs ffmpeg and (for clips with the child's name, which never leave this
machine) macOS `say`. Details, the voices and how to change them:
docs/LANGUAGES.md, "How it is spoken".

Options:
  --ar VOICE / --fr VOICE   online neural voice per language
  --all                     rebuild every clip (default: only missing ones)
  --no-asr                  skip the listening check (first text wins)
  --report PATH             where to write the per-clip report (JSON)
  --model NAME              recogniser for the listening check (base: fast; small: better ears)
  --partial                 the manifest is a subset: rebuild those clips, keep every other file
"""
import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "voice")
INDEX = os.path.join(ROOT, "src", "content", "voiceFiles.gen.json")
VOICES = {"ar": "ar-SY-AmanyNeural", "fr": "fr-FR-DeniseNeural"}
LOCAL_VOICES = {"ar": "Majed", "fr": "Thomas"}
WHISPER_LANG = {"ar": "ar", "fr": "fr"}
# A touch slower than conversation: the listener is seven.
RATE = "-12%"
PARALLEL = 6


def file_of(key: str) -> str:
    lang = key.split(":", 1)[0]
    return f"{lang}/{hashlib.sha1(key.encode('utf-8')).hexdigest()[:12]}"


def encode(src: str, dst: str) -> None:
    """Trim the silence at both ends, mono 24 kHz, small mp3."""
    trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04"
    chain = f"{trim},areverse,{trim},areverse,apad=pad_dur=0.12"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", chain, "-ac", "1", "-ar", "24000",
         "-codec:a", "libmp3lame", "-b:a", "40k", dst],
        check=True,
    )


async def synth_online(text: str, voice: str, dst: str) -> None:
    import edge_tts

    last = None
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, voice, rate=RATE).save(dst)
            if os.path.getsize(dst) > 400:
                return
        except Exception as error:  # network hiccup: wait and try again
            last = error
        await asyncio.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"no audio for {text!r}: {last}")


def synth_local(text: str, lang: str, dst: str) -> None:
    subprocess.run(["say", "-v", LOCAL_VOICES[lang], "-r", "150", "-o", dst, text], check=True)


def plain(text: str) -> str:
    """For comparing what was heard with what was meant: no marks, no punctuation, one spelling."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^\w\s]", " ", text.lower()).replace("_", " ")
    for a, b in (("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ى", "ي"), ("ة", "ه"), ("ؤ", "و"), ("ئ", "ي"), ("ء", "")):
        text = text.replace(a, b)
    return re.sub(r"\s+", " ", text).strip()


def similarity(a: str, b: str) -> float:
    """1 − normalised edit distance, on letters."""
    a, b = plain(a).replace(" ", ""), plain(b).replace(" ", "")
    if not a or not b:
        return 0.0
    row = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        prev, row[0] = row[0], i
        for j, cb in enumerate(b, 1):
            prev, row[j] = row[j], min(row[j] + 1, row[j - 1] + 1, prev + (ca != cb))
    return 1 - row[-1] / max(len(a), len(b))


class Listener:
    """Speech recognition as a stand-in for ears: which take sounds most like the words?"""

    def __init__(self, enabled: bool, name: str = "base"):
        self.model = None
        if enabled:
            from faster_whisper import WhisperModel

            import threading

            self.model = WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=8)
            self.lock = threading.Lock()

    def hear(self, path: str, lang: str) -> str:
        if not self.model:
            return ""
        import numpy

        # Decoded here with ffmpeg (16 kHz mono floats): no dependence on the recogniser's own audio reader.
        pcm = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
            check=True, capture_output=True,
        ).stdout
        samples = numpy.frombuffer(pcm, dtype=numpy.float32)
        with self.lock:  # one at a time: the recogniser already uses every core
            segments, _ = self.model.transcribe(samples, language=WHISPER_LANG[lang], beam_size=2, condition_on_previous_text=False)
            return " ".join(segment.text for segment in segments).strip()


async def build_item(item, voices, listener, sem, tmp, report):
    key, lang = item["key"], item["lang"]
    dst = os.path.join(OUT, file_of(key) + ".mp3")
    target = item["texts"][-1]
    takes = []
    async with sem:
        for n, text in enumerate(item["texts"][:2]):
            raw = os.path.join(tmp, f"{hashlib.sha1((key + str(n)).encode()).hexdigest()}")
            if item["local"]:
                synth_local(text, lang, raw + ".aiff")
                raw += ".aiff"
            else:
                await synth_online(text, voices[lang], raw + ".mp3")
                raw += ".mp3"
            cooked = raw + ".cooked.mp3"
            encode(raw, cooked)
            choice = listener.model is not None and len(item["texts"]) > 1
            heard = await asyncio.to_thread(listener.hear, cooked, lang) if choice else ""
            takes.append({"text": text, "heard": heard, "score": round(similarity(heard, target), 3), "file": cooked})
            if not choice:
                break  # one text, or nobody listening: the first text is the clip
    best = max(takes, key=lambda take: take["score"])
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    os.replace(best["file"], dst)
    report[key] = {
        "kind": item["kind"], "target": target, "used": best["text"], "heard": best["heard"], "score": best["score"],
        "local": item["local"],
        "other": [{"text": take["text"], "heard": take["heard"], "score": take["score"]} for take in takes if take is not best],
    }


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest")
    parser.add_argument("--ar", default=VOICES["ar"])
    parser.add_argument("--fr", default=VOICES["fr"])
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--no-asr", action="store_true")
    parser.add_argument("--report", default=os.path.join(tempfile.gettempdir(), "voice-report.json"))
    parser.add_argument("--model", default="base")
    parser.add_argument("--partial", action="store_true")
    args = parser.parse_args()
    voices = {"ar": args.ar, "fr": args.fr}
    items = json.load(open(args.manifest, encoding="utf-8"))
    wanted = {item["key"]: file_of(item["key"]) for item in items}
    if args.partial:  # everything already in the index stays
        wanted = {**json.load(open(INDEX, encoding="utf-8")), **wanted}
    todo = [item for item in items if args.all or args.partial or not os.path.exists(os.path.join(OUT, wanted[item["key"]] + ".mp3"))]
    print(f"{len(items)} sayable things, {len(todo)} to build", flush=True)

    report = json.load(open(args.report, encoding="utf-8")) if os.path.exists(args.report) and (args.partial or not args.all) else {}
    listener = Listener(enabled=not args.no_asr and bool(todo), name=args.model)
    sem = asyncio.Semaphore(PARALLEL)
    failed = []
    with tempfile.TemporaryDirectory() as tmp:
        async def guarded(item):
            try:
                await build_item(item, voices, listener, sem, tmp, report)
            except Exception as error:
                failed.append((item["key"], str(error)))

        for start in range(0, len(todo), 40):
            await asyncio.gather(*(guarded(item) for item in todo[start:start + 40]))
            print(f"  {min(start + 40, len(todo))}/{len(todo)}", flush=True)
            json.dump(report, open(args.report, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # Files nobody says any more go away; the index lists exactly what is there.
    keep = {path + ".mp3" for path in wanted.values()}
    for lang in os.listdir(OUT) if os.path.isdir(OUT) else []:
        folder = os.path.join(OUT, lang)
        for name in os.listdir(folder) if os.path.isdir(folder) else []:
            if f"{lang}/{name}" not in keep:
                os.remove(os.path.join(folder, name))
    index = {key: path for key, path in sorted(wanted.items()) if os.path.exists(os.path.join(OUT, path + ".mp3"))}
    json.dump(index, open(INDEX, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    open(INDEX, "a", encoding="utf-8").write("\n")
    size = sum(os.path.getsize(os.path.join(OUT, path + ".mp3")) for path in index.values())
    print(f"{len(index)} clips, {size / 1e6:.1f} MB; report: {args.report}")
    for key, error in failed:
        print(f"FAILED {key}: {error}", file=sys.stderr)
    return 1 if failed or len(index) != len(wanted) else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
