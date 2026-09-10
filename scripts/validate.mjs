import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const failures = [];

const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const html = read("dist/index.html");
const css = read("dist/assets/css/styles.css");
const app = read("dist/assets/js/app.js");
const greetingsSource = read("dist/assets/js/greetings.js");
const visibleSource = `${html}\n${app}\n${greetingsSource}`;

assert(fs.existsSync(path.join(distRoot, "index.html")), "dist/index.html is missing");
assert(!visibleSource.includes("—"), "An em dash is present in visible site source");
assert(!/\bHOD\b/i.test(visibleSource), "HOD appears in the website");
assert(!/Marketing\s+and\s+Design/i.test(visibleSource), "A restricted department phrase appears in the website");
assert(!/(YOUR_IMAGE|YOUR_USERNAME|YOUR_REPOSITORY|ADD PHOTO HERE|replace-with|TODO)/i.test(visibleSource), "A placeholder remains in the website");
assert(!/(\/mnt\/data|\/workspace\/|C:\\Users\\|blob:|localhost)/i.test(visibleSource), "A temporary or local-only path remains in the website");
assert(!/A TANVEER SINGH PICTURE/i.test(html), "The removed opening credit is still present");
assert(!html.includes('id="intermission"'), "The removed Birthday Chaos section is still present");
assert(!html.includes("creator-credit"), "The removed creator credit is still present");
assert(html.includes("11 SEPTEMBER"), "The updated 11 September birthday date is missing");
assert(html.includes("<span>11</span><b>/</b><span>09</span>"), "The large 11/09 date is missing");
assert(!/(10 SEPTEMBER|10 SEP|10\.09\.26)/.test(html), "An old 10 September birthday date remains");
assert(html.includes("REEL 04 / 20 TELEGRAMS"), "The message archive count is not updated");
assert(css.includes("scroll-snap-type: x mandatory"), "The mobile film strip interaction is missing");

const htmlAssetMatches = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
for (const assetPath of htmlAssetMatches) {
  if (/^(?:https?:|#|mailto:|tel:)/.test(assetPath)) continue;
  const localPath = path.resolve(distRoot, assetPath);
  assert(fs.existsSync(localPath), `Missing HTML asset: ${assetPath}`);
}

const cssAssetMatches = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]);
for (const assetPath of cssAssetMatches) {
  if (/^(?:https?:|data:)/.test(assetPath)) continue;
  const localPath = path.resolve(distRoot, "assets/css", assetPath);
  assert(fs.existsSync(localPath), `Missing CSS asset: ${assetPath}`);
}

for (let index = 1; index <= 8; index += 1) {
  const number = String(index).padStart(2, "0");
  assert(fs.existsSync(path.join(distRoot, `assets/images/rupinder-${number}.webp`)), `Optimized photo ${number} is missing`);
  assert(fs.existsSync(path.join(distRoot, `assets/images/originals/rupinder-original-${number}.png`)), `Original photo ${number} is missing`);
}

const context = { window: {} };
vm.runInNewContext(greetingsSource, context);
const greetings = context.window.RUPINDER_GREETINGS;
const expectedNames = ["Nandini", "Tanveer", "Hardika", "Meenakshi", "Nusrat", "Vishwjeet", "Kulbir", "Navriti", "Manoj", "Sonia", "Himanshi", "Amit", "Navjyot", "Gagan", "Malika", "Sagar", "Chinu", "Anshul", "Kanu", "Shashank"];
assert(Array.isArray(greetings), "Greeting data did not load");
assert(greetings?.length === 20, `Expected 20 greetings, found ${greetings?.length ?? 0}`);
assert(expectedNames.every((name) => greetings?.some((greeting) => greeting.name === name)), "One or more greeting names are missing");
assert(greetings?.every((greeting) => greeting.message.trim().length > 0), "One or more greetings are empty");

if (failures.length) {
  console.error("Validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Validation passed: assets, messages, paths, and content rules are intact.");
