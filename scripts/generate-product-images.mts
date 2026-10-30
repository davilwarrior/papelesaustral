/**
 * Genera las fotos de producto de /productos con la API de imágenes de OpenAI.
 *
 *   node --env-file=.env --experimental-strip-types scripts/generate-product-images.mts [slug...]
 *
 * Sin argumentos genera solo las imágenes que faltan en public/images/productos.
 * Con slugs regenera esas aunque ya existan.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "images", "productos");
const MODEL = "gpt-image-2";
const CONCURRENCY = 4;

const STYLE = [
  "Professional studio product photograph for a premium paper distributor's online catalog.",
  "Seamless warm off-white paper backdrop (#F2F0EB), soft diffused daylight from the upper left,",
  "gentle realistic contact shadows, slightly elevated three-quarter view, photorealistic, crisp detail",
  "of paper fibers, edges and sheet thickness, minimal premium composition, subject centered with generous",
  "negative space around it, every object fully inside the frame with nothing cropped at the edges,",
  "consistent catalog lighting.",
  "No people, no hands, no real-world brand names or logos, no watermark.",
  "Any printed label uses clean modern sans-serif typography in dark navy blue (#0B1F3A) with a thin forest green (#3E7A3E) accent stripe,",
  "and the label text must be spelled exactly as given and nothing else.",
  "If no label text is given below, show absolutely no labels, bands, stickers or text anywhere in the image.",
].join(" ");

const label = (text: string) => `The wrapper label or paper band reads exactly: "${text}".`;

const subjects: Record<string, string> = {
  "papel-fotocopia":
    `A neatly wrapped ream of white A4 office copy paper lying flat, with a second ream stacked slightly offset behind it, and a few loose bright white sheets fanned out in front. ${label("PAPEL FOTOCOPIA · A4 · 75 g")}`,
  "bobinas-de-papel":
    "A tidy group of five small thermal paper rolls for cash registers and card terminals, standing and lying at different angles, one roll partially unrolled showing a clean white strip of paper curling across the surface.",
  "papel-bond":
    `A large ream of white bond paper, wrapped in matte white paper with a printed label, lying flat; beside it a few loose sheets with one sheet gently curled upward showing its smooth uncoated surface. ${label("PAPEL BOND · 75 g")}`,
  "papel-bond-colores-pasteles":
    `A wrapped ream of pastel colored bond paper with its stacked edges visible showing layers of soft pink, light yellow, sky blue and mint green; beside it loose fanned sheets in those same pastel colors with the pink sheet curling upward. ${label("PAPEL BOND · COLORES PASTELES")}`,
  "papel-couche-brillante-c2s":
    `A wrapped ream of glossy coated paper lying flat; beside it three loose bright white sheets, the top one elegantly curling upward with a visible glossy specular highlight across its surface. ${label("PAPEL COUCHÉ C2S · BRILLANTE")}`,
  "papel-couche-mate":
    `A wrapped ream of matte coated paper lying flat; beside it loose bright white sheets with a soft velvety matte surface and no glare, one sheet gently curling upward. ${label("PAPEL COUCHÉ · MATE")}`,
  "papel-etiqueta-c1s":
    `A wrapped ream of label paper glossy on one side; beside it a loose sheet curling upward that clearly shows the glossy coated front face and the uncoated matte back face. ${label("PAPEL ETIQUETA C1S · BRILLO 1 CARA")}`,
  "papel-kraft":
    `A large roll of natural brown kraft paper lying on its side with a length unrolled toward the camera, next to a small neat stack of flat kraft sheets, showing the warm brown fibrous texture. ${label("PAPEL KRAFT")}`,
  "papel-periodico":
    "A tall neat stack of blank unprinted newsprint paper sheets with a slightly off-white greyish tone, the top sheet softly curled, showing the light uncoated, slightly rough texture. Absolutely no printed text on the paper.",
  "papel-de-empaque":
    "Several sheets of plain blank packaging wrapping paper in natural light brown and white, loosely folded and layered, with a simple gift box partially wrapped in the brown paper and tied with twine, no printing.",
  "papelografos":
    `A thick pad of large blank white flip chart sheets (papelógrafos) lying flat at an angle, with the top sheet slightly lifted at the corner, and a few large white sheets loosely rolled into a tube beside it. No writing on the paper. ${label("PAPELÓGRAFOS")}`,
  "cartulina-triplex-respaldo-blanco":
    `A neat stack of rigid white paperboard sheets, slightly fanned so the thick edges are visible, with one sheet flexed and standing to show the bright white coated front and white back, next to a simple unprinted white folding carton box. ${label("CARTULINA TRÍPLEX · RESPALDO BLANCO")}`,
  "cartulina-duplex-respaldo-blanco":
    `A neat stack of white duplex paperboard sheets, slightly fanned showing the board thickness, one sheet lifted showing a bright white coated front and a slightly greyish white back, beside a plain unprinted white folding box. ${label("CARTULINA DÚPLEX · RESPALDO BLANCO")}`,
  "cartulina-duplex-respaldo-cafe":
    `A neat stack of duplex paperboard sheets with a bright white coated front and a natural brown kraft back, one corner turned up to clearly show the brown reverse side, beside a plain unprinted folding box with its brown interior visible. ${label("CARTULINA DÚPLEX · RESPALDO CAFÉ")}`,
  "cartulina-duplex-2-caras-cafe":
    `A neat stack of natural brown paperboard sheets brown on both faces, slightly fanned showing thickness, with one sheet bent upward, beside a plain unprinted brown folding box, warm earthy tones. ${label("CARTULINA DÚPLEX · 2 CARAS CAFÉ")}`,
  "cartulina-ecologica-natural":
    "A neat stack of natural ecological paperboard in warm unbleached cream tone with visible natural fibers and subtle flecks, one sheet lifted at the corner, with a small sprig of green eucalyptus leaves resting nearby for an eco feel.",
  "cartulinas-satinadas":
    `A fanned set of smooth satin finish cardstock sheets in white and ivory, with a short stack of blank unprinted business cards and an elegant blank invitation card resting on top, soft subtle sheen on the surface. ${label("CARTULINA SATINADA")}`,
  "cartulina-bristol":
    `A fanned stack of bristol board sheets in vivid assorted colors: white, yellow, orange, red, green, light blue and pink, arranged in an elegant rainbow fan, crisp edges, smooth surface. ${label("CARTULINA BRISTOL · COLORES")}`,
  "carton-gris-prensado":
    `A neat stack of thick rigid grey chipboard boards, edges sharp and slightly fanned to show their millimeter thickness and dense pressed grey fibers, beside a hardcover book cover being built from the grey board. ${label("CARTÓN GRIS PRENSADO")}`,
  "carton-paja":
    `A neat stack of thick straw board sheets in a yellowish golden tone with visible pressed straw fibers, slightly fanned to show their thickness and rigid edges. ${label("CARTÓN PAJA")}`,
  "cartulina-respaldo-blanco-con-polietileno":
    `A stack of white paperboard sheets with a polyethylene coating showing a subtle plastic sheen on the surface, one sheet curved upward, beside a few plain unprinted white paper cups and a white paper plate made from it, a few droplets of water beading on the coated surface. ${label("CARTULINA CON POLIETILENO · RESPALDO BLANCO")}`,
  "cartulina-respaldo-cafe-con-polietileno":
    `A stack of paperboard sheets with a white polyethylene coated face and natural brown back, one corner curled to show the brown reverse, beside plain unprinted kraft brown paper cups and a brown food container, water droplets beading on the coated surface. ${label("CARTULINA CON POLIETILENO · RESPALDO CAFÉ")}`,
  "cartulina-antigrasa-kit-7":
    `Sheets of natural unbleached greaseproof paperboard in warm cream tone, beside a plain unprinted folded takeaway food box and a small pastry box made from the same material, with a golden croissant resting on a greaseproof sheet without any stain. ${label("CARTULINA ANTIGRASA · KIT 7")}`,
  "papel-alimenticio":
    "Plain white food-grade wrapping paper sheets, one sheet loosely wrapping a fresh artisan baguette and another used as a liner under a few cookies, clean and hygienic, no printing.",
  "papel-adhesivo":
    "Two sheets of white glossy self-adhesive paper, the top sheet with a corner peeled back to reveal the light siliconized release liner underneath, with a few blank die-cut round and rectangular labels peeled off and resting nearby. No printing on the labels.",
  "papel-quimico-autocopiativo":
    "A fanned set of carbonless copy paper sheets in white, pink, yellow and light blue, slightly offset so each color is visible, beside a small blank form pad bound at the top edge. No text or writing on the paper.",
};

async function generate(slug: string, prompt: string) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: `${STYLE}\n\nSubject: ${prompt}`,
      size: "1536x1024",
      quality: "high",
      output_format: "webp",
      output_compression: 82,
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${slug}: ${json.error?.message ?? response.status}`);
  writeFileSync(join(OUT_DIR, `${slug}.webp`), Buffer.from(json.data[0].b64_json, "base64"));
  console.log(`✓ ${slug}`);
}

if (!process.env.OPENAI_API_KEY) throw new Error("Falta OPENAI_API_KEY en .env");
mkdirSync(OUT_DIR, { recursive: true });

const requested = process.argv.slice(2);
const queue = Object.entries(subjects).filter(([slug]) =>
  requested.length ? requested.includes(slug) : !existsSync(join(OUT_DIR, `${slug}.webp`)),
);

let failed = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      await generate(...item).catch((error) => {
        failed++;
        console.error(`✗ ${error.message}`);
      });
    }
  }),
);
if (failed) process.exitCode = 1;
