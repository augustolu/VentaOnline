import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Initialize the SDK. It automatically picks up the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

export const generateDescription = async (req, res) => {
    try {
        const { brand, model, category } = req.body;

        if (!brand || !model || !category) {
            return res.status(400).json({ success: false, error: 'Marca, modelo y categoría son requeridos para generar la descripción.' });
        }

        const prompt = `
            Actúa como un experto vendedor de tecnología y repuestos de celulares.
            Necesito que redactes información sobre el siguiente producto para un eCommerce:
            
            - Marca: ${brand}
            - Modelo: ${model}
            - Categoría: ${category}
            
            DEBES DEVOLVER EXCLUSIVAMENTE UN ARCHIVO JSON VÁLIDO. NO USES MARKDOWN COMO \`\`\`json. NO ESCRIBAS NINGÚN SALUDO.
            La estructura del JSON debe ser exactamente esta:
            {
                "description": "Un texto de marketing atractivo y directo, máximo 2 párrafos cortos. No incluyas saludos como 'Claro que sí' ni frases robóticas. Directo a las ventajas del producto.",
                "features": [
                    { "name": "Ejemplo: Memoria RAM", "value": "8 GB" },
                    { "name": "Ejemplo: Procesador", "value": "A15 Bionic" }
                ]
            }
            IMPORTANTE SOBRE FEATURES: Si el producto es tecnológico (celular, PC, etc.), intenta inferir 3 o 4 especificaciones técnicas reales (batería, chip, pantalla). Si el producto es algo simple (como una funda o cable), deja el array "features" VÍCIO ([]).
            NUNCA inventes características falsas si no estás seguro.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const rawJson = response.text;
        let aiData;
        try {
            aiData = JSON.parse(rawJson);
        } catch (e) {
            console.error("Failed to parse JSON from AI", rawJson);
            return res.status(500).json({ success: false, error: 'Respuesta inválida de la IA.' });
        }

        return res.status(200).json({
            success: true,
            description: aiData.description,
            features: aiData.features || []
        });

    } catch (error) {
        console.error("AI Generation Error:", error);

        // Detectar si fue un error de cuota (Rate Limit o Límite Diario)
        const errorMessage = error.message || "";
        if (errorMessage.includes("429") || errorMessage.includes("Quota") || error.status === 429) {
            return res.status(429).json({ success: false, error: 'Has alcanzado el límite de peticiones gratuitas a la IA. Debes esperar un momento.' });
        }

        return res.status(500).json({ success: false, error: 'Hubo un error al generar la descripción con Inteligencia Artificial.' });
    }
};

/**
 * Autocompletado integral del producto.
 * Dada una pista o nombre parcial en `query`, Gemini deduce y estructura
 * todos los campos necesarios para crear el producto (categoría, marca, modelo limpio,
 * descripción y especificaciones técnicas).
 */
export const autocompleteProduct = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ success: false, error: 'Se requiere una consulta (ej. "s24 ultra") para autocompletar.' });
        }

        const prompt = `
            Actúa como un experto en catalogación de eCommerce de tecnología para audiófilos, gamers y hardware.
            El usuario ingresó el texto sugerido para un producto: "${query}"
            
            Tu tarea es deducir el producto exacto, limpiar su nombre y armar una ficha técnica profesional.
            DEBES DEVOLVER EXCLUSIVAMENTE UN ARCHIVO JSON VÁLIDO. NO USES MARKDOWN COMO \`\`\`json.
            
            La estructura del JSON debe ser exactamente esta:
            {
                "category": ["Debe ser UN ARRAY de strings seleccionando AL MENOS UNA y MÁXIMO TRES de estas opciones exactas: 'Tecnología y Audio', 'Periféricos y Computación', 'Pequeños Electrodomésticos', 'Accesorios de Celular', 'Teléfonos', 'Ofertas', 'Mayorista'. Ej: ['Tecnología y Audio']"],
                "brand": "La marca oficial del producto. Si no se infiere, pon 'Genérico'.",
                "model": "El nombre completo, limpio y comercial del modelo (ej. 'JBL Quantum 100' o 'Galaxy S24 Ultra 256GB').",
                "description": "Un texto de marketing atractivo y directo, resaltando beneficios reales. Máximo 2 párrafos cortos.",
                "features": [
                    { "name": "Especificación de hardware 1", "value": "Valor Técnico" },
                    { "name": "Especificación de hardware 2", "value": "Valor Técnico" }
                ]
            }
            
            REGLAS ESTRICTAS PARA EL ARRAY "features":
            1. NO incluyas "Color", "Tipo", "Serie" ni la "Marca". Eso es irrelevante para técnicos.
            2. DEBES inferir la verdadera hoja de datos (Data Sheet) del producto.
            3. Si son auriculares: incluye cosas como 'Impedancia (ej. 32 Ohms)', 'Frecuencia (ej. 20Hz - 20kHz)', 'Largo del cable', 'Conectividad (ej. Jack 3.5mm)', 'Sensibilidad del micrófono', 'Drivers (ej. 40mm)'.
            4. Si son periféricos (ratones/teclados): incluye 'DPI', 'Switches', 'Polling Rate', 'Conectividad'.
            5. Si son celulares/tablets: 'Procesador', 'RAM', 'Batería (mAh)', 'Pantalla (Pulgadas, Hz)'.
            6. Extrae al menos 4 features y hasta 8 si conoces bien el modelo. Si no estás seguro de algo, utiliza especificaciones estándar de esa gama de producto.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const rawJson = response.text;
        let aiData;
        try {
            aiData = JSON.parse(rawJson);
        } catch (e) {
            console.error("Failed to parse JSON from AI", rawJson);
            return res.status(500).json({ success: false, error: 'Respuesta inválida de la IA.' });
        }

        return res.status(200).json({
            success: true,
            data: aiData
        });

    } catch (error) {
        console.error("AI Autocomplete Error:", error);

        try { fs.appendFileSync('ai-error.log', new Date().toISOString() + '\\n' + (error.stack || error.message || error) + '\\n\\n'); } catch (e) { }

        // Detectar si fue un error de cuota (Rate Limit o Límite Diario)
        const errorMessage = error.message || "";
        if (errorMessage.includes("429") || errorMessage.includes("Quota") || error.status === 429) {
            return res.status(429).json({ success: false, error: 'Límite de cuota agotado. Pausando motores de IA temporalmente...' });
        }

        return res.status(500).json({ success: false, error: 'Hubo un error al autocompletar con IA.' });
    }
};
