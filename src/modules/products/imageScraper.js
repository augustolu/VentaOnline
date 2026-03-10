import puppeteer from 'puppeteer';
import axios from 'axios';
import mime from 'mime-types';

export async function scrapeProductImageAsBase64(query) {
    if (!query) return [];

    let browser = null;
    try {
        console.log(`🔍 [Puppeteer] Buscando Top 5 HQ en Bing Images: "${query}"`);

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();

        // Bloquear CSS y Fonts (pero dejar JSON e images)
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query + ' product')}&form=HDRSC2&first=1&tsc=ImageHoverTitle`;

        console.log("Navegando a Bing...");
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Extraer hasta 5 URLs originales en alta calidad del JSON 'm' incrustado en cada ancla
        const rawUrls = await page.evaluate(() => {
            const urls = [];
            const anchors = Array.from(document.querySelectorAll('a.iusc'));
            for (let a of anchors) {
                if (urls.length >= 5) break;
                try {
                    const mAttribute = a.getAttribute('m');
                    if (mAttribute) {
                        const mData = JSON.parse(mAttribute);
                        if (mData && mData.murl) {
                            urls.push(mData.murl); // Extrajimos la URL en Alta Calidad
                        }
                    }
                } catch (e) { }
            }
            return urls;
        });

        if (!rawUrls || rawUrls.length === 0) {
            console.log("No se pudieron extraer URLs desde Bing.");
            return [];
        }

        console.log(`📸 [Puppeteer] Encontradas ${rawUrls.length} URLs. Descargando concurrentemente...`);

        // Descargar todas las imágenes concurrentemente vía Axios
        const downloadPromises = rawUrls.map(async (url) => {
            try {
                const imageRes = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 8000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    }
                });

                const buffer = Buffer.from(imageRes.data, 'binary');
                const mimeType = imageRes.headers['content-type'] || mime.lookup(url) || 'image/jpeg';

                return `data:${mimeType};base64,${buffer.toString('base64')}`;
            } catch (dlErr) {
                console.warn(`Falló la descarga de una HQ URL: ${url} - Ignorándola: ${dlErr.message}`);
                return null;
            }
        });

        // Resolvemos todas las descargas del array, filtramos las nulls (que hayan fallado por timeout o CORS invertido)
        const base64Results = (await Promise.all(downloadPromises)).filter(b64 => b64 !== null);

        console.log(`✅ Transformadas exitosamente ${base64Results.length} imágenes HQ a Base64.`);
        return base64Results; // Devuelve el array completo!

    } catch (error) {
        console.error('❌ [Puppeteer] Error multi-HQ scraper:', error.message);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
