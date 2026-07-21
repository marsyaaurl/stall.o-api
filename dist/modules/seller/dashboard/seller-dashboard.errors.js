export class SellerDashboardError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "SellerDashboardError";
        this.statusCode = statusCode;
    }
}
