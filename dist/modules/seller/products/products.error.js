export class ProductNotFoundError extends Error {
    statusCode;
    constructor(message, statusCode = 404) {
        super(message);
        this.name = "ProductNotFoundError";
        this.statusCode = statusCode;
    }
}
export class ProductModuleError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "ProductModuleError";
        this.statusCode = statusCode;
    }
}
