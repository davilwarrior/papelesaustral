import type {
  ProductCatalog,
  ProductRepository,
} from "@/domain/repositories/product-repository";

export async function getProductCatalog(
  repository: ProductRepository,
): Promise<ProductCatalog> {
  return repository.getCatalog();
}
