/**
 * Error de negocio del módulo Checkout.
 * Permite distinguirlo de errores genéricos (500) en el handler global.
 */
export class CheckoutError extends Error {
    /**
     * @param {string} message  - Mensaje legible por el cliente.
     * @param {number} [status] - HTTP status code (default: 400).
     */
    constructor(message, status = 400) {
        super(message);
        this.name = 'CheckoutError';
        this.statusCode = status;
    }
}
