import tkinter as tk
from PIL import Image, ImageTk

root = tk.Tk()
root.title("BloomBuilder — ByteBloom")

canvas = tk.Canvas(root, width=400, height=400)
canvas.pack()

# Load base image
base_img = Image.open("GUI-assets/base-body.png")
base_photo = ImageTk.PhotoImage(base_img)
canvas.create_image(200, 200, image=base_photo)

# Overlay logic
def add_overlay(path):
    overlay = Image.open(path)
    overlay_photo = ImageTk.PhotoImage(overlay)
    canvas.create_image(200, 200, image=overlay_photo)

btn1 = tk.Button(root, text="Add Glitch Wings", command=lambda: add_overlay("GUI-assets/overlays/glitch-wings.png"))
btn1.pack()

btn2 = tk.Button(root, text="Add Petal Eyes", command=lambda: add_overlay("GUI-assets/overlays/petal-eyes.png"))
btn2.pack()

btn3 = tk.Button(root, text="Add Chaos Core", command=lambda: add_overlay("GUI-assets/overlays/chaos-core.png"))
btn3.pack()

root.mainloop()
