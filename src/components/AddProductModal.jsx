"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/useAuthStore";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function AddProductModal({ isOpen, onClose }) {
    const { token } = useAuthStore();

    const [formData, setFormData] = useState({
        category: "",
        brand: "",
        model: "",
        compatibility: "",
        price: "",
        stock_online: 0,
        stock_physical: 0,
        store_location: "",
        wholesale_price: "",
        wholesale_min_quantity: 5,
        description: "",
    });

    const [features, setFeatures] = useState([]);

    const [loading, setLoading] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Image Upload & Cropping State
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    // Helper: Initialize crop to center and max size
    function onImageLoad(e) {
        const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
            width,
            height
        );
        setCrop(crop);
    }

    // Handle File Selection
    const onSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Helper: Get cropped image blob using Canvas API
    const getCroppedImgBlob = async () => {
        if (!completedCrop || !imgRef.current) return null;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Scale down large images (e.g. max 800x800)
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Dest size
        const destSize = 800; // Final image will be max 800x800
        canvas.width = destSize;
        canvas.height = destSize;

        ctx.imageSmoothingQuality = 'high';

        // Draw cropped area
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            destSize,
            destSize
        );

        // Convert to WebP Promise
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/webp', 0.85); // Compress 85%
        });
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleAIGenerate = async () => {
        if (!formData.brand || !formData.model || !formData.category) {
            setError("Por favor completa Categoría, Marca y Modelo antes de usar la IA.");
            return;
        }

        setIsGeneratingAI(true);
        setError("");

        try {
            const res = await axios.post("http://localhost:3001/api/ai/generate-description", {
                brand: formData.brand,
                model: formData.model,
                category: formData.category
            }, {
                headers: { Authorization: `Bearer ${token}` }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            let uploadedImageUrl = undefined;

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
                            Authorization: `Bearer ${token}`
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
                image_url: uploadedImageUrl,
                features
            };

            await axios.post("http://localhost:3001/api/products", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
                // Reset form
                setFormData({
                    category: "", brand: "", model: "", compatibility: "", price: "",
                    stock_online: 0, stock_physical: 0, store_location: "", wholesale_price: "", wholesale_min_quantity: 5, description: ""
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
                        <span className="material-icons">inventory_2</span>
                        Nuevo Producto
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
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Imagen del Producto</h3>
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
                                    <div className="flex flex-col items-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                                            Ajusta el área para que la imagen sea cuadrada. Se optimizará automáticamente.
                                        </p>
                                        <div className="max-w-xs sm:max-w-sm max-h-64 overflow-hidden rounded-lg bg-black flex items-center justify-center">
                                            <ReactCrop
                                                crop={crop}
                                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                                onComplete={(c) => setCompletedCrop(c)}
                                                aspect={1}
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
                                            onClick={() => { setImgSrc(''); setCompletedCrop(null); }}
                                            className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            Eliminar y subir otra
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Información Base */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Info Básica</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Categoría *</label>
                                    <select
                                        required
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 dark:text-gray-200"
                                    >
                                        <option value="" disabled>Seleccionar categoría...</option>
                                        <option value="Tecnología y Audio">Tecnología y Audio (Auriculares, Parlantes)</option>
                                        <option value="Periféricos y Computación">Periféricos y Computación (Teclados)</option>
                                        <option value="Pequeños Electrodomésticos">Pequeños Electrodomésticos</option>
                                        <option value="Accesorios de Celular">Accesorios de Celular (Fundas, Vidrios templados)</option>
                                        <option value="Teléfonos">Teléfonos</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Marca *</label>
                                    <input required name="brand" type="text" placeholder="Ej: Samsung" value={formData.brand} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Modelo *</label>
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
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Precios y Stock</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Precio Unitario ($) *</label>
                                    <input required name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Stock Local / Físico</label>
                                    <input name="stock_physical" type="number" min="0" value={formData.stock_physical} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Stock Online</label>
                                    <input name="stock_online" type="number" min="0" value={formData.stock_online} onChange={handleChange} className="w-full text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md p-2 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono" />
                                </div>
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
        </div>
    );
}
