# -*- coding: utf-8 -*-
"""Monte la video a partir des images de beats, des timecodes et de la voix off.

Chaque image est tenue sur la duree de son beat (mots / 2,5 s), avec un leger
zoom lent (Ken Burns) et un fondu court entre les plans. La voix off est
ensuite calee dessus. Si la voix off est plus longue ou plus courte que la
duree theorique, toutes les durees sont mises a l'echelle pour rester en phase.

Usage :
    python3 build_video.py --images test-images --out maquette.mp4 \
        --audio voix.mp3 --first 1 --last 20
"""
import argparse, json, pathlib, subprocess, sys

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
HERE = pathlib.Path(__file__).parent
FPS = 30
W, H = 1920, 1080
XFADE = 0.4  # duree du fondu entre deux plans, en secondes


WPS = 3.27  # cadence mesuree de la voix off ElevenLabs, en mots par seconde


def beat_durations(beats_path, first, last):
    """Duree nominale de chaque beat retenu. La mise a l'echelle sur la voix off
    corrige ensuite le total, seules les proportions comptent ici."""
    beats = [l.strip() for l in beats_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    return [len(b.split()) / WPS for b in beats[first - 1:last]]


def merge_shots(beats, durations, min_shot):
    """Regroupe les beats consecutifs jusqu'a atteindre min_shot secondes.

    Le decoupage en beats de 2 a 3 s vient du document, qui suppose un clip
    anime par beat. Sur des images fixes, ce rythme est trop rapide : on
    additionne les durees et on ne garde qu'une image par groupe.

    Retourne une liste de (membres, duree), membres etant la liste des beats
    du groupe. Sans min_shot, chaque beat forme son propre groupe.
    """
    if not min_shot:
        return [([b], d) for b, d in zip(beats, durations)]
    groups, cur, cur_dur = [], [], 0.0
    for b, d in zip(beats, durations):
        cur.append(b)
        cur_dur += d
        if cur_dur >= min_shot:
            groups.append((cur, cur_dur))
            cur, cur_dur = [], 0.0
    if cur:                                      # reste de fin
        if groups:
            groups[-1] = (groups[-1][0] + cur, groups[-1][1] + cur_dur)
        else:
            groups.append((cur, cur_dur))
    return groups


def apply_selection(groups, selection_path):
    """Remplace l'image par defaut (le premier beat) par celle choisie a la main.

    Le fichier shot_selection.json donne, pour chaque groupe, le beat retenu.
    On verifie que le decoupage correspond exactement a celui du fichier :
    une selection faite pour un autre --min-shot serait silencieusement fausse.
    """
    sel = json.loads(pathlib.Path(selection_path).read_text(encoding="utf-8"))
    picks = sel["picks"]
    if len(picks) != len(groups):
        sys.exit(f"selection incompatible : {len(picks)} groupes dans le fichier, "
                 f"{len(groups)} calcules (verifier --min-shot / --first / --last)")
    out = []
    for (members, dur), p in zip(groups, picks):
        if list(p["beats"]) != list(members):
            sys.exit(f"selection incompatible au groupe {p['group']} : "
                     f"{p['beats']} dans le fichier, {members} calcules")
        if p["pick"] not in members:
            sys.exit(f"beat {p['pick']} hors du groupe {p['group']}")
        out.append((p["pick"], dur))
    return out


def audio_duration(path):
    out = subprocess.run(
        [FFMPEG, "-i", str(path), "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    for line in out.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError(f"duree audio introuvable pour {path}")


def find_image(images_dir, beat):
    """Retrouve l'image d'un beat quelle que soit sa variante de nom."""
    stem = f"beat_{beat:03d}"
    for suffix in ("_v3", "_v2", "_compact", ""):
        for ext in (".jpeg", ".jpg", ".png"):
            p = images_dir / f"{stem}{suffix}{ext}"
            if p.exists():
                return p
    return None


def build(images_dir, out, audio, first, last, min_shot=0.0, selection=None):
    durations = beat_durations(HERE / "beats.txt", first, last)
    beats = list(range(first, last + 1))
    groups = merge_shots(beats, durations, min_shot)
    if min_shot:
        print(f"regroupement a {min_shot}s : {len(beats)} beats -> {len(groups)} plans")
    if selection:
        grouped = apply_selection(groups, selection)
        print(f"selection manuelle appliquee : {selection}")
    else:
        grouped = [(members[0], dur) for members, dur in groups]
    pairs = [(b, find_image(images_dir, b), d) for b, d in grouped]
    missing = [b for b, p, _ in pairs if p is None]
    if missing:
        print(f"images manquantes, beats ignores : {missing}")
    pairs = [(b, p, d) for b, p, d in pairs if p is not None]
    if not pairs:
        sys.exit("aucune image trouvee")

    total = sum(d for _, _, d in pairs)
    scale = 1.0
    if audio:
        scale = audio_duration(audio) / total
        print(f"voix off {audio_duration(audio):.1f}s / beats {total:.1f}s -> facteur {scale:.3f}")

    # Chaque plan est allonge de XFADE puisque les fondus se chevauchent.
    inputs, filters, labels = [], [], []
    for idx, (beat, path, dur) in enumerate(pairs):
        d = dur * scale + XFADE
        frames = max(2, int(round(d * FPS)))
        inputs += ["-loop", "1", "-t", f"{d:.3f}", "-i", str(path)]
        # Zoom lent de 1.0 a 1.06, recentre, puis passage en 1920x1080.
        filters.append(
            f"[{idx}:v]scale={W*2}:{H*2},"
            f"zoompan=z='min(1.0+0.06*on/{frames},1.06)':d={frames}"
            f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
            f"setsar=1,format=yuv420p[v{idx}]"
        )
        labels.append(f"[v{idx}]")

    # Chaine de fondus enchaines.
    chain, offset = "", 0.0
    prev = labels[0]
    for idx in range(1, len(labels)):
        offset += pairs[idx - 1][2] * scale
        out_label = f"[x{idx}]"
        chain += f"{prev}{labels[idx]}xfade=transition=fade:duration={XFADE}:offset={offset:.3f}{out_label};"
        prev = out_label
    filter_complex = ";".join(filters) + (";" + chain.rstrip(";") if chain else "")

    cmd = [FFMPEG, "-y"] + inputs
    if audio:
        cmd += ["-i", str(audio)]
    cmd += ["-filter_complex", filter_complex, "-map", prev]
    if audio:
        cmd += ["-map", f"{len(pairs)}:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
            "-r", str(FPS), str(out)]

    print(f"{len(pairs)} plans, duree cible {total*scale:.1f}s")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-3000:])
        sys.exit(r.returncode)
    print("ecrit:", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", default="test-images")
    ap.add_argument("--out", default="maquette.mp4")
    ap.add_argument("--audio", default=None)
    ap.add_argument("--first", type=int, default=1)
    ap.add_argument("--last", type=int, default=20)
    ap.add_argument("--min-shot", type=float, default=0.0,
                    help="duree minimale d'un plan en secondes ; regroupe les beats")
    ap.add_argument("--selection", default=None,
                    help="fichier json d'images choisies a la main pour chaque groupe")
    a = ap.parse_args()
    build(HERE / a.images, HERE / a.out, pathlib.Path(a.audio) if a.audio else None,
          a.first, a.last, a.min_shot, a.selection)
