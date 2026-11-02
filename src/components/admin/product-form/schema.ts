import * as z from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  is_available: z.boolean(),
  is_featured: z.boolean(),
  display_order: z.number().min(0),
  image_url: z.string().optional(),
  button_text: z.string().min(1, 'Texto do botão é obrigatório'),
  image_gallery: z.array(z.string()).optional(),
  slug: z.string().optional(),
  is_on_offer: z.boolean(),
  original_price: z.number().optional(),
  offer_price: z.number().optional(),
  // Campos de controle de estoque
  track_stock: z.boolean(),
  stock_quantity: z.number().nullable().optional(),
  stock_alert_threshold: z.number().min(0).optional(),
  // Código de barras (EAN/GTIN ou interno); vazio = sem código
  barcode: z.string().max(48, 'Código de barras muito longo').optional()
}).refine((data) => {
  if (data.is_on_offer) {
    return data.offer_price && data.offer_price < data.price;
  }
  return true;
}, {
  message: "Preço da oferta deve ser menor que o preço original",
  path: ["offer_price"]
});

/** Valores iniciais (objeto novo a cada formulário, como antes). */
export const productFormDefaults = () => ({
  name: '',
  description: '',
  price: 0,
  category_id: '',
  is_available: true,
  is_featured: false,
  display_order: 0,
  image_url: '',
  button_text: 'Comprar',
  image_gallery: [],
  is_on_offer: false,
  original_price: 0,
  offer_price: 0,
  track_stock: false,
  stock_quantity: null,
  stock_alert_threshold: 5,
  barcode: ''
});
