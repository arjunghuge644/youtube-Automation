#!/usr/bin/env python3
"""
CreatorFlow AI — Procedural Video Render Engine
Interprets universal scene plans and renders high-definition multi-scene MP4 videos
supporting Procedural 3D, Motion Graphics, and Media Composition strategies.
"""

import sys
import os
import json
import math
import struct
import wave
import tempfile
import subprocess
from PIL import Image, ImageDraw, ImageFont

# Font paths
HINDI_FONT_PATH = "/usr/share/fonts/noto/NotoSansDevanagari-Bold.ttf"
HINDI_REG_PATH = "/usr/share/fonts/noto/NotoSansDevanagari-Regular.ttf"
ENGLISH_FONT_PATH = "/usr/share/fonts/noto/NotoSans-Bold.ttf"
MONO_FONT_PATH = "/usr/share/fonts/Adwaita/AdwaitaMono-Bold.ttf"

def get_font(size, hindi=False, mono=False):
    try:
        if hindi and os.path.exists(HINDI_FONT_PATH):
            return ImageFont.truetype(HINDI_FONT_PATH, size)
        elif mono and os.path.exists(MONO_FONT_PATH):
            return ImageFont.truetype(MONO_FONT_PATH, size)
        elif os.path.exists(ENGLISH_FONT_PATH):
            return ImageFont.truetype(ENGLISH_FONT_PATH, size)
        else:
            return ImageFont.load_default()
    except Exception:
        return ImageFont.load_default()

def draw_pill(draw, xy, text, font, fill_color, text_color=(255, 255, 255), padding=(14, 8)):
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x, y = xy
    px, py = padding
    rect = [x - px, y - py, x + tw + px, y + th + py]
    r = (rect[3] - rect[1]) // 2
    draw.rounded_rectangle(rect, radius=r, fill=fill_color)
    draw.text((x, y - bbox[1]), text, font=font, fill=text_color)
    return rect

# --- Audio Synthesizer ---
def generate_audio_track(duration_seconds, output_wav_path, sample_rate=44100, project_category="educational"):
    """Synthesizes stereo music and ambient acoustic bed with transition chimes."""
    num_samples = int(duration_seconds * sample_rate)
    
    # Chord frequencies for ambient progression (C minor / Ab / Eb / Bb)
    chords = [
        [130.81, 155.56, 196.00, 261.63], # C minor
        [103.83, 130.81, 155.56, 207.65], # Ab major
        [155.56, 196.00, 233.08, 311.13], # Eb major
        [116.54, 146.83, 174.61, 233.08], # Bb major
    ]
    
    with wave.open(output_wav_path, 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        
        frames = bytearray()
        chord_len = 4.0 # seconds per chord
        
        for i in range(num_samples):
            t = i / sample_rate
            chord_idx = int(t / chord_len) % len(chords)
            chord = chords[chord_idx]
            
            # Polyphonic pad
            pad_val = 0.0
            for note in chord:
                pad_val += math.sin(2 * math.pi * note * t) * 0.12
                # subtle octave overtone
                pad_val += math.sin(2 * math.pi * (note * 2) * t) * 0.04
            
            # Gentle rhythmic pulse (120 bpm = 2 Hz)
            pulse = (math.sin(2 * math.pi * 2.0 * t) ** 4) * 0.06
            if project_category == "product_promo":
                pulse = (math.sin(2 * math.pi * 2.5 * t) ** 6) * 0.12
            
            # Transition chime at every 4-second boundary
            t_rem = t % chord_len
            chime = 0.0
            if t_rem < 1.0:
                decay = math.exp(-t_rem * 4.0)
                chime = (math.sin(2 * math.pi * 523.25 * t) + math.sin(2 * math.pi * 659.25 * t)) * 0.15 * decay
            
            sample = (pad_val + pulse + chime) * 0.8
            sample = max(-0.95, min(0.95, sample))
            int_val = int(sample * 32767)
            
            # Stereo frame (left, right)
            frames.extend(struct.pack('<hh', int_val, int_val))
        
        wav.writeframes(frames)

# --- 3D Projection Helpers ---
def project_iso(x, y, z, cx, cy, zoom=1.0, angle_rad=0.5236, pitch_rad=0.6108):
    """Projects a 3D coordinate to 2D screen space with yaw and pitch rotation."""
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    cos_p = math.cos(pitch_rad)
    sin_p = math.sin(pitch_rad)
    
    # Rotate Y (yaw)
    rx = x * cos_a - y * sin_a
    ry = x * sin_a + y * cos_a
    rz = z
    
    # Pitch (elevation)
    screen_x = cx + rx * zoom
    screen_y = cy + (ry * sin_p - rz * cos_p) * zoom
    return (int(screen_x), int(screen_y))

def draw_3d_box(draw, x, y, z, dx, dy, dz, cx, cy, zoom, angle_rad, pitch_rad, top_color, side_color, front_color):
    """Draws a 3D cuboid with isometric perspective shading."""
    # 8 vertices
    v = [
        project_iso(x - dx, y - dy, z, cx, cy, zoom, angle_rad, pitch_rad),
        project_iso(x + dx, y - dy, z, cx, cy, zoom, angle_rad, pitch_rad),
        project_iso(x + dx, y + dy, z, cx, cy, zoom, angle_rad, pitch_rad),
        project_iso(x - dx, y + dy, z, cx, cy, zoom, angle_rad, pitch_rad),
        project_iso(x - dx, y - dy, z + dz, cx, cy, zoom, angle_rad, pitch_rad),
        project_iso(x + dx, y - dy, z + dz, cx, cy, zoom, angle_rad, pitch_rad),
        project_iso(x + dx, y + dy, z + dz, cx, cy, zoom, angle_rad, pitch_rad),
        project_iso(x - dx, y + dy, z + dz, cx, cy, zoom, angle_rad, pitch_rad),
    ]
    # Faces
    # Side (+Y face)
    draw.polygon([v[2], v[3], v[7], v[6]], fill=side_color)
    # Front (+X face)
    draw.polygon([v[1], v[2], v[6], v[5]], fill=front_color)
    # Top (+Z face)
    draw.polygon([v[4], v[5], v[6], v[7]], fill=top_color)

# --- Scene Renderers ---

def render_procedural_3d_scene(draw, scene, scene_time, total_scene_duration, width, height):
    """Renders Procedural 3D Traffic Simulation template."""
    strat = scene.get('renderStrategy', {})
    camera = strat.get('camera', {'type': 'cinematic', 'zoom': 1.0, 'angleDegrees': 30})
    params = strat.get('parameters', {})
    
    cx, cy = width // 2, height // 2
    base_zoom = camera.get('zoom', 1.0) * (width / 720.0) * 1.3
    
    # Camera Angle & Pitch
    cam_type = camera.get('type', 'cinematic')
    if cam_type == 'top_down':
        angle = math.radians(camera.get('angleDegrees', 0))
        pitch = 1.57 # 90 degrees straight down
    elif cam_type == 'orbit':
        angle = math.radians(camera.get('angleDegrees', -45)) + (scene_time * 0.15)
        pitch = 0.65
    else: # cinematic / static
        angle = math.radians(camera.get('angleDegrees', 30))
        pitch = 0.60
    
    # Background city surface
    draw.rectangle([0, 0, width, height], fill=(22, 26, 37))
    
    # 3D Ground and Roads
    road_w = 110
    road_len = 450
    
    # Road surface (cross shape)
    # North-South road
    ns_poly = [
        project_iso(-road_w, -road_len, 0, cx, cy, base_zoom, angle, pitch),
        project_iso(road_w, -road_len, 0, cx, cy, base_zoom, angle, pitch),
        project_iso(road_w, road_len, 0, cx, cy, base_zoom, angle, pitch),
        project_iso(-road_w, road_len, 0, cx, cy, base_zoom, angle, pitch),
    ]
    draw.polygon(ns_poly, fill=(38, 43, 58))
    
    # East-West road
    ew_poly = [
        project_iso(-road_len, -road_w, 0, cx, cy, base_zoom, angle, pitch),
        project_iso(road_len, -road_w, 0, cx, cy, base_zoom, angle, pitch),
        project_iso(road_len, road_w, 0, cx, cy, base_zoom, angle, pitch),
        project_iso(-road_len, road_w, 0, cx, cy, base_zoom, angle, pitch),
    ]
    draw.polygon(ew_poly, fill=(38, 43, 58))
    
    # Crosswalks
    for side in [-1, 1]:
        for i in range(-4, 5):
            pt1 = project_iso(i * 18, side * 130, 1, cx, cy, base_zoom, angle, pitch)
            pt2 = project_iso(i * 18, side * 145, 1, cx, cy, base_zoom, angle, pitch)
            draw.line([pt1, pt2], fill=(220, 225, 235), width=int(5 * base_zoom))
    
    # Double yellow center lines
    draw.line([
        project_iso(0, -road_len, 1, cx, cy, base_zoom, angle, pitch),
        project_iso(0, -145, 1, cx, cy, base_zoom, angle, pitch),
    ], fill=(245, 158, 11), width=int(3 * base_zoom))
    draw.line([
        project_iso(0, 145, 1, cx, cy, base_zoom, angle, pitch),
        project_iso(0, road_len, 1, cx, cy, base_zoom, angle, pitch),
    ], fill=(245, 158, 11), width=int(3 * base_zoom))
    
    # Traffic Signal Gantry & Light
    signal_state = params.get('trafficSignalState', 'green')
    signal_color = (16, 185, 129) if signal_state == 'green' else (245, 158, 11) if signal_state == 'yellow' else (239, 68, 68)
    
    pole_base = project_iso(120, -120, 0, cx, cy, base_zoom, angle, pitch)
    pole_top = project_iso(120, -120, 110, cx, cy, base_zoom, angle, pitch)
    draw.line([pole_base, pole_top], fill=(100, 116, 139), width=int(6 * base_zoom))
    # Glowing signal head
    draw.ellipse([pole_top[0]-10, pole_top[1]-10, pole_top[0]+10, pole_top[1]+10], fill=signal_color)
    
    # Vehicle Dynamics based on scene number
    scene_num = scene.get('sceneNumber', 1)
    
    # Lane positions (South to North lane)
    lane_x = -45
    car_colors = [
        ((239, 68, 68), (185, 28, 28), (220, 38, 38)), # Red
        ((59, 130, 246), (29, 78, 216), (37, 99, 235)), # Blue
        ((16, 185, 129), (4, 120, 87), (5, 150, 105)), # Emerald
        ((245, 158, 11), (180, 83, 9), (217, 119, 6)), # Amber
        ((168, 85, 247), (126, 34, 206), (147, 51, 234)), # Purple
        ((248, 250, 252), (203, 213, 225), (226, 232, 240)), # White
    ]
    
    # Render line of cars
    num_cars = 7
    for c_idx in range(num_cars):
        col_top, col_side, col_front = car_colors[c_idx % len(car_colors)]
        
        # Vehicle motion modeling
        if scene_num == 1:
            # Normal smooth traffic flow
            speed = 90.0
            pos_y = -350 + (scene_time * speed + c_idx * 90) % 700 - 350
            is_braking = False
        elif scene_num == 2:
            # Sudden braking event: lead car brakes hard at t > 1.0s
            is_lead = (c_idx == 0)
            if is_lead and scene_time > 0.8:
                pos_y = -40 + max(0, (2.0 - scene_time) * 10)
                is_braking = True
            else:
                pos_y = -40 - c_idx * 75 + scene_time * 40
                is_braking = (c_idx <= 1 and scene_time > 1.2)
        elif scene_num == 3:
            # Phantom traffic wave: cascade stopping
            # wave moves backwards
            freeze_idx = int(scene_time * 2.2)
            is_braking = (c_idx <= freeze_idx)
            pos_y = -20 - c_idx * 46 + (0 if is_braking else (scene_time * 15))
        else: # Scene 4: Safe 3-second distance absorbs wave
            buffer = 110
            pos_y = -300 + (scene_time * 75 + c_idx * buffer) % 700 - 350
            is_braking = False
        
        # Draw vehicle cuboid
        dx, dy, dz = 18, 30, 16
        draw_3d_box(draw, lane_x, pos_y, 0, dx, dy, dz, cx, cy, base_zoom, angle, pitch, col_top, col_side, col_front)
        
        # Brake lights if braking
        if is_braking:
            bl_pos1 = project_iso(lane_x - 12, pos_y - dy, 6, cx, cy, base_zoom, angle, pitch)
            bl_pos2 = project_iso(lane_x + 12, pos_y - dy, 6, cx, cy, base_zoom, angle, pitch)
            draw.ellipse([bl_pos1[0]-6, bl_pos1[1]-6, bl_pos1[0]+6, bl_pos1[1]+6], fill=(255, 0, 50))
            draw.ellipse([bl_pos2[0]-6, bl_pos2[1]-6, bl_pos2[0]+6, bl_pos2[1]+6], fill=(255, 0, 50))
    
    # Vehicles on crossing road (East-West)
    for ew_idx in range(4):
        col_top, col_side, col_front = car_colors[(ew_idx + 2) % len(car_colors)]
        ew_pos_x = -300 + (scene_time * 65 + ew_idx * 140) % 650 - 300
        draw_3d_box(draw, ew_pos_x, 45, 0, 30, 18, 16, cx, cy, base_zoom, angle, pitch, col_top, col_side, col_front)
    
    # Top Telemetry HUD
    hud_font = get_font(18, mono=True)
    state_desc = (
        "NORMAL FLOW · 48 km/h · GREEN SIGNAL" if scene_num == 1 else
        "BRAKING TRIGGER · SUDDEN DECELERATION" if scene_num == 2 else
        "PHANTOM WAVE · BACKWARD RIPPLE GRIDLOCK" if scene_num == 3 else
        "BUFFER SOLUTION · 3-SECOND SAFE DISTANCE"
    )
    hud_color = (16, 185, 129) if scene_num in [1, 4] else (239, 68, 68) if scene_num == 3 else (245, 158, 11)
    draw_pill(draw, (40, 45), f"● SIMULATION HUD: {state_desc}", hud_font, (15, 23, 42, 220), hud_color)

def render_motion_graphics_scene(draw, scene, scene_time, total_scene_duration, width, height):
    """Renders Kinetic Typography and Motion Graphics strategy."""
    strat = scene.get('renderStrategy', {})
    headline = strat.get('headline', 'CREATORFLOW AI')
    subheadline = strat.get('subheadline', 'Universal Video Generation')
    primary_color = strat.get('primaryColor', '#0b0c10')
    accent_hex = strat.get('accentColor', '#6366f1')
    
    # Parse accent color
    def hex_to_rgb(h):
        h = h.lstrip('#')
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    
    accent_rgb = hex_to_rgb(accent_hex)
    
    # Dark animated gradient background
    t = scene_time / total_scene_duration
    for y in range(0, height, 4):
        blend = y / height
        r = int(11 * (1 - blend) + 26 * blend)
        g = int(12 * (1 - blend) + 32 * blend)
        b = int(16 * (1 - blend) + 44 * blend)
        draw.line([(0, y), (width, y)], fill=(r, g, b), width=4)
    
    # Background animation: Pulsing geometric grid / rings
    cx, cy = width // 2, height // 2 - 50
    pulse_r = int(120 + 40 * math.sin(scene_time * 3.0))
    draw.ellipse([cx - pulse_r, cy - pulse_r, cx + pulse_r, cy + pulse_r], outline=(accent_rgb[0]//3, accent_rgb[1]//3, accent_rgb[2]//3), width=2)
    draw.ellipse([cx - pulse_r*1.5, cy - pulse_r*1.5, cx + pulse_r*1.5, cy + pulse_r*1.5], outline=(30, 41, 59), width=1)
    
    # Animated Hero Card (Glassmorphism look)
    card_w, card_h = int(width * 0.82), 260
    card_x = (width - card_w) // 2
    card_y = cy - card_h // 2
    
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=16, fill=(18, 24, 38))
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=16, outline=accent_rgb, width=2)
    
    # Kinetic Typography Headline
    title_font = get_font(36)
    sub_font = get_font(20)
    tag_font = get_font(15, mono=True)
    
    # Tag Pill
    draw_pill(draw, (card_x + 30, card_y + 25), "● EXCLUSIVE LAUNCH", tag_font, (15, 23, 42), accent_rgb)
    
    # Headline (Smooth fade and track)
    draw.text((card_x + 30, card_y + 75), headline, font=title_font, fill=(248, 250, 252))
    
    # Accent separator bar
    draw.line([(card_x + 30, card_y + 140), (card_x + card_w - 30, card_y + 140)], fill=(51, 65, 85), width=2)
    draw.line([(card_x + 30, card_y + 140), (card_x + int(30 + (card_w - 60) * min(1.0, scene_time * 1.5)), card_y + 140)], fill=accent_rgb, width=3)
    
    # Subheadline
    draw.text((card_x + 30, card_y + 165), subheadline, font=sub_font, fill=(148, 163, 184))
    
    # Text Overlays (if present)
    for overlay in scene.get('textOverlays', []):
        pos = overlay.get('position', 'lower_third')
        oy = height - 180 if pos in ['lower_third', 'bottom'] else 60
        ov_font = get_font(20, mono=True)
        draw_pill(draw, (card_x + 30, oy), f"✦ {overlay.get('text', '')}", ov_font, (15, 23, 42), (52, 211, 153))

def render_uploaded_media_scene(draw, scene, scene_time, total_scene_duration, width, height):
    """Renders Media Composition with Ken Burns motion and documentary lower thirds."""
    strat = scene.get('renderStrategy', {})
    motion = strat.get('motion', 'ken_burns')
    t = scene_time / total_scene_duration
    
    # Simulated high-res documentary underwater plate
    # Deep ocean sunlit gradient
    for y in range(0, height, 4):
        blend = y / height
        r = int(6 * (1 - blend) + 10 * blend)
        g = int(45 * (1 - blend) + 95 * blend)
        b = int(120 * (1 - blend) + 160 * blend)
        draw.line([(0, y), (width, y)], fill=(r, g, b), width=4)
    
    # Sun light rays piercing water
    for ray_i in range(5):
        ray_x = int(width * 0.2 * ray_i + math.sin(scene_time * 0.5 + ray_i) * 30)
        draw.line([(ray_x, 0), (ray_x + 120, height)], fill=(255, 255, 255), width=int(18 + 8 * math.sin(scene_time + ray_i)))
    
    # Coral formations in foreground with Ken Burns pan/zoom
    zoom_factor = 1.0 + 0.12 * t if 'zoom' in motion or motion == 'ken_burns' else 1.0
    pan_x = int(-40 * t) if 'pan' in motion or motion == 'ken_burns' else 0
    
    # Silhouette marine life / reefs
    reef_poly = [
        (0, height),
        (0, height - int(240 * zoom_factor)),
        (int(180 * zoom_factor) + pan_x, height - int(320 * zoom_factor)),
        (int(380 * zoom_factor) + pan_x, height - int(210 * zoom_factor)),
        (int(580 * zoom_factor) + pan_x, height - int(350 * zoom_factor)),
        (width, height - int(250 * zoom_factor)),
        (width, height),
    ]
    draw.polygon(reef_poly, fill=(5, 30, 50))
    
    # Swimmer / sea turtle silhouette drifting
    turtle_x = int(width * 0.35 + scene_time * 25)
    turtle_y = int(height * 0.38 + math.sin(scene_time * 1.2) * 15)
    draw.ellipse([turtle_x - 30, turtle_y - 15, turtle_x + 30, turtle_y + 15], fill=(3, 20, 35))
    draw.polygon([(turtle_x - 10, turtle_y), (turtle_x + 20, turtle_y - 25), (turtle_x + 5, turtle_y)], fill=(3, 20, 35))
    draw.polygon([(turtle_x - 10, turtle_y), (turtle_x + 20, turtle_y + 25), (turtle_x + 5, turtle_y)], fill=(3, 20, 35))
    
    # Lower third documentary badge
    for overlay in scene.get('textOverlays', []):
        badge_font = get_font(22)
        draw_pill(draw, (40, height - 220), f"■ {overlay.get('text', '')}", badge_font, (15, 23, 42, 230), (56, 189, 248), padding=(16, 10))

# --- Subtitle Renderer ---
def render_subtitles(draw, scene, scene_time, width, height, is_hindi=False):
    """Renders synchronized subtitle box at the bottom of the screen."""
    subtitles = scene.get('subtitles', [])
    active_text = ""
    for sub in subtitles:
        if sub.get('startSeconds', 0) <= scene_time <= sub.get('endSeconds', 999):
            active_text = sub.get('text', '')
            break
            
    if not active_text and scene.get('audio', {}).get('text'):
        # Fallback to scene audio narration text
        active_text = scene.get('audio', {}).get('text')
        
    if not active_text.strip():
        return
        
    sub_font = get_font(24, hindi=is_hindi)
    
    # Wrap text if long
    max_w = int(width * 0.85)
    words = active_text.split(' ')
    lines = []
    curr = []
    
    for word in words:
        test_line = " ".join(curr + [word])
        bbox = sub_font.getbbox(test_line)
        if bbox[2] - bbox[0] > max_w and curr:
            lines.append(" ".join(curr))
            curr = [word]
        else:
            curr.append(word)
    if curr:
        lines.append(" ".join(curr))
        
    line_h = 36
    total_h = len(lines) * line_h + 20
    box_y = height - total_h - 60
    box_x = int(width * 0.075)
    box_w = int(width * 0.85)
    
    # Subtitle pill background
    draw.rounded_rectangle([box_x, box_y, box_x + box_w, box_y + total_h], radius=14, fill=(15, 23, 42))
    draw.rounded_rectangle([box_x, box_y, box_x + box_w, box_y + total_h], radius=14, outline=(71, 85, 105), width=1)
    
    for l_idx, line in enumerate(lines):
        bbox = sub_font.getbbox(line)
        lw = bbox[2] - bbox[0]
        lx = box_x + (box_w - lw) // 2
        ly = box_y + 10 + l_idx * line_h
        draw.text((lx, ly), line, font=sub_font, fill=(255, 255, 255))

# --- Main Video Pipeline ---
def render_project_video(project_data, scene_plan_data, output_mp4_path, width=720, height=1280, fps=30):
    """Renders all scenes in timeline order with audio and exports a complete MP4."""
    aspect_ratio = project_data.get('aspectRatio', '9:16')
    if aspect_ratio == '16:9':
        width, height = 1280, 720
    elif aspect_ratio == '1:1':
        width, height = 720, 720
    else: # 9:16
        width, height = 720, 1280
        
    scenes = scene_plan_data.get('scenes', [])
    total_duration = sum(s.get('durationSeconds', 4) for s in scenes)
    is_hindi = project_data.get('language') in ['hi', 'hinglish']
    category = project_data.get('category', 'educational')
    
    print(f"🎬 CreatorFlow AI Video Engine: Rendering {len(scenes)} scenes ({total_duration}s, {aspect_ratio}, {width}x{height} @ {fps}fps)...")
    
    # Synthesize background soundtrack
    temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False).name
    try:
        generate_audio_track(total_duration, temp_wav, project_category=category)
        
        # FFmpeg command streaming uncompressed frames from stdin
        ffmpeg_cmd = [
            'ffmpeg', '-y',
            '-f', 'rawvideo',
            '-pixel_format', 'rgb24',
            '-video_size', f'{width}x{height}',
            '-framerate', str(fps),
            '-i', 'pipe:0',
            '-i', temp_wav,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',
            '-loglevel', 'error',
            output_mp4_path
        ]
        
        proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
        
        frame_idx = 0
        total_frames = int(total_duration * fps)
        
        for s_idx, scene in enumerate(scenes):
            s_duration = scene.get('durationSeconds', 4)
            s_frames = int(s_duration * fps)
            strategy_type = scene.get('renderStrategy', {}).get('type', 'motion_graphics')
            
            for f in range(s_frames):
                scene_time = f / fps
                img = Image.new('RGB', (width, height), (15, 17, 23))
                draw = ImageDraw.Draw(img)
                
                # Render according to strategy
                if strategy_type == 'procedural_3d':
                    render_procedural_3d_scene(draw, scene, scene_time, s_duration, width, height)
                elif strategy_type == 'motion_graphics':
                    render_motion_graphics_scene(draw, scene, scene_time, s_duration, width, height)
                elif strategy_type == 'uploaded_media':
                    render_uploaded_media_scene(draw, scene, scene_time, s_duration, width, height)
                else:
                    render_motion_graphics_scene(draw, scene, scene_time, s_duration, width, height)
                    
                # Subtitles
                render_subtitles(draw, scene, scene_time, width, height, is_hindi=is_hindi)
                
                # Scene transition fade in/out
                transition = scene.get('transition', 'fade')
                if transition in ['fade', 'dissolve'] and f < 10:
                    alpha = 1.0 - (f / 10.0)
                    fade_mask = Image.new('RGB', (width, height), (0, 0, 0))
                    img = Image.blend(img, fade_mask, alpha * 0.6)
                elif transition in ['fade', 'dissolve'] and f > s_frames - 10:
                    alpha = (f - (s_frames - 10)) / 10.0
                    fade_mask = Image.new('RGB', (width, height), (0, 0, 0))
                    img = Image.blend(img, fade_mask, alpha * 0.6)
                
                proc.stdin.write(img.tobytes())
                frame_idx += 1
                
        proc.stdin.close()
        proc.wait()
        
        if proc.returncode != 0:
            raise RuntimeError(f"FFmpeg render process failed with code {proc.returncode}")
            
        print(f"✅ Video export completed successfully: {output_mp4_path} ({os.path.getsize(output_mp4_path):,} bytes)")
    finally:
        if os.path.exists(temp_wav):
            os.remove(temp_wav)

def main():
    if len(sys.argv) < 4:
        print("Usage: procedural_renderer.py <project_json_file> <scene_plan_json_file> <output_mp4_path>")
        sys.exit(1)
        
    project_file = sys.argv[1]
    scene_plan_file = sys.argv[2]
    output_mp4 = sys.argv[3]
    
    with open(project_file, 'r', encoding='utf-8') as f:
        project_data = json.load(f)
    with open(scene_plan_file, 'r', encoding='utf-8') as f:
        scene_plan_data = json.load(f)
        
    render_project_video(project_data, scene_plan_data, output_mp4)

if __name__ == '__main__':
    main()

