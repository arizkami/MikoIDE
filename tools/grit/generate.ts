import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

const manifestPath = process.argv[2] || "renderer/dist/manifest.json";
const outputPath = process.argv[3] || "resources/resources.grd";

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const baseDir = dirname(manifestPath);

const includes: string[] = [];

Object.keys(manifest).forEach((key) => {
  const entry = manifest[key];

  // main js
  if (entry.file) {
    includes.push(
      `      <include name="IDR_${entry.file
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toUpperCase()}" file="${join("renderer/dist", entry.file)}" type="BINDATA" />`
    );
  }

  // css
  if (entry.css) {
    entry.css.forEach((cssFile: string) => {
      includes.push(
        `      <include name="IDR_${cssFile
          .replace(/[^a-zA-Z0-9]/g, "_")
          .toUpperCase()}" file="${join("renderer/dist", cssFile)}" type="BINDATA" />`
      );
    });
  }

  // assets
  if (entry.assets) {
    entry.assets.forEach((assetFile: string) => {
      includes.push(
        `      <include name="IDR_${assetFile
          .replace(/[^a-zA-Z0-9]/g, "_")
          .toUpperCase()}" file="${join("renderer/dist", assetFile)}" type="BINDATA" />`
      );
    });
  }
});

const grd = `<?xml version="1.0" encoding="UTF-8"?>
<grit base_dir="." latest_public_release="1" current_release="1" output_all_resource_defines="false">
  <outputs>
    <output filename="out/resources.pak" type="data_package" />
  </outputs>

  <release seq="1">
    <includes>
${includes.join("\n")}
    </includes>
  </release>
</grit>
`;

writeFileSync(outputPath, grd, "utf-8");
console.log(`✅ Generated ${outputPath}`);