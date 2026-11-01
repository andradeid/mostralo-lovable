// Schema.org structured data do produto.
import type { Product, Store } from '@/lib/productPage/types';

export function ProductJsonLd({ product, store, currentFinalPrice }: { product: Product; store: Store; currentFinalPrice: number }) {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.image_url,
         "offers": {
           "@type": "Offer",
           "price": currentFinalPrice,
           "priceCurrency": "BRL",
           "availability": "https://schema.org/InStock",
           "seller": {
             "@type": "Organization",
             "name": store.name
           }
         },
         "category": product.category?.name || "Produto",
        "brand": {
          "@type": "Brand",
          "name": store.name
        }
      })}
    </script>
  );
}
