/**
 * Small scaffold for future external assets. The current game is procedural,
 * but centralizing async loading avoids future ad-hoc fetch logic.
 */
export class AssetLoader {
  private cache = new Map<string, Promise<unknown>>();

  public loadText(url: string): Promise<string> {
    return this.load(url, async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load asset: ${url}`);
      }

      return response.text();
    });
  }

  public loadBlob(url: string): Promise<Blob> {
    return this.load(url, async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load asset: ${url}`);
      }

      return response.blob();
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  private load<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!this.cache.has(key)) {
      this.cache.set(key, loader());
    }

    return this.cache.get(key) as Promise<T>;
  }
}
