const MAX_DIM = 1600;
const QUALITY = 0.8;

export function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (file.size < 500_000) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
