// @ts-nocheck
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");

function readProjectFile(path: string) {
  return readFileSync(resolve(root, path), "utf-8");
}

describe("PWA and social metadata", () => {
  it("declares OGP, Twitter, and install metadata", () => {
    const html = readProjectFile("index.html");

    expect(html).toContain('<meta name="theme-color" content="#ff8a00" />');
    expect(html).toContain('<link rel="manifest" href="/coffee_timer/manifest.webmanifest" />');
    expect(html).toContain('<meta property="og:title" content="46 Method Timer" />');
    expect(html).toContain(
      '<meta property="og:url" content="https://shunmatsushita.github.io/coffee_timer/" />',
    );
    expect(html).toContain(
      'content="https://shunmatsushita.github.io/coffee_timer/og-image.svg"',
    );
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  it("provides a manifest scoped to the GitHub Pages base path", () => {
    const manifest = JSON.parse(readProjectFile("public/manifest.webmanifest"));

    expect(manifest).toMatchObject({
      name: "46 Method Timer",
      short_name: "46 Timer",
      start_url: "/coffee_timer/",
      scope: "/coffee_timer/",
      display: "standalone",
      theme_color: "#ff8a00",
      background_color: "#ffffff",
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/coffee_timer/icon.svg", sizes: "any" }),
        expect.objectContaining({ src: "/coffee_timer/maskable-icon.svg", purpose: "maskable" }),
      ]),
    );
  });

  it("registers a service worker from the Vite base URL", () => {
    const main = readProjectFile("src/main.tsx");
    const registration = readProjectFile("src/registerServiceWorker.ts");
    const serviceWorker = readProjectFile("public/sw.js");

    expect(main).toContain('import "./registerServiceWorker";');
    expect(registration).toContain('navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)');
    expect(serviceWorker).toContain("coffee-timer-shell-v1");
    expect(serviceWorker).toContain("/coffee_timer/");
  });
});
