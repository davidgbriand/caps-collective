
from PIL import Image
import collections

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        pixels = img.getdata()
        
        # Colors to ignore (approximate Navy and Transparent)
        # Navy is #00245D => (0, 36, 93)
        # We will ignore anything very dark or fully transparent
        
        colors = []
        for r, g, b, a in pixels:
            if a < 50: # Transparent
                continue
            
            # Simple darkness check to filter out Navy
            if r < 50 and g < 100 and b < 150:
                continue
                
            colors.append((r, g, b))
            
        if not colors:
            print("No non-navy colors found.")
            return

        counter = collections.Counter(colors)
        most_common = counter.most_common(5)
        
        print("Most common colors (R, G, B):")
        for color, count in most_common:
            hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
            print(f"Color: {color}, Hex: {hex_color}, Count: {count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_dominant_color("public/together-we-dare-transparent.png")
