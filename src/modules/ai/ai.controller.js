import { GoogleGenAI } from '@google/genai';

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
            model: 'gemini-1.5-flash',
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
            Actúa como un experto en catalogación de eCommerce de tecnología.
            El usuario ingresó el siguiente texto para crear un producto: "${query}"
            
            Tu tarea es deducir de qué producto se trata y completar su ficha descriptiva.
            DEBES DEVOLVER EXCLUSIVAMENTE UN ARCHIVO JSON VÁLIDO. NO USES MARKDOWN COMO \`\`\`json. NO ESCRIBAS NINGÚN SALUDO.
            
            La estructura del JSON debe ser exactamente esta:
            {
                "category": ["Debe ser UN ARRAY de strings seleccionando AL MENOS UNA y MÁXIMO TRES de estas opciones exactas, según aplique mejor: 'Tecnología y Audio', 'Periféricos y Computación', 'Pequeños Electrodomésticos', 'Accesorios de Celular', 'Teléfonos', 'Ofertas', 'Mayorista'. Ej: ['Teléfonos', 'Ofertas']"],
                "brand": "La marca oficial del producto (ej. 'Samsung', 'Apple', 'Sony'). Si no se infiere, pon 'Genérico'.",
                "model": "El nombre completo y limpio del modelo (ej. 'Galaxy S24 Ultra 256GB' o 'DualSense').",
                "description": "Un texto de marketing atractivo y directo sobre este producto, máximo 2 párrafos cortos.",
                "features": [
                    { "name": "Especificación 1 (ej. RAM)", "value": "Valor (ej. 8 GB)" },
                    { "name": "Especificación 2", "value": "Valor" }
                ]
            }
            
            Intenta ser lo más preciso posible con la categoría elegida (debe matchar 100% con alguna de mi lista) y deduce las features más importantes si aplica.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
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

        // Detectar si fue un error de cuota (Rate Limit o Límite Diario)
        const errorMessage = error.message || "";
        if (errorMessage.includes("429") || errorMessage.includes("Quota") || error.status === 429) {
            return res.status(429).json({ success: false, error: 'Límite de cuota agotado. Pausando motores de IA temporalmente...' });
        }

        return res.status(500).json({ success: false, error: 'Hubo un error al autocompletar con IA.' });
    }
};
