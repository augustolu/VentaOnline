/**
 * Error de negocio del módulo Payments.
 * Distingue errores controlados de errores inesperados (500).
 */
export class PaymentError extends Error {
    /**
     * @param {string} message  - Mensaje legible por el cliente.
     * @param {number} [status] - HTTP status code (default: 400).
     */
    constructor(message, status = 400) {
        super(message);
        this.name = 'PaymentError';
        this.statusCode = status;
    }
}
