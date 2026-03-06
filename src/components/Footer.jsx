import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-12 py-12 border-t border-gray-800">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="material-icons text-gray-400 text-sm">store</span>
                        </div>
                        <span className="text-xl font-bold text-white">Tu Tienda</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">Tu descripción aquí. Calidad y garantía asegurada.</p>
                    <div className="flex space-x-4">
                        <Link className="text-gray-400 hover:text-white transition-colors" href="#"><i className="material-icons">facebook</i></Link>
                        <Link className="text-gray-400 hover:text-white transition-colors" href="#"><span className="text-lg font-bold">IG</span></Link>
                    </div>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Atención al Cliente</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link className="hover:text-primary transition-colors" href="#">Centro de Ayuda</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="#">Cómo Comprar</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="#">Envíos y Entregas</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="#">Políticas de Devolución</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Mi Cuenta</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link className="hover:text-primary transition-colors" href="/login">Iniciar Sesión / Registro</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="#">Mis Pedidos</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="#">Mis Favoritos</Link></li>
                        <li><Link className="hover:text-primary transition-colors" href="#">Cuenta Gremio</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Newsletter</h4>
                    <p className="text-sm text-gray-400 mb-4">Suscribite para recibir ofertas exclusivas para técnicos.</p>
                    <div className="flex">
                        <input className="w-full bg-gray-800 border-none rounded-l-lg py-2 px-4 focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-colors text-white" placeholder="Tu email..." type="email" />
                        <button className="bg-primary hover:bg-primary-hover text-white px-4 rounded-r-lg font-bold transition-colors">
                            <span className="material-icons text-sm">send</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
                <p>&copy; 2024 Tu Tienda. Todos los derechos reservados.</p>
                <div className="flex space-x-4 mt-4 md:mt-0">
                    <Link className="hover:text-white transition-colors" href="#">Términos y Condiciones</Link>
                    <Link className="hover:text-white transition-colors" href="#">Privacidad</Link>
                </div>
            </div>
        </footer>
    );
}
