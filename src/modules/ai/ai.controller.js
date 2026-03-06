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
            model: 'gemini-2.5-flash',
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
        return res.status(500).json({ success: false, error: 'Hubo un error al generar la descripción con Inteligencia Artificial.' });
    }
};
