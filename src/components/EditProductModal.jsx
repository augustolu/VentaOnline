"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/useAuthStore";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function EditProductModal({ isOpen, onClose, product, onProductUpdated }) {
    const { token } = useAuthStore(); // Usado para re-render si cambia, pero usaremos getState para requests

    const [formData, setFormData] = useState({
        category: [],
        brand: "",
        model: "",
        compatibility: "",
        price: "",
        wholesale_price: "",
        wholesale_min_quantity: 5,
        description: "",
    });

    const [features, setFeatures] = useState([]);

    // Populate the form when the modal opens or the product changes
    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                category: Array.isArray(product.category) ? product.category : ["Tecnología y Audio"], // Default fallback or parsing needed if category is string in DB
                brand: product.brand || "",
                model: product.model || "",
                compatibility: product.compatibility || "",
                price: product.price || "",
                wholesale_price: product.wholesale_price?.price || "", // Assumes wholesale_price relation is included
                wholesale_min_quantity: product.wholesale_price?.min_quantity || 5,
                description: product.description || "",
            });

            // Try separating the category string by commas if it is stored as one
            if (typeof product.category === 'string') {
                setFormData(prev => ({ ...prev, category: product.category.split(',').map(c => c.trim()) }));
            }

            setFeatures(Array.isArray(product.features) ? product.features : []);
            setImgSrc(product.image_url || '');
            setCompletedCrop(null); // Reset crop if any existed
        }
    }, [product, isOpen]);

    const [loading, setLoading] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Image Upload & Cropping State
    const [imgSrc, setImgSrc] = useState('');
    const [imageOptions, setImageOptions] = useState([]); // Nuevo: Guardar las top 5 imágenes
    const [showOptionsModal, setShowOptionsModal] = useState(false); // Nuevo: Modal de opciones

    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    // Helper: Initialize crop to max size without forced aspect ratio
    function onImageLoad(e) {
        const { width, height } = e.currentTarget;
        const initialCrop = {
            unit: 'px',
            x: 0,
            y: 0,
            width,
            height
        };
        setCrop(initialCrop);
        setCompletedCrop(initialCrop); // Crucial para que suba si el usuario no mueve el mouse
    }

    // Handle File Selection
    const onSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setImageOptions([]); // Ocultamos opciones si sube manual
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Helper: Get cropped image blob using Canvas API (Implementando Auto-Padding Blanco 800x800)
    const getCroppedImgBlob = async () => {
        if (!completedCrop || !imgRef.current) return null;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Escalas de la imagen visualizada vs natural
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Tamaño final cuadrado exigido por el cliente
        const destSize = 800;
        canvas.width = destSize;
        canvas.height = destSize;

        // 1. PINTAR EL FONDO BLANCO PURO (PADDING)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, destSize, destSize);

        ctx.imageSmoothingQuality = 'high';

        // Dimensiones del recorte original 
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        // 2. CALCULAR PROPORCIONES PARA ENCAJAR EN 800x800 SIN ACHATAR
        const ratio = Math.min(destSize / cropWidth, destSize / cropHeight);

        // El tamaño que tendrá la imagen dentro del canvas 800x800
        const drawWidth = cropWidth * ratio;
        const drawHeight = cropHeight * ratio;

        // Para centrarlo perfectamente
        const offsetX = (destSize - drawWidth) / 2;
        const offsetY = (destSize - drawHeight) / 2;

        // 3. DIBUJAR LA IMAGEN RESPETANDO EL RECORTE RECTANGULAR, CENTRADA
        ctx.drawImage(
            image, // imagen original
            completedCrop.x * scaleX, // inicio X de recorte
            completedCrop.y * scaleY, // inicio Y de recorte
            cropWidth, // ancho de recorte
            cropHeight, // alto de recorte
            offsetX, // donde empezar a pintar en el canvas destino X
            offsetY, // donde empezar a pintar en el canvas destino Y
            drawWidth, // ancho encogido final
            drawHeight // alto encogido final
        );

        // Convert to WebP Promise
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/webp', 0.90);
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'category') {
            setFormData(prev => ({
                ...prev,
                category: checked
                    ? [...prev.category, value]
                    : prev.category.filter(c => c !== value)
            }));
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleAIGenerate = async () => {
        if (!formData.brand || !formData.model || formData.category.length === 0) {
            setError("Por favor completa Categoría (al menos una), Marca y Modelo antes de usar la IA.");
            return;
        }

        setIsGeneratingAI(true);
        setError("");

        try {
            const currentToken = useAuthStore.getState().token;
            const res = await axios.post("http://localhost:3001/api/ai/generate-description", {
                brand: formData.brand,
                model: formData.model,
                category: formData.category.join(", ") // Enviamos como string unificado para la IA descriptiva
            }, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });

            if (res.data.success) {
                setFormData(prev => ({ ...prev, description: res.data.description }));
                if (res.data.features && res.data.features.length > 0) {
                    setFeatures(res.data.features);
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || "Error al conectar con la IA.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleAutocompleteAll = async () => {
        if (!formData.model || formData.model.length < 3) {
            setError("Por favor escribe al menos 3 letras en Modelo para que la IA entienda qué buscas.");
            return;
        }

        setIsGeneratingAI(true);
        setError("");

        try {
            // 1. Obtener datos estructurados de Gemini
            const currentToken = useAuthStore.getState().token;
            const aiRes = await axios.post("http://localhost:3001/api/ai/autocomplete-product", {
                query: formData.model
            }, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });

            if (aiRes.data.success && aiRes.data.data) {
                const aiData = aiRes.data.data;

                if (aiData.features && aiData.features.length > 0) {
                    setFeatures(aiData.features);
                }

                // Asegurar que category sea un array (en caso que Gemini devuelva un string por error)
                let rawCategory = Array.isArray(aiData.category) ? aiData.category : (aiData.category ? [aiData.category] : formData.category);

                // Sanitizar strings para evitar fallos de tildes o espacios invisibles devueltos por la IA
                const validCategories = [
                    "Tecnología y Audio", "Periféricos y Computación", "Pequeños Electrodomésticos",
                    "Accesorios de Celular", "Teléfonos", "Ofertas", "Mayorista"
                ];

                const parsedCategory = rawCategory.map(c => c.trim()).filter(c => validCategories.includes(c));

                // Si la IA devolvió categorías pero ninguna matcheó exactamente, nos quedamos con las que ya tenía el form para no dejarlo vacío.
                const finalCategory = parsedCategory.length > 0 ? parsedCategory : formData.category;

                // Setear formulario inmediatamente (manteniendo el MODELO ORIGINAL del usuario)
                setFormData(prev => ({
                    ...prev,
                    category: finalCategory,
                    brand: aiData.brand || prev.brand,
                    description: aiData.description || prev.description
                }));

                // 2. Encadenar búsqueda de imagen usando los datos precisos de la IA
                const categoryStr = Array.isArray(parsedCategory) ? parsedCategory[0] : parsedCategory;
                const imgQuery = `${categoryStr} ${aiData.brand} ${aiData.model}`;
                try {
                    const imgRes = await axios.post("http://localhost:3001/api/products/auto-image", { query: imgQuery }, {
                        headers: { Authorization: `Bearer ${currentToken}` }
                    });
                    if (imgRes.data.success && imgRes.data.imagesBase64 && imgRes.data.imagesBase64.length > 0) {
                        setCrop(undefined);
                        setImgSrc(imgRes.data.imagesBase64[0]); // Seleccionamos la mejor por defecto
                        setImageOptions(imgRes.data.imagesBase64); // Guardamos las 5 alternativas
                    }
                } catch (imgErr) {
                    // Solo logueamos si falla la imagen, no detenemos el autocompletado del form
                    console.error("Autoimage failed after AI:", imgErr);
                }
            }
        } catch (err) {
            console.error("AI Autocomplete error in frontend:", err);
            setError(err.response?.data?.error || err.message || "Error al autocompletar con la IA.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            let uploadedImageUrl = undefined;

            const currentToken = useAuthStore.getState().token;
            // 1. Upload cropped image step
            if (completedCrop && imgSrc) {
                setIsUploading(true);
                const blob = await getCroppedImgBlob();
                if (blob) {
                    const formData = new FormData();
                    formData.append('image', blob, 'product.webp');

                    const uploadRes = await axios.post("http://localhost:3001/api/upload", formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${currentToken}`
                        }
                    });

                    if (uploadRes.data.success) {
                        uploadedImageUrl = uploadRes.data.imageUrl;
                    }
                }
                setIsUploading(false);
            }

            // 2. Form submission payload
            const payload = {
                ...formData,
                price: Number(formData.price),
                wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : undefined,
                image_url: uploadedImageUrl || imgSrc || undefined, // Keep existing image if no new one uploaded
                features
            };

            const res = await axios.put(`http://localhost:3001/api/products/${product.id}`, payload, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });

            setSuccess(true);
            if (onProductUpdated && res.data.data) {
                onProductUpdated(res.data.data);
            }
            setTimeout(() => {
                setSuccess(false);
                onClose();
                // Reset form
                setFormData({
                    category: [], brand: "", model: "", compatibility: "", price: "",
                    wholesale_price: "", wholesale_min_quantity: 5, description: ""
                });
                setFeatures([]);
                setImgSrc('');
                setCompletedCrop(null);
            }, 1500);

        } catch (err) {
            setError(err.response?.data?.message || "Error al crear el producto");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                        <span className="material-icons">edit</span>
                        Editar Producto
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                            <span className="material-icons text-sm">error</span> {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200 flex items-center gap-2">
                            <span className="material-icons text-sm">check_circle</span> Producto creado correctamente.
                        </div>
                    )}

                    <form id="productForm" onSubmit={handleSubmit} className="space-y-6">

                        {/* Image Upload Area */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Imagen del Producto</h3>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (formData.category.length === 0 || !formData.brand || !formData.model) {
                                            setError("Por favor completa Categoría, Marca y Modelo para buscar una foto.");
                                            return;
                                        }
                                        setIsGeneratingAI(true);
                                        setError("");
                                        try {
                                            const currentToken = useAuthStore.getState().token;
                                            const categoryStr = formData.category[0];
                                            const query = `${categoryStr} ${formData.brand} ${formData.model}`;
                                            const res = await axios.post("http://localhost:3001/api/products/auto-image", { query }, {
                                                headers: { Authorization: `Bearer ${currentToken}` }
                                            });
                                            if (res.data.success && res.data.imagesBase64 && res.data.imagesBase64.length > 0) {
                                                setCrop(undefined);
                                                setImgSrc(res.data.imagesBase64[0]);
                                                setImageOptions(res.data.imagesBase64);
                                            }
                                        } catch (err) {
                                            setError(err.response?.data?.message || "Error al buscar imagen online.");
                                        } finally {
                                            setIsGeneratingAI(false);
                                        }
                                    }}
                                    disabled={isGeneratingAI || !!imgSrc}
                                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors disabled:opacity-50"
                                >
                                    {isGeneratingAI && !imgSrc ? (
                                        <><span className="material-icons text-[14px] animate-spin">autorenew</span> Buscando...</>
                                    ) : (
                                        <><span className="material-icons text-[14px]">travel_explore</span> Buscar foto (Auto)</>
                                    )}
                                </button>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">

                                {!imgSrc && (
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                                                <span className="material-icons text-3xl mb-2">add_photo_alternate</span>
                                                <p className="mb-2 text-sm font-bold">Haz clic para subir imagen</p>
                                                <p className="text-xs">PNG, JPG, o WEBP</p>
                                            </div>
                                            <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={onSelectFile} />
                                        </label>
                                    </div>
                                )}

                                {imgSrc && (
                                    <div className="flex flex-col items-center relative">
                                        {imageOptions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowOptionsModal(true)}
                                                className="absolute top-0 right-0 z-10 bg-white/90 hover:bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-bl-lg rounded-tr-lg shadow-md flex items-center gap-1 transition-colors"
                                            >
                                                <span className="material-icons text-[16px]">collections</span> Elegir otra opción
                                            </button>
                                        )}
                                        <p className="sr-only">Ajusta el recorte.</p>
                                        <div className="max-w-xs sm:max-w-sm max-h-64 overflow-hidden rounded-lg bg-black flex items-center justify-center">
                                            <ReactCrop
                                                crop={crop}
                                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                                onComplete={(c) => setCompletedCrop(c)}
                                                circularCrop={false}
                                            >
                                                <img
                                                    ref={imgRef}
                                                    src={imgSrc}
                                                    alt="Crop me"
                                                    style={{ maxHeight: '16rem', objectFit: 'contain' }}
                                                    onLoad={onImageLoad}
                                                />
                                            </ReactCrop>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setImgSrc(''); setCompletedCrop(null); setImageOptions([]); }}
                                            className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            Eliminar y subir otra manual
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Información Base */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Info Básica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Categorías *</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Tecnología y Audio",
                                            "Periféricos y Computación",
                                            "Pequeños Electrodomésticos",
                                            "Accesorios de Celular",
                                            "Teléfonos",
                                            "Ofertas",
                                            "Mayorista"
                                        ].map(cat => (
                                            <label key={cat} className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${formData.category.includes(cat) ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-300' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                                <input
                                                    type="checkbox"
                                                    name="category"
                                                    value={cat}
                                                    checked={formData.category.includes(cat)}
                                                    onChange={handleChange}
                                                    className="hidden"
                                                />
                                                {cat}
                                            </label>
                                        ))}
                                    </div>
                                    {formData.category.length === 0 && <p className="text-[10px] text-red-500 mt-1">Debes seleccionar al menos una.</p>}
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Marca *</label>
                                    <input required name="brand" type="text" placeholder="Ej: Samsung" value={formData.brand} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Modelo *</label>
                                        <button
                                            type="button"
                                            onClick={handleAutocompleteAll}
                                            disabled={isGeneratingAI}
                                            className="text-[11px] bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3 py-1 rounded-md flex items-center gap-1 font-bold shadow-sm transition-all disabled:opacity-50"
                                            title="Escribe un modelo (ej: 'Ps5 Joystick') y la IA intentará completar TODA la ficha y la foto al instante."
                                        >
                                            <span className="material-icons text-[14px]">auto_awesome</span> Autocompletar
                                        </button>
                                    </div>
                                    <input required name="model" type="text" placeholder="Ej: Galaxy S21 Ultra" value={formData.model} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Compatibilidad (Opcional)</label>
                                    <input name="compatibility" type="text" placeholder="Ej: S21, S21+, SM-G998B" value={formData.compatibility} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>

                                <div className="md:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Descripción del Producto</label>
                                        <button
                                            type="button"
                                            onClick={handleAIGenerate}
                                            disabled={isGeneratingAI}
                                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors disabled:opacity-50"
                                        >
                                            {isGeneratingAI ? (
                                                <><span className="material-icons text-[14px] animate-spin">autorenew</span> Generando...</>
                                            ) : (
                                                <><span className="material-icons text-[14px]">auto_awesome</span> Generar con IA</>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        name="description"
                                        rows="5"
                                        placeholder="Descripción detallada o generada por IA..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-3 outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                                    ></textarea>
                                </div>

                                <div className="md:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Especificaciones Técnicas (Opcional)</h4>
                                    <p className="text-xs text-gray-500 mb-3">Las especificaciones clave generadas por la IA o añadidas manualmente aparecerán aquí para integrarse a la ficha del producto.</p>

                                    {features.map((feature, index) => (
                                        <div key={index} className="flex gap-2 mb-2 items-center">
                                            <input
                                                value={feature.name}
                                                onChange={(e) => {
                                                    const newFeatures = [...features];
                                                    newFeatures[index].name = e.target.value;
                                                    setFeatures(newFeatures);
                                                }}
                                                placeholder="Ej: Memoria RAM"
                                                className="w-1/3 text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                            <input
                                                value={feature.value}
                                                onChange={(e) => {
                                                    const newFeatures = [...features];
                                                    newFeatures[index].value = e.target.value;
                                                    setFeatures(newFeatures);
                                                }}
                                                placeholder="Ej: 8 GB"
                                                className="flex-1 text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFeatures(features.filter((_, i) => i !== index))}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors"
                                                title="Eliminar especificación"
                                            >
                                                <span className="material-icons text-lg">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFeatures([...features, { name: "", value: "" }])}
                                        className="text-xs text-primary hover:text-primary-hover font-bold flex items-center justify-center gap-1 mt-3 w-full border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <span className="material-icons text-[16px]">add</span> Añadir Especificación
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Precios e Inventario */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Precios</h3>
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Precio Unitario ($) *</label>
                                    <input required name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono" />
                                </div>
                                {/* Stock was completely removed from here as it is managed by the stock specific modal */}
                            </div>
                        </div>

                        {/* Opciones Mayoristas */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
                                <span className="material-icons text-sm">storefront</span> Precios Mayoristas (Opcional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1">Precio Especial ($)</label>
                                    <input name="wholesale_price" type="number" min="0" step="0.01" placeholder="Dejar en blanco si no aplica" value={formData.wholesale_price} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-400 mb-1">Cant. Mínima requerida</label>
                                    <input name="wholesale_min_quantity" type="number" min="1" value={formData.wholesale_min_quantity} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        form="productForm"
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading || isUploading ? (
                            <div className="flex items-center gap-2">
                                <span className="material-icons animate-spin text-sm">refresh</span>
                                <span>{isUploading ? 'Subiendo imagen...' : 'Guardando...'}</span>
                            </div>
                        ) : (
                            <span className="material-icons text-sm">save</span>
                        )}
                        Guardar Producto
                    </button>
                </div>
            </div>

            {/* Sub-Modal para Elegir Alternativas de Imagen */}
            {showOptionsModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <span className="material-icons text-primary">collections</span>
                                Seleccionar la Mejor Foto
                            </h3>
                            <button onClick={() => setShowOptionsModal(false)} className="text-gray-400 hover:text-red-500">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                            {imageOptions.map((optSrc, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setImgSrc(optSrc);
                                        setCrop(undefined);
                                        setShowOptionsModal(false);
                                    }}
                                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${imgSrc === optSrc ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-indigo-300'}`}
                                >
                                    <img src={optSrc} alt={`Option ${i}`} className="w-full h-32 object-contain bg-white" />
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
