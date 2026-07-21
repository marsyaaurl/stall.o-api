export class SellerDashboardError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "SellerDashboardError";
    this.statusCode = statusCode;
  }
}
