# Public Folder

This folder contains static assets that are served by Next.js.

## How to add images for Carousel3D:

1. **Place your image files directly in this `public` folder**
   - Example: `public/my-image.jpg`
   - Example: `public/carousel-image-1.png`

2. **Reference them in Carousel3D.tsx using a path starting with `/`**
   - Example: `/my-image.jpg`
   - Example: `/carousel-image-1.png`

3. **File naming tips:**
   - Use lowercase letters and hyphens: `my-image.jpg` (not `My Image.jpg`)
   - Avoid spaces in filenames
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

## Example:

If you add an image at: `public/carousel-1.jpg`

Then in `components/Carousel3D.tsx`, add it to the images array like:
```javascript
const images = [
  '/carousel-1.jpg',  // References public/carousel-1.jpg
  // ... other images
];
```

## Note:
Files in the `public` folder are served from the root URL, so `/image.jpg` maps to `public/image.jpg`.

