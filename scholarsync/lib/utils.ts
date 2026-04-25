/**
 * Dependency-free utility for merging class names (NativeWind support).
 * Mimics clsx/join functionality.
 */
export function cn(...inputs: any[]) {
  return inputs
    .flat()
    .filter((v) => v !== Boolean(v) && v !== null && v !== undefined && v !== "")
    .join(" ");
}
