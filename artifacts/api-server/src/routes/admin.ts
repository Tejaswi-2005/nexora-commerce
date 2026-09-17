import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  CreateAdminProductBody,
  CreateAdminProductResponse,
  GetAdminSummaryResponse,
  UpdateAdminProductBody,
  UpdateAdminProductResponse,
} from "@workspace/api-zod";
import { db, productsTable } from "@workspace/db";

const router: IRouter = Router();

const productShape = (product: typeof productsTable.$inferSelect) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  category: product.categorySlug[0].toUpperCase() + product.categorySlug.slice(1),
  categorySlug: product.categorySlug,
  description: product.description,
  price: Number(product.price),
  originalPrice: Number(product.originalPrice),
  discountPercent: product.discountPercent,
  rating: Number(product.rating),
  reviewCount: product.reviewCount,
  stock: product.stock,
  featured: product.featured,
  isNew: product.isNew,
  colors: product.colors,
  sizes: product.sizes,
  imageUrl: product.imageUrl,
  gallery: product.gallery,
  tags: product.tags,
});

router.get("/admin/summary", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  res.json(GetAdminSummaryResponse.parse({
    revenue: 48290,
    orders: 318,
    customers: 224,
    products: products.length,
    lowStock: products.filter((product) => product.stock < 12).length,
    sales: [
      { label: "Mon", value: 1240 },
      { label: "Tue", value: 1680 },
      { label: "Wed", value: 1420 },
      { label: "Thu", value: 2210 },
      { label: "Fri", value: 1940 },
      { label: "Sat", value: 2780 },
      { label: "Sun", value: 2460 },
    ],
  }));
});

router.post("/admin/products", async (req, res): Promise<void> => {
  const parsed = CreateAdminProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [product] = await db.insert(productsTable).values({
    slug,
    name: parsed.data.name,
    brand: parsed.data.brand,
    categorySlug: parsed.data.categorySlug,
    description: `${parsed.data.name} from ${parsed.data.brand}.`,
    price: String(parsed.data.price),
    originalPrice: String(parsed.data.originalPrice),
    discountPercent: Math.max(0, Math.round((1 - parsed.data.price / parsed.data.originalPrice) * 100)),
    stock: parsed.data.stock,
    imageUrl: parsed.data.imageUrl,
    gallery: [parsed.data.imageUrl],
    tags: [],
    colors: [],
    sizes: [],
  }).returning();
  res.status(201).json(CreateAdminProductResponse.parse(productShape(product)));
});

router.patch("/admin/products", async (req, res): Promise<void> => {
  const parsed = UpdateAdminProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.update(productsTable).set({
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.price !== undefined ? { price: String(parsed.data.price) } : {}),
    ...(parsed.data.originalPrice !== undefined ? { originalPrice: String(parsed.data.originalPrice) } : {}),
    ...(parsed.data.stock !== undefined ? { stock: parsed.data.stock } : {}),
    ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
  }).where(eq(productsTable.id, parsed.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(UpdateAdminProductResponse.parse(productShape(product)));
});

export default router;