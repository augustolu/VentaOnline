"use client";

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MayoristaPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-body min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
                <div className="w-full max-w-6xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/5 dark:to-transparent rounded-[3rem] p-12 md:p-24 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative group border border-primary/20 shadow-2xl">
                    <div className="relative z-10 max-w-4xl">
                        <span className="bg-primary text-white text-sm md:text-base font-bold px-6 py-2 rounded-full mb-8 inline-block tracking-widest uppercase shadow-md flex items-center gap-2 w-max">
                            <span className="material-icons text-sm">stars</span>
                            Programa Exclusivo
                        </span>

                        <h1 className="text-5xl md:text-7xl font-black text-gray-800 dark:text-white mb-6 leading-tight">
                            Impulsa tu Negocio con <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Tu Tienda Mayorista</span>
                        </h1>

                        <p className="text-gray-600 dark:text-gray-300 mb-10 text-xl md:text-2xl leading-relaxed max-w-3xl font-medium">
                            Únete a cientos de comercios y revendedores que ya confían en nosotros.
                            Disfruta de mayores márgenes, atención preferencial, envíos prioritarios y acceso a nuestro catálogo completo de repuestos y accesorios.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-primary/10 text-primary p-3 rounded-xl">
                                    <span className="material-icons text-2xl">percent</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">Descuentos por Volumen</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Escala tus compras y obtén los mejores precios del mercado.</p>
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-secondary/10 text-secondary p-3 rounded-xl">
                                    <span className="material-icons text-2xl">support_agent</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg mb-1">Soporte Dedicado</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Un ejecutivo de ventas asignado directamente a tu cuenta.</p>
                                </div>
                            </div>
                        </div>

                        <Link href="/register?type=wholesaler" className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-12 py-5 text-xl rounded-2xl font-bold hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-gray-900/40 flex items-center gap-4 w-max group/btn">
                            <span className="material-icons text-2xl group-hover/btn:rotate-12 transition-transform">storefront</span>
                            Solicitar Cuenta Mayorista Ahora
                            <span className="material-icons text-xl opacity-70 group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>

                    <div className="hidden lg:block absolute right-[-100px] bottom-[-150px] opacity-10 dark:opacity-20 group-hover:scale-110 group-hover:rotate-[-5deg] transition-all duration-1000 ease-out z-0 pointer-events-none">
                        <span className="material-icons" style={{ fontSize: '600px' }}>storefront</span>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
