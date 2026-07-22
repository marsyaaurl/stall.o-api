export class ProductNotFoundError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number = 404) {
        super(message);
        this.name = "ProductNotFoundError";
        this.statusCode = statusCode;
    }
}

export class ProductModuleError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.name = "ProductModuleError";
        this.statusCode = statusCode;
    }
}
