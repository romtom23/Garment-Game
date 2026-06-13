/**
 * Loads an image URL in the browser to read its aspect ratio and a
 * representative average color. The average color is stored on the decoration
 * so the puffed 3D plush mesh (which samples flat colors per cell) still shows
 * something close to the artwork.
 */
export async function loadImageMeta(
  url: string,
): Promise<{ aspect: number; avgColor: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight || 1
      let avgColor = '#cccccc'
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size)
          const { data } = ctx.getImageData(0, 0, size, size)
          let r = 0
          let g = 0
          let b = 0
          let count = 0
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3]
            if (alpha < 32) continue // skip transparent pixels
            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            count++
          }
          if (count > 0) {
            r = Math.round(r / count)
            g = Math.round(g / count)
            b = Math.round(b / count)
            avgColor = `#${[r, g, b]
              .map((v) => v.toString(16).padStart(2, '0'))
              .join('')}`
          }
        }
      } catch {
        // canvas may taint on some hosts; fall back to the default gray
      }
      resolve({ aspect, avgColor })
    }
    img.onerror = () => resolve({ aspect: 1, avgColor: '#cccccc' })
    img.src = url
  })
}
