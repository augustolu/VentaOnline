/**
 * ============================================================
 *  scraper.js — Scraper de Imágenes de Productos
 * ============================================================
 *  Lee un Excel de productos, busca imágenes en Google Images
 *  con Puppeteer, las optimiza con Sharp y genera un archivo SQL
 *  con las sentencias UPDATE para importar las URLs.
 *
 *  Autor:   E-Commerce Local
 *  Requiere: Node.js >= 18.0.0  |  type: "module" en package.json
 * ============================================================
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import axios from 'axios';
import sharp from 'sharp';

// ────────────────────────────────────────────────────────────
//  ⚙️  CONFIGURACIÓN — Ajusta esto a tu archivo Excel
// ────────────────────────────────────────────────────────────

const CONFIG = {
    // Archivo Excel a procesar (relativo al directorio del script)
    excelPath: './productos.xlsx',

    // Número de la primera fila de datos (2 = fila 2, omitiendo cabeceras)
    dataStartRow: 2,

    // ┌─────────────────────────────────────────────────────────┐
    // │  Mapeo de columnas Excel → campo del producto            │
    // │  Usa la letra de columna tal como aparece en Excel.      │
    // └─────────────────────────────────────────────────────────┘
    columnas: {
        id: 'A',   // Columna A  →  ID del producto (UUID)
        marca: 'B',   // Columna B  →  Marca
        modelo: 'C',   // Columna C  →  Modelo
        nombre: 'D',   // Columna D  →  Nombre/Descripción adicional (puede estar vacío)
    },

    // Carpeta de salida para imágenes y archivos generados
    outputDir: './output/images',
    sqlFile: './output/importar_imagenes.sql',
    logFile: './output/errores.log',

    // Pausa aleatoria entre productos (ms) para evitar detección de bot
    delayMin: 3_000,
    delayMax: 7_000,

    // Dimensiones máximas de la imagen final en píxeles
    imageMaxWidth: 800,
    imageMaxHeight: 800,

    // Calidad WebP (1-100)
    webpQuality: 85,
};

// ────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────

/**
 * Pausa la ejecución un tiempo aleatorio entre [min, max] ms.
 * @param {number} min
 * @param {number} max
 */
const esperar = (min, max) =>
    new Promise((r) =>
        setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min)
    );

/**
 * Convierte una letra de columna Excel ('A', 'B', ..., 'Z', 'AA', ...) a índice base-1.
 * @param {string} col
 * @returns {number}
 */
function letraAIndice(col) {
    let n = 0;
    for (const ch of col.toUpperCase()) {
        n = n * 26 + ch.charCodeAt(0) - 64;
    }
    return n;
}

/**
 * Lee el valor de una celda usando la configuración de columnas.
 * @param {ExcelJS.Row} row
 * @param {string} campo - Clave en CONFIG.columnas ('id', 'marca', etc.)
 * @returns {string}
 */
function leerCelda(row, campo) {
    const idx = letraAIndice(CONFIG.columnas[campo]);
    const celda = row.getCell(idx);
    return String(celda.value ?? '').trim();
}

// ────────────────────────────────────────────────────────────
//  MÓDULO 1: Lector de Excel
// ────────────────────────────────────────────────────────────

/**
 * Lee todos los productos del Excel configurado.
 * Omite filas donde el ID esté vacío.
 *
 * @returns {Promise<Array<{id, marca, modelo, nombre}>>}
 */
async function leerProductosDesdeExcel() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(CONFIG.excelPath);

    const hoja = workbook.worksheets[0]; // Usa la primera hoja

    const productos = [];

    hoja.eachRow((row, rowNum) => {
        if (rowNum < CONFIG.dataStartRow) return; // Salta cabeceras

        const id = leerCelda(row, 'id');
        const marca = leerCelda(row, 'marca');
        const modelo = leerCelda(row, 'modelo');
        const nombre = leerCelda(row, 'nombre');

        if (!id) return; // Omite filas sin ID

        productos.push({ id, marca, modelo, nombre });
    });

    return productos;
}

// ────────────────────────────────────────────────────────────
//  MÓDULO 2: Búsqueda en Google Imágenes con Puppeteer
// ────────────────────────────────────────────────────────────

/**
 * Construye la URL de búsqueda de Google Imágenes para un producto.
 * Agrega "fondo blanco" para obtener imágenes sin fondo.
 *
 * @param {object} producto
 * @returns {string}
 */
function construirUrlBusqueda({ marca, modelo, nombre }) {
    const terminos = [marca, modelo, nombre, 'fondo blanco']
        .filter(Boolean)
        .join(' ');
    return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(terminos)}&tbs=isz:l`;
}

/**
 * Abre Google Imágenes y extrae la URL real (alta resolución) de la
 * primera imagen válida, saltando anuncios y miniaturas en base64.
 *
 * @param {puppeteer.Page} page   - Página Puppeteer activa.
 * @param {object}         producto
 * @returns {Promise<string>}     - URL directa de la imagen.
 * @throws {Error}                - Si no se encuentra ninguna imagen válida.
 */
async function buscarImagenEnGoogle(page, producto) {
    const urlBusqueda = construirUrlBusqueda(producto);

    console.log(`  🔍 Buscando: "${producto.marca} ${producto.modelo}" en Google Imágenes...`);
    await page.goto(urlBusqueda, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Rechaza cookies si aparece el banner (Google EU)
    try {
        const btnAceptar = await page.$('button[aria-label*="Aceptar"]');
        if (btnAceptar) await btnAceptar.click();
        await page.waitForTimeout(1_000);
    } catch {
        // No había banner, continuar
    }

    // Obtiene todas las miniaturas del grid de resultados
    // Filtra anuncios (clase Ads) y excluye data:URI (base64)
    const thumbnails = await page.$$('div[data-ri]');

    // Itera thumbnail por thumbnail hasta encontrar una imagen de alta res
    for (const thumbnail of thumbnails.slice(0, 8)) {
        try {
            // Hacer click en la miniatura para abrir el panel lateral con la imagen real
            await thumbnail.click();

            // Esperar a que el panel lateral cargue la imagen de alta resolución
            // La imagen de alta res tiene el atributo jsname="kn3ccd" y src real (no base64)
            const selectorImgAltaRes = 'img[jsname="kn3ccd"]';

            await page.waitForFunction(
                (sel) => {
                    const img = document.querySelector(sel);
                    return img && img.src && !img.src.startsWith('data:');
                },
                { timeout: 8_000 },
                selectorImgAltaRes
            );

            const urlImagen = await page.$eval(
                selectorImgAltaRes,
                (img) => img.src
            );

            // Validación extra: debe ser una URL HTTP real
            if (urlImagen && urlImagen.startsWith('http')) {
                console.log(`  ✅ URL encontrada: ${urlImagen.substring(0, 80)}...`);
                return urlImagen;
            }
        } catch {
            // Esta miniatura no cargó imagen válida, intentar la siguiente
            continue;
        }
    }

    throw new Error('No se encontró ninguna imagen de alta resolución válida.');
}

// ────────────────────────────────────────────────────────────
//  MÓDULO 3: Descarga y optimización de imagen (Axios + Sharp)
// ────────────────────────────────────────────────────────────

/**
 * Descarga una imagen desde una URL y la guarda como .webp optimizado.
 *
 * @param {string} urlImagen - URL directa de la imagen.
 * @param {string} id        - ID del producto (nombre del archivo de salida).
 * @returns {Promise<string>} - Ruta relativa del archivo guardado.
 */
async function descargarYOptimizarImagen(urlImagen, id) {
    // Descarga del buffer de la imagen
    const response = await axios.get(urlImagen, {
        responseType: 'arraybuffer',
        timeout: 15_000,
        headers: {
            // Simular cabecera de navegador para evitar bloqueos
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
    });

    const buffer = Buffer.from(response.data);

    // Procesamiento con Sharp:
    //  1. Redimensionar a máximo 800x800 (manteniendo proporción, sin upscale)
    //  2. Convertir a WebP con calidad configurada
    //  3. Eliminar metadatos EXIF para reducir peso
    const outputPath = path.join(CONFIG.outputDir, `${id}.webp`);

    await sharp(buffer)
        .resize({
            width: CONFIG.imageMaxWidth,
            height: CONFIG.imageMaxHeight,
            fit: 'inside',           // Mantiene proporción
            withoutEnlargement: true,    // No amplía imágenes pequeñas
        })
        .webp({ quality: CONFIG.webpQuality })
        .withMetadata(false)           // Elimina EXIF
        .toFile(outputPath);

    console.log(`  💾 Guardada: ${outputPath}`);
    return outputPath;
}

// ────────────────────────────────────────────────────────────
//  MÓDULO 4: Generador de SQL
// ────────────────────────────────────────────────────────────

/**
 * Escribe una sentencia UPDATE en el archivo SQL de salida.
 * Usa append para no sobreescribir líneas anteriores.
 *
 * @param {string} id - ID del producto.
 */
async function escribirSentenciaSQL(id) {
    const sentencia = `UPDATE products SET image_url = '${id}.webp' WHERE id = '${id}';\n`;
    await fs.appendFile(CONFIG.sqlFile, sentencia, 'utf8');
}

// ────────────────────────────────────────────────────────────
//  MÓDULO 5: Logger de errores
// ────────────────────────────────────────────────────────────

/**
 * Escribe una entrada de error en el log de errores.
 *
 * @param {object} producto
 * @param {Error}  error
 */
async function registrarError(producto, error) {
    const timestamp = new Date().toISOString();
    const entrada = `[${timestamp}] PRODUCTO_ID=${producto.id} ` +
        `(${producto.marca} ${producto.modelo}) — ERROR: ${error.message}\n`;
    await fs.appendFile(CONFIG.logFile, entrada, 'utf8');
}

// ────────────────────────────────────────────────────────────
//  ORQUESTADOR PRINCIPAL
// ────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🚀 Scraper de Imágenes de Productos — Iniciando  ');
    console.log('═══════════════════════════════════════════════════\n');

    // 1. Preparar directorios y limpiar archivos de salida anteriores
    await fs.mkdir(CONFIG.outputDir, { recursive: true });

    const outputDir = path.dirname(CONFIG.sqlFile);
    await fs.mkdir(outputDir, { recursive: true });

    // Limpiar archivos de sesiones anteriores (comienzan de cero)
    await fs.writeFile(CONFIG.sqlFile, '-- SQL generado automáticamente por scraper.js\n-- Ejecutar en MySQL DESPUÉS de verificar las imágenes.\n\n', 'utf8');
    await fs.writeFile(CONFIG.logFile, `--- Log de errores — Sesión ${new Date().toISOString()} ---\n\n`, 'utf8');

    // 2. Leer productos desde Excel
    let productos;
    try {
        productos = await leerProductosDesdeExcel();
        console.log(`📊 Productos encontrados en Excel: ${productos.length}\n`);
    } catch (err) {
        console.error(`❌ Error fatal al leer el Excel: ${err.message}`);
        console.error('   Verifica que el archivo existe y que CONFIG.excelPath es correcto.');
        process.exit(1);
    }

    // 3. Lanzar navegador Puppeteer en modo headless
    const browser = await puppeteer.launch({
        headless: 'new',            // Modo headless moderno de Puppeteer v22+
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',   // Oculta flag de automatización
            '--window-size=1280,900',
        ],
    });

    const page = await browser.newPage();

    // Configurar viewport y User-Agent para simular navegador real
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/122.0.0.0 Safari/537.36'
    );

    // Registrar estadísticas de la sesión
    const stats = { exitosos: 0, fallidos: 0, errores: [] };

    // 4. Procesar cada producto
    for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];
        const progreso = `[${i + 1}/${productos.length}]`;

        console.log(`\n${progreso} Procesando: ${producto.marca} ${producto.modelo} (ID: ${producto.id})`);
        console.log('─'.repeat(60));

        try {
            // 4a. Buscar imagen en Google
            const urlImagen = await buscarImagenEnGoogle(page, producto);

            // 4b. Descargar y optimizar
            await descargarYOptimizarImagen(urlImagen, producto.id);

            // 4c. Escribir SQL
            await escribirSentenciaSQL(producto.id);

            stats.exitosos++;
            console.log(`  ✔️  Producto ${producto.id} completado con éxito.`);
        } catch (error) {
            stats.fallidos++;
            stats.errores.push({ producto, error });
            console.error(`  ❌ Error con ${producto.id}: ${error.message}`);
            await registrarError(producto, error);
        }

        // 4d. Pausa aleatoria entre productos (excepto en el último)
        if (i < productos.length - 1) {
            const ms = Math.floor(Math.random() * (CONFIG.delayMax - CONFIG.delayMin + 1)) + CONFIG.delayMin;
            const seg = (ms / 1_000).toFixed(1);
            console.log(`  ⏳ Esperando ${seg}s antes del siguiente producto...`);
            await esperar(CONFIG.delayMin, CONFIG.delayMax);
        }
    }

    // 5. Cerrar navegador
    await browser.close();

    // 6. Resumen final
    console.log('\n\n═══════════════════════════════════════════════════');
    console.log('  📋 RESUMEN FINAL DE LA SESIÓN');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Exitosos : ${stats.exitosos}`);
    console.log(`  ❌ Fallidos : ${stats.fallidos}`);
    console.log(`  📄 SQL      : ${path.resolve(CONFIG.sqlFile)}`);
    console.log(`  📝 Log      : ${path.resolve(CONFIG.logFile)}`);
    console.log(`  🖼️  Imágenes : ${path.resolve(CONFIG.outputDir)}`);

    if (stats.errores.length > 0) {
        console.log('\n  Productos con error:');
        stats.errores.forEach(({ producto }) => {
            console.log(`   • ${producto.id} — ${producto.marca} ${producto.modelo}`);
        });
        console.log(`\n  Revisa ${CONFIG.logFile} para detalles completos.`);
    }

    console.log('═══════════════════════════════════════════════════\n');
}

// ────────────────────────────────────────────────────────────
//  ENTRY POINT — captura cualquier error no manejado
// ────────────────────────────────────────────────────────────

main().catch((err) => {
    console.error('\n❌ Error fatal inesperado:', err.message);
    process.exit(1);
});
