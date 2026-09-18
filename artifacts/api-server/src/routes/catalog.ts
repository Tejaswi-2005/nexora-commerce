import { Router, type IRouter } from "express";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import {
  GetProductParams,
  GetSearchSuggestionsQueryParams,
  ListProductsQueryParams,
  ListCategoriesResponse,
  ListNewArrivalsResponse,
  ListProductsResponse,
  ListRelatedProductsResponse,
  ListTrendingProductsResponse,
  GetProductResponse,
  GetSearchSuggestionsResponse,
} from "@workspace/api-zod";
import { db, categoriesTable, couponsTable, productsTable } from "@workspace/db";
import { expandedProductSeeds } from "./catalog-expansion";

const router: IRouter = Router();

const categorySeeds = [
  ["Electronics", "electronics", "Smart tools for everyday life", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80"],
  ["Fashion", "fashion", "Quietly confident pieces", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"],
  ["Footwear", "footwear", "Made for the long way around", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"],
  ["Beauty", "beauty", "Daily rituals, refined", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80"],
  ["Home & Living", "home", "Objects with a point of view", "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80"],
  ["Accessories", "accessories", "The finishing details", "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80"],
  ["Sports", "sports", "Tools for moving well", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"],
];

const productSeeds: Array<
  [
    string,
    string,
    string,
    string,
    string,
    number,
    number,
    number,
    number,
    number,
    number,
    boolean,
    boolean,
    string[],
    string[],
    string,
    string[],
    string[],
  ]
> = [
  ["aether-noise-canceling-headphones", "Aether Noise-Canceling Headphones", "Sonora", "electronics", "Immersive sound, tuned for long listening sessions and quiet focus.", 149, 189, 21, 4.8, 126, 18, true, false, ["Midnight", "Bone"], [], "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85"], ["audio", "travel", "focus"]],
  ["forma-everyday-sneaker", "Forma Everyday Sneaker", "Nori Studio", "footwear", "A clean everyday silhouette with a cushioned sole and considered materials.", 118, 145, 19, 4.7, 89, 32, true, true, ["Chalk", "Ink"], ["6", "7", "8", "9", "10", "11"], "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85"], ["everyday", "footwear"]],
  ["linen-overshirt", "Washed Linen Overshirt", "Atelier North", "fashion", "An easy layer in washed linen with a relaxed fit and soft structure.", 86, 110, 22, 4.6, 54, 24, false, true, ["Sand", "Olive"], ["S", "M", "L", "XL"], "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1200&q=85"], ["linen", "layering", "new"]],
  ["halo-portable-speaker", "Halo Portable Speaker", "Onda", "electronics", "Small enough for a shelf, expansive enough for the room.", 96, 120, 20, 4.5, 42, 12, false, false, ["Cloud", "Sage"], [], "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=85"], ["audio", "home"]],
  ["arc-minimal-watch", "Arc Minimal Watch", "Meridian", "accessories", "A precise everyday watch with a brushed steel case and soft leather strap.", 174, 215, 19, 4.9, 73, 9, true, false, ["Steel", "Graphite"], [], "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85"], ["watch", "gifting"]],
  ["daily-ritual-set", "Daily Ritual Set", "Tallow & Tide", "beauty", "A three-step ritual for clean, calm mornings and slower evenings.", 64, 78, 18, 4.7, 61, 26, false, true, ["Clear"], [], "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=1200&q=85"], ["skincare", "ritual", "new"]],
  ["mori-ceramic-vase", "Mori Ceramic Vase", "Mori Objects", "home", "Hand-finished stoneware with a quiet profile for a single branch or a full arrangement.", 52, 68, 24, 4.4, 28, 14, false, false, ["Oat"], [], "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1200&q=85"], ["home", "objects"]],
  ["tempo-running-cap", "Tempo Running Cap", "Field Notes", "sports", "Lightweight performance fabric and a low-profile fit for early starts.", 34, 42, 19, 4.3, 19, 41, false, false, ["Cobalt", "Black"], [], "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85", ["https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85"], ["running", "outdoors"]],
];

const toProduct = (product: typeof productsTable.$inferSelect) => ({
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

export async function ensureCatalogSeeded(): Promise<void> {
  await db.insert(categoriesTable).values(
    categorySeeds.map(([name, slug, description, imageUrl]) => ({
      name,
      slug,
      description,
      imageUrl,
    })),
  ).onConflictDoUpdate({
    target: categoriesTable.slug,
    set: {
      name: sql`excluded.name`,
      description: sql`excluded.description`,
      imageUrl: sql`excluded.image_url`,
    },
  });

  await db.insert(productsTable).values(
    productSeeds.map(([slug, name, brand, categorySlug, description, price, originalPrice, discountPercent, rating, reviewCount, stock, featured, isNew, colors, sizes, imageUrl, gallery, tags]) => ({
      slug,
      name,
      brand,
      categorySlug,
      description,
      price: String(price),
      originalPrice: String(originalPrice),
      discountPercent,
      rating: String(rating),
      reviewCount,
      stock,
      featured,
      isNew,
      colors,
      sizes,
      imageUrl,
      gallery,
      tags,
    })),
  ).onConflictDoNothing();

  await db
    .insert(productsTable)
    .values(expandedProductSeeds)
    .onConflictDoUpdate({
      target: productsTable.slug,
      set: {
        imageUrl: sql`excluded.image_url`,
        gallery: sql`excluded.gallery`,
      },
    });

  await db.insert(couponsTable).values([
    { code: "WELCOME10", discountType: "percentage", discountValue: "10", minimumOrder: "50" },
    { code: "SAVE20", discountType: "percentage", discountValue: "20", minimumOrder: "120" },
  ]).onConflictDoNothing();
}

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.name));
  const products = await db.select({ categorySlug: productsTable.categorySlug }).from(productsTable);
  const counts = new Map<string, number>();
  for (const product of products) counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
  res.json(ListCategoriesResponse.parse(categories.map((category) => ({ ...category, productCount: counts.get(category.slug) ?? 0 }))));
});

router.get("/products/trending", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(asc(productsTable.name)).limit(6);
  res.json(ListTrendingProductsResponse.parse(products.map(toProduct)));
});

router.get("/products/new-arrivals", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.isNew, true)).limit(6);
  res.json(ListNewArrivalsResponse.parse(products.map(toProduct)));
});

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, category, sort = "recommended", minPrice, maxPrice, page = 1, pageSize = 24 } = parsed.data;
  const conditions = [];
  if (category) conditions.push(eq(productsTable.categorySlug, category));
  if (search) {
    conditions.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.brand, `%${search}%`), ilike(productsTable.description, `%${search}%`)));
  }
  if (minPrice !== undefined) conditions.push(ilike(productsTable.price, `${minPrice}%`));
  const products = await db.select().from(productsTable).where(conditions.length ? and(...conditions) : undefined);
  let filtered = products.filter((product) => maxPrice === undefined || Number(product.price) <= maxPrice);
  if (minPrice !== undefined) filtered = filtered.filter((product) => Number(product.price) >= minPrice);
  if (sort === "price-asc") filtered.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "price-desc") filtered.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "rating") filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
  if (sort === "newest") filtered.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  res.json(ListProductsResponse.parse({
    items: filtered.slice(start, start + pageSize).map(toProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }));
});

router.get("/products/:slug/related", async (req, res): Promise<void> => {
  const params = ListRelatedProductsResponse.parse;
  const product = await db.select().from(productsTable).where(eq(productsTable.slug, String(req.params.slug))).limit(1);
  if (!product[0]) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const related = await db.select().from(productsTable).where(eq(productsTable.categorySlug, product[0].categorySlug)).limit(4);
  res.json(params(related.filter((item) => item.id !== product[0].id).map(toProduct)));
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const product = await db.select().from(productsTable).where(eq(productsTable.slug, parsed.data.slug)).limit(1);
  if (!product[0]) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(toProduct(product[0])));
});

router.get("/search/suggestions", async (req, res): Promise<void> => {
  const parsed = GetSearchSuggestionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const products = await db.select().from(productsTable).where(or(ilike(productsTable.name, `%${parsed.data.q}%`), ilike(productsTable.brand, `%${parsed.data.q}%`))).limit(6);
  res.json(GetSearchSuggestionsResponse.parse(products.map((product) => ({ label: product.name, type: "product", slug: product.slug, imageUrl: product.imageUrl }))));
});

export default router;