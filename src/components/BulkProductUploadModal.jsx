"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/useAuthStore";
import * as XLSX from "xlsx";

export default function BulkProductUploadModal({ isOpen, onClose }) {
    const { token } = useAuthStore();

    // Estados
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]); // Datos parseados del Excel
    const [processing, setProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // 0: Subir Excel, 1: Previsualizar, 2: Procesando

    // Progreso individual por item
    const [progressStats, setProgressStats] = useState({
        total: 0,
        completed: 0,
        failed: 0,
    });

    const fileInputRef = useRef(null);
    const stopRequestedRef = useRef(false);

    // Resetea todo cuando cerramos
    const handleClose = () => {
        if (processing) return; // No dejar cerrar si está procesando
        setFile(null);
        setPreviewData([]);
        setCurrentStep(0);
        setProgressStats({ total: 0, completed: 0, failed: 0 });
        stopRequestedRef.current = false;
        onClose();
    };

    // --- PASO 1: LEER EXCEL ---
    const handleFileUpload = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                // Leemos solo la primera hoja
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Convertimos a JSON Array basado en las cabeceras (1ra fila)
                const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

                // Formateamos para que nuestro motor interno lo entienda uniforme
                const formattedData = data.map((row, index) => {
                    // Buscar columna de Modelo intuitivamente
                    const modelKey = Object.keys(row).find(k => k.toLowerCase().includes('modelo') || k.toLowerCase().includes('titulo') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('producto'));
                    // Buscar columna de Precio
                    const priceKey = Object.keys(row).find(k => k.toLowerCase().includes('precio') || k.toLowerCase().includes('valor'));

                    return {
                        id: index,
                        originalModel: modelKey ? String(row[modelKey]).trim() : "PRODUCTO DESCONOCIDO", // Lo que tipeó en el excel
                        originalPrice: priceKey ? Number(String(row[priceKey]).replace(/[^0-9.-]+/g, "")) : 0, // Lo que tipeó (limpio)

                        // Estado para la tabla visual
                        aiStatus: 'pending', // pending | loading | success | error
                        aiMessage: 'Esperando sincronización...',

                        // Datos finales que usará para postear
                        finalData: null
                    };
                }).filter(item => item.originalModel && item.originalModel !== "PRODUCTO DESCONOCIDO");

                setPreviewData(formattedData);
                setProgressStats(prev => ({ ...prev, total: formattedData.length }));
                setCurrentStep(1); // Pasamos a la tabla
            } catch (err) {
                alert("Error leyendo el Excel. Asegurate que sea válido.");
                console.error(err);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    // --- PASO 2: EL BUCLE MÁGICO (Motor Secuencial) ---
    const startMagicImport = async () => {
        setProcessing(true);
        setCurrentStep(2);
        stopRequestedRef.current = false;

        let successCount = previewData.filter(i => i.aiStatus === 'success').length;
        let failCount = previewData.filter(i => i.aiStatus === 'error').length;

        // Update stats just in case resuming
        setProgressStats(prev => ({ ...prev, completed: successCount, failed: failCount }));

        // Iteramos producto a producto (NO Promise.all, para no saturar APIs)
        for (let i = 0; i < previewData.length; i++) {
            if (stopRequestedRef.current) {
                console.log("⏹️ Proceso de importación detenido por el usuario.");
                break;
            }

            let item = previewData[i];

            // Si ya fue exitoso, lo salteamos
            if (item.aiStatus === 'success') {
                continue;
            }

            // Actualizamos UI: 'loading'
            updateItemStatus(item.id, 'loading', 'Procesando datos... 🔄');

            try {
                // 1. Adivinar Todo con IA (Gemini)
                const aiRes = await axios.post("http://localhost:3001/api/ai/autocomplete-product", { query: item.originalModel }, { headers: { Authorization: `Bearer ${token}` } });

                if (!aiRes.data.success || !aiRes.data.data) {
                    throw new Error("La IA no entendió el producto.");
                }

                const aiData = aiRes.data.data;
                const searchBrand = aiData.brand || "Generico";
                // Aseguramos que searchCategory SIEMPRE sea un array
                const searchCategory = Array.isArray(aiData.category) ? aiData.category : (aiData.category ? [aiData.category] : ["Otros"]);

                // 2. Buscar Foto (Bing)
                updateItemStatus(item.id, 'loading', 'Buscando foto HD... 🖼️');
                const catString = searchCategory[0] || "Generico";
                const imgQuery = `${catString} ${searchBrand} ${item.originalModel}`;
                const imgRes = await axios.post("http://localhost:3001/api/products/auto-image", { query: imgQuery }, { headers: { Authorization: `Bearer ${token}` } });

                let imageUrl = undefined;

                if (imgRes.data.success && imgRes.data.imagesBase64 && imgRes.data.imagesBase64.length > 0) {
                    const bestImageBase64 = imgRes.data.imagesBase64[0];

                    // 3. Procesar Padding Blanco Invisible (Simulando Canvas)
                    updateItemStatus(item.id, 'loading', 'Encuadrando pixel perfecto... ⬜');
                    const paddedBlob = await applyWhitePadding(bestImageBase64);

                    // 4. Subir la foto final al Servidor
                    updateItemStatus(item.id, 'loading', 'Subiendo foto al cloud... ☁️');
                    const formData = new FormData();
                    formData.append('image', paddedBlob, `bulk_${item.id}.webp`);
                    const uploadRes = await axios.post("http://localhost:3001/api/upload", formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });

                    if (uploadRes.data.success) {
                        imageUrl = uploadRes.data.imageUrl;
                    }
                } else {
                    console.log(`[Item ${i}] No se encontro foto para ${item.originalModel}, se subirá sin foto.`);
                }

                // 5. Guardar Producto en la BD
                updateItemStatus(item.id, 'loading', 'Guardando en BD... 💾');
                const payload = {
                    category: searchCategory,
                    brand: searchBrand,
                    model: item.originalModel, // Respetamos lo tipeado en Excel
                    description: aiData.description || "Sin descripción detallada.",
                    price: item.originalPrice,
                    stock_online: 0,
                    stock_physical: 0,
                    image_url: imageUrl,
                    features: aiData.features || []
                };

                await axios.post("http://localhost:3001/api/products", payload, { headers: { Authorization: `Bearer ${token}` } });

                // Todo OK
                updateItemStatus(item.id, 'success', '¡Añadido con éxito! ✅', payload);
                successCount++;

            } catch (err) {
                console.error(`Error procesando fila ${i}:`, err);
                updateItemStatus(item.id, 'error', `Falló: ${err.message || "Error desconocido"}`);
                failCount++;
            }

            // Stats updater
            setProgressStats(prev => ({ ...prev, completed: successCount, failed: failCount }));

            // Pausa de 1.5s entre productos para no abusar del Rate Limit de los servidores
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        setProcessing(false);
    };

    const stopImport = () => {
        stopRequestedRef.current = true;
    };

    // --- Helpers Utilitarios ---
    const updateItemStatus = (id, status, message, finalData = null) => {
        setPreviewData(prev => prev.map(item => item.id === id ? { ...item, aiStatus: status, aiMessage: message, finalData: finalData || item.finalData } : item));
    };

    // Magia del Canvas sin visualizar usando un objeto Image en Memoria
    const applyWhitePadding = (base64Str) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("No Canvas Context"));

                const destSize = 800;
                canvas.width = destSize;
                canvas.height = destSize;

                // 1. Fondo Blanco
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, destSize, destSize);
                ctx.imageSmoothingQuality = 'high';

                // 2. Escalar ratio sin achatar 
                const cropWidth = img.width;
                const cropHeight = img.height;
                const ratio = Math.min((destSize * 0.9) / cropWidth, (destSize * 0.9) / cropHeight); // Dejamos 10% de margen blanco base

                const drawWidth = cropWidth * ratio;
                const drawHeight = cropHeight * ratio;

                const offsetX = (destSize - drawWidth) / 2;
                const offsetY = (destSize - drawHeight) / 2;

                // 3. Pintar en el centro
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

                // Convertir a base64 de vuelta
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Canvas to Blob falló"));
                }, 'image/webp', 0.90);
            };
            img.onerror = () => reject(new Error("Base64 invalido"));
            img.src = base64Str;
        });
    };

    // UI RENDER 
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">

                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                            <span className="material-icons">drive_folder_upload</span>
                            Importador Masivo de Catálogo
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Sincronización automatizada. El sistema procesará el Excel, estructurará la ficha técnica técnica y asignará imágenes oficiales para cada modelo.</p>
                    </div>
                    {!processing && (
                        <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-white rounded-full shadow-sm">
                            <span className="material-icons">close</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-6 bg-gray-50 dark:bg-gray-900/50">
                    {/* PASO 0: Subir Archivo */}
                    {currentStep === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-2xl bg-white dark:bg-gray-800 p-8 text-center transition-colors hover:bg-indigo-50/50">
                            <div className="w-24 h-24 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <span className="material-icons text-5xl">table_view</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Arrastrá tu planilla Excel aquí</h3>
                            <p className="text-gray-500 mb-8 max-w-md">Debe contener al menos una columna llamada <strong>"Modelo"</strong> (ej: Notebook Dell XPS 13) y otra <strong>"Precio"</strong>. El procesador inteligente se encargará de estructurar el resto de la información comercial.</p>

                            <label className="cursor-pointer bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center gap-2">
                                <span className="material-icons text-xl">upload_file</span>
                                Seleccionar Archivo (.xlsx / .csv)
                                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                            </label>
                        </div>
                    )}

                    {/* PASO 1 & 2: Procesamiento y Tabla */}
                    {(currentStep === 1 || currentStep === 2) && (
                        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Header Stats */}
                            <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Encontrados</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{progressStats.total} <span className="text-sm font-normal text-gray-400">ítems</span></p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-green-500 uppercase font-bold tracking-wider mb-1">Completados</p>
                                    <p className="text-2xl font-bold text-green-600">{progressStats.completed}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-red-500 uppercase font-bold tracking-wider mb-1">Fallaron</p>
                                    <p className="text-2xl font-bold text-red-600">{progressStats.failed}</p>
                                </div>
                                <div className="text-center flex flex-col items-center justify-center">
                                    {currentStep === 1 || (!processing && (progressStats.completed + progressStats.failed < progressStats.total)) ? (
                                        <button
                                            onClick={startMagicImport}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-2 px-4 rounded-lg shadow uppercase text-sm flex items-center justify-center gap-2"
                                        >
                                            <span className="material-icons">{currentStep === 1 ? 'memory' : 'play_arrow'}</span> {currentStep === 1 ? 'Procesar Catálogo' : 'Reanudar'}
                                        </button>
                                    ) : processing && !stopRequestedRef.current ? (
                                        <button
                                            onClick={stopImport}
                                            className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 border border-red-300 transition-colors"
                                        >
                                            <span className="material-icons animate-pulse">stop_circle</span> Detener
                                        </button>
                                    ) : (
                                        <div className="w-full bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                            {progressStats.completed + progressStats.failed === progressStats.total ? (
                                                <><span className="material-icons">task_alt</span> Finalizado</>
                                            ) : (
                                                <><span className="material-icons">pause_circle</span> Detenido</>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white dark:bg-gray-800 sticky top-0 border-b border-gray-200 dark:border-gray-700 z-10 shadow-sm">
                                        <tr>
                                            <th className="py-3 px-4 font-bold text-gray-600 dark:text-gray-300 w-12">#</th>
                                            <th className="py-3 px-4 font-bold text-gray-600 dark:text-gray-300 w-2/5">Item Leído (Excel)</th>
                                            <th className="py-3 px-4 font-bold text-gray-600 dark:text-gray-300 w-1/5">Precio</th>
                                            <th className="py-3 px-4 font-bold text-gray-600 dark:text-gray-300 w-1/4">Estado de Procesamiento</th>
                                            <th className="py-3 px-4 font-bold text-gray-600 dark:text-gray-300 w-16 text-center">Datos BD</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {previewData.map((item, idx) => (
                                            <tr key={item.id} className={`
                                                transition-colors
                                                ${item.aiStatus === 'loading' ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}
                                                ${item.aiStatus === 'success' ? 'bg-green-50/30 dark:bg-green-900/10' : ''}
                                                ${item.aiStatus === 'error' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}
                                            `}>
                                                <td className="py-3 px-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                                <td className="py-3 px-4">
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{item.originalModel}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-gray-600 dark:text-gray-400 font-mono">${item.originalPrice}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {item.aiStatus === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-300"></span>}
                                                        {item.aiStatus === 'loading' && <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>}
                                                        {item.aiStatus === 'success' && <span className="material-icons text-green-500 text-[16px]">check_circle</span>}
                                                        {item.aiStatus === 'error' && <span className="material-icons text-red-500 text-[16px]">error</span>}

                                                        <span className={`text-xs font-bold
                                                            ${item.aiStatus === 'pending' ? 'text-gray-400' : ''}
                                                            ${item.aiStatus === 'loading' ? 'text-indigo-600' : ''}
                                                            ${item.aiStatus === 'success' ? 'text-green-600' : ''}
                                                            ${item.aiStatus === 'error' ? 'text-red-600' : ''}
                                                        `}>
                                                            {item.aiMessage}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {item.finalData ? (
                                                        <span title={`${Array.isArray(item.finalData.category) ? item.finalData.category.join(", ") : item.finalData.category} > ${item.finalData.brand}`} className="material-icons text-gray-400 hover:text-primary cursor-help">info</span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {(currentStep === 1 || currentStep === 2) && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewData([]);
                                setProgressStats({ total: 0, completed: 0, failed: 0 });
                                setCurrentStep(0);
                            }}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                            Cancelar y Subir otro Excel
                        </button>

                        {(progressStats.completed + progressStats.failed === progressStats.total && currentStep === 2) && (
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg shadow hover:bg-black transition-colors"
                            >
                                Cerrar Ventana y Ver Productos
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
