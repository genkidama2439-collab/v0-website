/**
 * Generates a minimal blur data URL for image placeholders
 * This provides a better UX during image loading
 */
export function getBlurDataURL(color = "#10b981"): string {
  // 1x1 pixel base64 encoded image with the specified color
  const svg = `
    <svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">
      <rect width="1" height="1" fill="${color}"/>
    </svg>
  `
  const base64 = Buffer.from(svg).toString("base64")
  return `data:image/svg+xml;base64,${base64}`
}

// Predefined blur data URLs for common use cases
export const BLUR_DATA_URLS = {
  emerald: getBlurDataURL("#10b981"),
  ocean: getBlurDataURL("#0ea5e9"),
  sand: getBlurDataURL("#f59e0b"),
  neutral: getBlurDataURL("#6b7280"),
}
