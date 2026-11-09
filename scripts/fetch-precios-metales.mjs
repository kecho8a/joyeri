/**
 * Obtiene las tasas diarias de compra/venta de metales preciosos del
 * Banco de la República (fuente oficial colombiana) y las publica en
 * public/precios-metales.json para la etiqueta del dashboard.
 *
 * Uso: node scripts/fetch-precios-metales.mjs
 * Sale con código 1 si la fuente oficial no responde o los datos son
 * inválidos (para que el workflow NO pise el JSON vigente).
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCES = [
  'https://www.banrep.gov.co/es/banco/otros-servicios/compra-venta-metales-preciosos',
  'https://d1b4gd4m8561gs.cloudfront.net/es/banco/otros-servicios/compra-venta-metales-preciosos',
];

const CANONICAL_URL = SOURCES[0];
const OUT_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'precios-metales.json'
);

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
};

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#\d+;/g, '')
    .trim();
}

function extractCells(tableHtml) {
  const cells = [];
  const re = /<td[^>]*>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = re.exec(tableHtml)) !== null) {
    cells.push(decodeEntities(stripTags(m[1])));
  }
  return cells;
}

function parseCOP(value) {
  const n = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

function toISODate(dd, mm, yyyy) {
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function parseTable(cells) {
  const title = cells[0] || '';
  const metalMatch = title.match(/^(ORO|PLATA|PLATINO)\s*\(GRAMO\)/);
  if (!metalMatch) return null;

  const numberRe = /^[\d.]+,\d{1,2}$/;
  const nums = cells.filter((c) => numberRe.test(c));
  const dateCell = cells.find((c) =>
    /\d{1,2}\/\d{1,2}\/\d{4}\s+al\s+\d{1,2}\/\d{1,2}\/\d{4}/.test(c)
  );
  if (nums.length < 2 || !dateCell) return null;

  const dm = dateCell.match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+al\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/
  );

  return {
    metal: metalMatch[1].toLowerCase(),
    compra: parseCOP(nums[0]),
    venta: parseCOP(nums[1]),
    vigencia: {
      desde: toISODate(dm[1], dm[2], dm[3]),
      hasta: toISODate(dm[4], dm[5], dm[6]),
      texto: dateCell,
    },
  };
}

async function fetchOfficialHtml() {
  let lastError = null;
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, {
        headers: BROWSER_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} desde ${url}`);
      const html = await res.text();
      if (!html.includes('ORO (GRAMO)')) {
        throw new Error(`Respuesta sin precios (proteccion bot) desde ${url}`);
      }
      return html;
    } catch (err) {
      lastError = err;
      console.warn(`WARN: ${err.message}`);
    }
  }
  throw lastError ?? new Error('Ninguna fuente oficial respondio');
}

function buildPayload(html) {
  const tableRe = /<table[^>]*class="table"[^>]*>([\s\S]*?)<\/table>/g;
  const results = {};
  let m;
  while ((m = tableRe.exec(html)) !== null) {
    const parsed = parseTable(extractCells(m[1]));
    if (parsed && !(parsed.metal in results)) {
      results[parsed.metal] = parsed;
    }
  }

  if (!results.oro || !results.plata) {
    throw new Error('No se encontraron las tablas de ORO y/o PLATA');
  }
  if (!results.platino) {
    console.warn('WARN: tabla de PLATINO no encontrada (opcional)');
  }

  for (const [metal, r] of Object.entries(results)) {
    if (!(r.compra > 0) || !(r.venta > 0)) {
      throw new Error(`Precios invalidos para ${metal}`);
    }
    if (r.venta <= r.compra) {
      throw new Error(
        `Venta <= compra para ${metal} (${r.venta} <= ${r.compra}): posible parseo erroneo`
      );
    }
  }

  const vigencia = results.oro.vigencia;
  const hoy = new Date().toISOString().slice(0, 10);
  if (hoy < vigencia.desde || hoy > vigencia.hasta) {
    console.warn(
      `WARN: la vigencia oficial (${vigencia.texto}) no cubre hoy (${hoy}); se publica igualmente el ultimo dato oficial`
    );
  }

  const payload = {
    fuente: 'Banco de la Republica de Colombia',
    url: CANONICAL_URL,
    obtenidoEn: new Date().toISOString(),
    vigencia,
    metales: {},
  };
  for (const metal of ['oro', 'plata', 'platino']) {
    if (results[metal]) {
      payload.metales[metal] = {
        compra: results[metal].compra,
        venta: results[metal].venta,
      };
    }
  }
  return payload;
}

async function preserveTimestamp(payload) {
  try {
    const prev = JSON.parse(await readFile(OUT_FILE, 'utf8'));
    const same =
      JSON.stringify(prev.metales) === JSON.stringify(payload.metales) &&
      JSON.stringify(prev.vigencia) === JSON.stringify(payload.vigencia);
    if (same && prev.obtenidoEn) {
      // Sin cambios de datos: conserva el timestamp para que git no genere
      // commits diarios sin variacion real.
      payload.obtenidoEn = prev.obtenidoEn;
      console.log('Datos sin cambios respecto del JSON vigente.');
    }
  } catch {
    // JSON inexistente o ilegible: se genera uno nuevo.
  }
}

async function main() {
  const html = await fetchOfficialHtml();
  const payload = buildPayload(html);
  await preserveTimestamp(payload);
  await writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Escrito: ${OUT_FILE}`);
  console.log(`Vigencia: ${payload.vigencia.texto}`);
  for (const [metal, p] of Object.entries(payload.metales)) {
    console.log(
      `${metal.toUpperCase()}: compra ${p.compra.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
      })} / venta ${p.venta.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP/g`
    );
  }
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
