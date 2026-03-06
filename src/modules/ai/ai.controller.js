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
            Actúa como un experto vendedor de tecnología y repuestos de celulares (onda Mercadolibre, pero más profesional).
            Escribe una descripción de venta atractiva, clara y concisa en ESPAÑOL resaltando los beneficios para el siguiente producto de la tienda "Tu Tienda":
            
            - Marca: ${brand}
            - Modelo: ${model}
            - Categoría: ${category}
            
            Instrucciones especiales:
            1. Máximo de 3 párrafos cortos.
            2. Usa viñetas para destacar 3 o 4 características si lo ves conveniente.
            3. No inventes especificaciones técnicas falsas. Da formato general útil (ej: "ideal para técnicos y reparaciones").
            4. El tono debe ser profesional pero que invite a la compra.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const description = response.text;

        return res.status(200).json({ success: true, description });

    } catch (error) {
        console.error("AI Generation Error:", error);
        return res.status(500).json({ success: false, error: 'Hubo un error al generar la descripción con Inteligencia Artificial.' });
    }
};
