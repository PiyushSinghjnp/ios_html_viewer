import os
from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with RGBA
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 512.0
    
    # Draw gradient-like background rounded rect
    corner_radius = int(115 * scale)
    
    # We can create a vertical gradient
    for y in range(size):
        ratio = y / float(size)
        # Interpolate between #1e40af (30, 64, 175) and #3b82f6 (59, 130, 246)
        r = int(30 + (59 - 30) * ratio)
        g = int(64 + (130 - 64) * ratio)
        b = int(175 + (246 - 175) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
        
    # Apply rounded corner mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=corner_radius, fill=255)
    
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg.paste(img, (0, 0), mask=mask)
    
    # Draw content on top
    draw = ImageDraw.Draw(bg)
    
    # Document paper: x=120, y=90, w=272, h=340
    px0 = int(120 * scale)
    py0 = int(90 * scale)
    px1 = int((120 + 272) * scale)
    py1 = int((90 + 340) * scale)
    prad = max(2, int(20 * scale))
    
    # Paper shadow
    shadow_mask = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_mask)
    s_draw.rounded_rectangle([(px0, py0 + int(8*scale)), (px1, py1 + int(8*scale))], radius=prad, fill=(0, 0, 0, 60))
    bg = Image.alpha_composite(bg, shadow_mask)
    draw = ImageDraw.Draw(bg)
    
    # White paper sheet
    draw.rounded_rectangle([(px0, py0), (px1, py1)], radius=prad, fill=(255, 255, 255, 255))
    
    # Blue header bar on paper
    draw.rounded_rectangle([(int(150*scale), int(130*scale)), (int(270*scale), int(148*scale))], radius=max(2, int(9*scale)), fill=(37, 99, 235, 255))
    
    # Gray text lines on paper
    draw.rounded_rectangle([(int(150*scale), int(165*scale)), (int(362*scale), int(175*scale))], radius=max(1, int(5*scale)), fill=(203, 213, 225, 255))
    draw.rounded_rectangle([(int(150*scale), int(190*scale)), (int(330*scale), int(200*scale))], radius=max(1, int(5*scale)), fill=(203, 213, 225, 255))
    
    # Checklist 1: Green circle + line
    c1_y = int(245 * scale)
    c1_x = int(165 * scale)
    cr = max(3, int(14 * scale))
    draw.ellipse([(c1_x - cr, c1_y - cr), (c1_x + cr, c1_y + cr)], fill=(16, 185, 129, 255))
    draw.line([(c1_x - int(5*scale), c1_y), (c1_x - int(1*scale), c1_y + int(4*scale)), (c1_x + int(6*scale), c1_y - int(4*scale))], fill=(255, 255, 255, 255), width=max(1, int(3*scale)))
    draw.rounded_rectangle([(int(195*scale), int(240*scale)), (int(345*scale), int(250*scale))], radius=max(1, int(5*scale)), fill=(100, 116, 139, 255))
    
    # Checklist 2: Green circle + line
    c2_y = int(295 * scale)
    c2_x = int(165 * scale)
    draw.ellipse([(c2_x - cr, c2_y - cr), (c2_x + cr, c2_y + cr)], fill=(16, 185, 129, 255))
    draw.line([(c2_x - int(5*scale), c2_y), (c2_x - int(1*scale), c2_y + int(4*scale)), (c2_x + int(6*scale), c2_y - int(4*scale))], fill=(255, 255, 255, 255), width=max(1, int(3*scale)))
    draw.rounded_rectangle([(int(195*scale), int(290*scale)), (int(325*scale), int(300*scale))], radius=max(1, int(5*scale)), fill=(100, 116, 139, 255))

    # Checklist 3: Blue active bullet
    c3_y = int(345 * scale)
    c3_x = int(165 * scale)
    draw.ellipse([(c3_x - cr, c3_y - cr), (c3_x + cr, c3_y + cr)], fill=(59, 130, 246, 255))
    draw.ellipse([(c3_x - int(5*scale), c3_y - int(5*scale)), (c3_x + int(5*scale), c3_y + int(5*scale))], fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(int(195*scale), int(340*scale)), (int(305*scale), int(350*scale))], radius=max(1, int(5*scale)), fill=(100, 116, 139, 255))

    # Bottom badge
    draw.rounded_rectangle([(int(150*scale), int(388*scale)), (int(230*scale), int(404*scale))], radius=max(2, int(8*scale)), fill=(224, 231, 255, 255))
    draw.rounded_rectangle([(int(158*scale), int(393*scale)), (int(222*scale), int(399*scale))], radius=max(1, int(3*scale)), fill=(67, 56, 202, 255))

    return bg

os.makedirs("icons", exist_ok=True)
create_icon(180).save("icons/apple-touch-icon.png", "PNG")
create_icon(180).save("icons/icon-180.png", "PNG")
create_icon(192).save("icons/icon-192.png", "PNG")
create_icon(512).save("icons/icon-512.png", "PNG")
print("Icons generated successfully!")
