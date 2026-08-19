#!/usr/bin/env python3
"""
Pixelize tool for SwarmVille.
Converts high-resolution raw AI assets (tiles, props, chars) into a unified
pixel-art spritesheet atlas (PNG + JSON) with shelf packing and palette quantization.
"""

import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image


def make_tileable(img: Image.Image, k: int = 4) -> Image.Image:
    # Blend border ring of k pixels with wrapped counterpart using a linear mask for seamless tiling
    arr = np.array(img, dtype=np.float32)
    h, w = arr.shape[:2]
    out = arr.copy()

    # Horizontal seam blending across k-column border
    for i in range(k):
        t = (i + 1.0) / (k + 1.0)
        out[:, i] = (1.0 - t) * arr[:, w - k + i] + t * arr[:, i]
        out[:, w - k + i] = t * arr[:, w - k + i] + (1.0 - t) * arr[:, i]

    arr2 = out.copy()
    # Vertical seam blending across k-row border
    for i in range(k):
        t = (i + 1.0) / (k + 1.0)
        out[i, :] = (1.0 - t) * arr2[h - k + i, :] + t * arr2[i, :]
        out[h - k + i, :] = t * arr2[h - k + i, :] + (1.0 - t) * arr2[i, :]

    out = np.clip(np.round(out), 0, 255).astype(np.uint8)
    return Image.fromarray(out)


def binarize_alpha(img: Image.Image, threshold: int = 128) -> Image.Image:
    a_arr = np.array(img.getchannel("A"))
    new_a = np.where(a_arr >= threshold, np.uint8(255), np.uint8(0))
    img.putalpha(Image.fromarray(new_a))
    return img


def crop_alpha_bbox(img: Image.Image, threshold: int = 8) -> Image.Image:
    a = np.array(img.getchannel("A"))
    mask = a > threshold
    if not mask.any():
        return img
    ys, xs = np.where(mask)
    return img.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def process_tile(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    dim = min(w, h)
    left = (w - dim) // 2
    top = (h - dim) // 2
    img = img.crop((left, top, left + dim, top + dim))
    # The model draws pixel art at roughly 64 logical pixels across. Averaging
    # the whole frame down to 32 flattens that texture into a solid colour, so
    # take the middle half instead: 32 source blocks in, 32 tile pixels out.
    half = dim // 2
    offset = (dim - half) // 2
    img = img.crop((offset, offset, offset + half, offset + half))
    img = img.resize((32, 32), Image.Resampling.BOX)
    img = make_tileable(img, k=4)
    # Ensure fully opaque alpha
    img.putalpha(Image.fromarray(np.full((32, 32), 255, dtype=np.uint8)))
    return img


def process_prop(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    img = crop_alpha_bbox(img, threshold=8)
    w, h = img.size
    longest = max(w, h)
    if longest > 48:
        scale = 48.0 / float(longest)
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))
        img = img.resize((new_w, new_h), Image.Resampling.BOX)
    img = binarize_alpha(img, threshold=128)
    return img


def process_char(path: Path, name: str) -> Dict[str, Image.Image]:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    a = np.array(img.getchannel("A"))
    col_sums = a.sum(axis=0)
    non_empty = col_sums > 0

    runs: List[Tuple[int, int]] = []
    in_run = False
    start = 0
    for i, val in enumerate(non_empty):
        if val and not in_run:
            in_run = True
            start = i
        elif not val and in_run:
            in_run = False
            runs.append((start, i))
    if in_run:
        runs.append((start, len(non_empty)))

    if len(runs) >= 4:
        if len(runs) > 4:
            print(f"Warning: found {len(runs)} pose groups in {name}, taking 4 largest.")
        top4 = sorted(sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:4], key=lambda r: r[0])
    else:
        print(f"Warning: expected 4 character poses in {name}, found {len(runs)}. Falling back to equal quarters.")
        qw = w // 4
        top4 = [(i * qw, (i + 1) * qw if i < 3 else w) for i in range(4)]

    pose_names = ["down", "left", "up", "right"]
    poses: Dict[str, Image.Image] = {}

    for pose_name, (sx, ex) in zip(pose_names, top4):
        pose_img = img.crop((sx, 0, ex, h))
        pose_img = crop_alpha_bbox(pose_img, threshold=8)
        pw, ph = pose_img.size
        target_h = 40
        scale = target_h / float(ph)
        new_w = max(1, int(round(pw * scale)))
        pose_img = pose_img.resize((new_w, target_h), Image.Resampling.BOX)
        pose_img = binarize_alpha(pose_img, threshold=128)
        poses[pose_name] = pose_img

    return poses


class PackItem:
    def __init__(self, category: str, name: str, subname: Optional[str], image: Image.Image):
        self.category = category
        self.name = name
        self.subname = subname
        self.image = image
        self.w, self.h = image.size
        self.x = 0
        self.y = 0


def pack_and_quantize(
    items: List[PackItem],
    out_png: Path,
    out_json: Path,
    atlas_width: int = 1024,
    margin: int = 1,
) -> Tuple[int, int]:
    # Sort items by height descending for shelf packing
    items.sort(key=lambda item: (-item.h, -item.w, item.category, item.name, item.subname or ""))

    current_x = margin
    current_y = margin
    shelf_height = 0

    for item in items:
        if current_x + item.w + margin > atlas_width:
            current_y += shelf_height + margin
            current_x = margin
            shelf_height = 0

        item.x = current_x
        item.y = current_y
        current_x += item.w + margin
        if item.h > shelf_height:
            shelf_height = item.h

    used_height = current_y + shelf_height + margin
    atlas_height = 32
    while atlas_height < used_height:
        atlas_height *= 2

    # Canvas assembly
    atlas_img = Image.new("RGBA", (atlas_width, atlas_height), (0, 0, 0, 0))
    for item in items:
        atlas_img.paste(item.image, (item.x, item.y))

    # Palette quantization: 64 colors with MEDIANCUT without dithering, keeping alpha
    alpha_ch = atlas_img.getchannel("A")
    rgb_img = atlas_img.convert("RGB")
    quantized_rgb = rgb_img.quantize(
        colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    ).convert("RGB")
    quantized_rgb.putalpha(alpha_ch)

    # Save PNG
    out_png.parent.mkdir(parents=True, exist_ok=True)
    quantized_rgb.save(out_png, "PNG")

    # Generate JSON structure
    atlas_data: Dict[str, Any] = {
        "size": [atlas_width, atlas_height],
        "tile": 32,
        "tiles": {},
        "props": {},
        "chars": {},
    }

    for item in items:
        rect = {"x": item.x, "y": item.y, "w": item.w, "h": item.h}
        if item.category == "tiles":
            atlas_data["tiles"][item.name] = rect
        elif item.category == "props":
            atlas_data["props"][item.name] = rect
        elif item.category == "chars":
            if item.name not in atlas_data["chars"]:
                atlas_data["chars"][item.name] = {}
            atlas_data["chars"][item.name][item.subname] = rect

    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(atlas_data, f, indent=2)

    return atlas_width, atlas_height


def run_pipeline(manifest_path: Path, raw_dir: Path, out_png: Path, out_json: Path) -> None:
    if not manifest_path.exists():
        print(f"Error: Manifest file not found at {manifest_path}")
        return

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    items: List[PackItem] = []
    tile_count = 0
    prop_count = 0
    char_count = 0

    # Process tiles
    for tile_def in manifest.get("tiles", []):
        name = tile_def["name"]
        raw_path = raw_dir / f"{name}.png"
        if not raw_path.exists():
            print(f"Warning: tile asset not found: {raw_path}")
            continue
        try:
            tile_img = process_tile(raw_path)
            items.append(PackItem("tiles", name, None, tile_img))
            tile_count += 1
        except Exception as e:
            print(f"Warning: error processing tile {name}: {e}")

    # Process props
    for prop_def in manifest.get("props", []):
        name = prop_def["name"]
        raw_path = raw_dir / f"{name}.png"
        if not raw_path.exists():
            print(f"Warning: prop asset not found: {raw_path}")
            continue
        try:
            prop_img = process_prop(raw_path)
            items.append(PackItem("props", name, None, prop_img))
            prop_count += 1
        except Exception as e:
            print(f"Warning: error processing prop {name}: {e}")

    # Process chars
    for char_def in manifest.get("chars", []):
        name = char_def["name"]
        raw_path = raw_dir / f"{name}.png"
        if not raw_path.exists():
            print(f"Warning: char asset not found: {raw_path}")
            continue
        try:
            poses = process_char(raw_path, name)
            for pose_name, pose_img in poses.items():
                items.append(PackItem("chars", name, pose_name, pose_img))
            char_count += 1
        except Exception as e:
            print(f"Warning: error processing char {name}: {e}")

    if not items:
        print("Warning: no items processed. Atlas not generated.")
        return

    w, h = pack_and_quantize(items, out_png, out_json)
    print(f"Processed {tile_count} tiles, {prop_count} props, {char_count} chars. Atlas size: {w}x{h}")


def run_selftest() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        raw_dir = tmp_path / "art" / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        manifest_path = tmp_path / "art" / "manifest.json"
        out_png = tmp_path / "public" / "art" / "atlas.png"
        out_json = tmp_path / "public" / "art" / "atlas.json"

        # 1. Synthetic Tile (100x120 noise pattern)
        np.random.seed(42)
        tile_noise = np.random.randint(50, 200, (120, 100, 3), dtype=np.uint8)
        Image.fromarray(tile_noise).save(raw_dir / "test_tile.png")

        # 2. Synthetic Prop (200x300 RGBA with centered blob and semi-transparent fringe)
        prop_arr = np.zeros((300, 200, 4), dtype=np.uint8)
        # Center solid region
        prop_arr[80:220, 50:150] = [180, 120, 60, 255]
        # Semi-transparent border fringe
        prop_arr[70:80, 45:155, 3] = 100
        prop_arr[220:230, 45:155, 3] = 50
        Image.fromarray(prop_arr).save(raw_dir / "test_prop.png")

        # 3. Synthetic Char (4 distinct non-empty blobs separated by empty columns)
        char_arr = np.zeros((150, 600, 4), dtype=np.uint8)
        # 4 poses: down, left, up, right
        offsets = [40, 180, 320, 460]
        for idx, ox in enumerate(offsets):
            char_arr[20:130, ox : ox + 60] = [50 + idx * 40, 100, 150, 255]
            # Soft edge
            char_arr[15:20, ox : ox + 60, 3] = 70
        Image.fromarray(char_arr).save(raw_dir / "test_char.png")

        # Synthetic manifest
        manifest_data = {
            "style": "test",
            "tiles": [{"name": "test_tile", "prompt": "noise tile"}],
            "props": [{"name": "test_prop", "prompt": "test prop"}],
            "chars": [{"name": "test_char", "shirt": "red", "hair": "black", "trousers": "blue"}],
        }
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f)

        # Run pipeline
        run_pipeline(manifest_path, raw_dir, out_png, out_json)

        # Assertions
        assert out_png.exists(), "atlas.png was not generated"
        assert out_json.exists(), "atlas.json was not generated"

        with open(out_json, "r", encoding="utf-8") as f:
            data = json.load(f)

        # JSON format validation
        assert isinstance(data.get("size"), list) and len(data["size"]) == 2, "Invalid size format in JSON"
        atlas_w, atlas_h = data["size"]
        assert atlas_w == 1024, f"Atlas width must be 1024, got {atlas_w}"
        assert (atlas_h & (atlas_h - 1)) == 0, f"Atlas height must be power of 2, got {atlas_h}"
        assert data.get("tile") == 32, "tile property must be 32"

        # Check Tile
        assert "test_tile" in data["tiles"], "test_tile missing in JSON"
        tile_rect = data["tiles"]["test_tile"]
        assert tile_rect["w"] == 32 and tile_rect["h"] == 32, f"Tile must be 32x32, got {tile_rect}"

        # Check Prop
        assert "test_prop" in data["props"], "test_prop missing in JSON"
        prop_rect = data["props"]["test_prop"]
        assert max(prop_rect["w"], prop_rect["h"]) <= 48, f"Prop max side must be <= 48, got {prop_rect}"

        # Check Char poses
        assert "test_char" in data["chars"], "test_char missing in JSON"
        char_poses = data["chars"]["test_char"]
        expected_poses = {"down", "left", "up", "right"}
        assert set(char_poses.keys()) == expected_poses, f"Expected poses {expected_poses}, got {set(char_poses.keys())}"
        for pname, prect in char_poses.items():
            assert prect["h"] == 40, f"Char pose {pname} height must be 40, got {prect['h']}"

        # Check Alpha binarization in atlas PNG
        atlas_img = Image.open(out_png)
        assert atlas_img.size == (atlas_w, atlas_h), "Atlas PNG dimensions do not match JSON size"
        alpha_arr = np.array(atlas_img.getchannel("A"))
        unique_alphas = set(np.unique(alpha_arr))
        assert unique_alphas.issubset({0, 255}), f"Alpha contains non-binary values: {unique_alphas}"

        print("selftest OK")


def main() -> None:
    if "--selftest" in sys.argv:
        run_selftest()
        return

    root_dir = Path(__file__).resolve().parent.parent
    manifest_path = root_dir / "art" / "manifest.json"
    raw_dir = root_dir / "art" / "raw"
    out_png = root_dir / "public" / "art" / "atlas.png"
    out_json = root_dir / "public" / "art" / "atlas.json"

    run_pipeline(manifest_path, raw_dir, out_png, out_json)


if __name__ == "__main__":
    main()
