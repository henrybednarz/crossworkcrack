// Center-crops a File or a <video> frame to a square JPEG data URL.
export async function toSquareJpeg(source, { size = 256, mirror = false } = {}) {
    const image = source instanceof Blob ? await createImageBitmap(source) : source;
    const width = image.videoWidth || image.width;
    const height = image.videoHeight || image.height;
    const side = Math.min(width, height);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (mirror) {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(image, (width - side) / 2, (height - side) / 2, side, side, 0, 0, size, size);
    image.close?.();
    return canvas.toDataURL('image/jpeg', 0.85);
}
