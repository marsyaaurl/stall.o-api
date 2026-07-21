export class SellerModuleError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "SellerModuleError";
        this.statusCode = statusCode;
    }
}
export class SellerNotFoundError extends SellerModuleError {
    constructor(sellerId) {
        super(`Seller with ID ${sellerId} was not found.`, 44);
    }
}
export class UnauthorizedSellerAccessError extends SellerModuleError {
    constructor() {
        super("Access denied: You must be a registered SELLER to perform this action.", 403);
    }
}
