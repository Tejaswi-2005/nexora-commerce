import { Router, type IRouter } from "express";
import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import {
  AddCartItemBody,
  AddCartItemResponse,
  CreateCheckoutBody,
  CreateCheckoutResponse,
  GetAccountResponse,
  GetCartResponse,
  GetOrderParams,
  GetOrderResponse,
  GetWishlistResponse,
  ListOrdersResponse,
  RemoveCartItemParams,
  RemoveCartItemResponse,
  ToggleWishlistBody,
  ToggleWishlistResponse,
  UpdateCartItemBody,
  UpdateCartItemParams,
  UpdateCartItemResponse,
  ValidateCouponBody,
  ValidateCouponResponse,
} from "@workspace/api-zod";
import {
  cartItemsTable,
  cartsTable,
  couponsTable,
  db,
  orderItemsTable,
  ordersTable,
  productsTable,
  wishlistItemsTable,
} from "@workspace/db";

const router: IRouter = Router();

const sessionFor = (req: { header: (name: string) => string | undefined }) =>
  req.header("x-session-id") || "demo-session";

const money = (value: string | number) => Number(Number(value).toFixed(2));

const productShape = (product: typeof productsTable.$inferSelect) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  category: product.categorySlug[0].toUpperCase() + product.categorySlug.slice(1),
  categorySlug: product.categorySlug,
  description: product.description,
  price: money(product.price),
  originalPrice: money(product.originalPrice),
  discountPercent: product.discountPercent,
  rating: money(product.rating),
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

async function ensureCart(sessionId: string) {
  const existing = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db.insert(cartsTable).values({ sessionId }).returning();
  return created;
}

async function cartResponse(sessionId: string) {
  const cart = await ensureCart(sessionId);
  const rows = await db
    .select({ item: cartItemsTable, product: productsTable })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cart.id));
  const items = rows.map(({ item, product }) => ({
    id: item.id,
    product: productShape(product),
    quantity: item.quantity,
    color: item.color,
    size: item.size,
    lineTotal: money(Number(product.price) * item.quantity),
  }));
  const subtotal = money(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const delivery = subtotal === 0 || subtotal >= 100 ? 0 : 8;
  const tax = money(subtotal * 0.08);
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    discount: 0,
    delivery,
    tax,
    total: money(subtotal + delivery + tax),
  };
}

async function orderResponse(order: typeof ordersTable.$inferSelect) {
  const rows = await db
    .select({ item: orderItemsTable, product: productsTable })
    .from(orderItemsTable)
    .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id));
  const address = JSON.parse(order.address) as Record<string, string>;
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    paymentStatus: order.paymentStatus,
    items: rows.map(({ item, product }) => ({
      product: productShape(product),
      quantity: item.quantity,
      price: money(item.price),
    })),
    total: money(order.total),
    address,
  };
}

router.get("/cart", async (req, res): Promise<void> => {
  res.json(GetCartResponse.parse(await cartResponse(sessionFor(req))));
});

router.post("/cart", async (req, res): Promise<void> => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const sessionId = sessionFor(req);
  const cart = await ensureCart(sessionId);
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parsed.data.productId)).limit(1);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const existing = await db
    .select()
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.cartId, cart.id),
        eq(cartItemsTable.productId, parsed.data.productId),
        parsed.data.color
          ? eq(cartItemsTable.color, parsed.data.color)
          : sql`${cartItemsTable.color} is null`,
        parsed.data.size
          ? eq(cartItemsTable.size, parsed.data.size)
          : sql`${cartItemsTable.size} is null`,
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db.update(cartItemsTable).set({ quantity: existing[0].quantity + parsed.data.quantity }).where(eq(cartItemsTable.id, existing[0].id));
  } else {
    await db.insert(cartItemsTable).values({
      cartId: cart.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      color: parsed.data.color ?? null,
      size: parsed.data.size ?? null,
    });
  }
  res.json(AddCartItemResponse.parse(await cartResponse(sessionId)));
});

router.patch("/cart/:itemId", async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  const body = UpdateCartItemBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid cart item update" });
    return;
  }
  const cart = await ensureCart(sessionFor(req));
  const [ownedItem] = await db
    .select({ id: cartItemsTable.id })
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.id, params.data.itemId), eq(cartItemsTable.cartId, cart.id)))
    .limit(1);
  if (!ownedItem) {
    res.status(404).json({ error: "Cart item not found" });
    return;
  }
  if (body.data.quantity === 0) {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, params.data.itemId), eq(cartItemsTable.cartId, cart.id)));
  } else {
    await db
      .update(cartItemsTable)
      .set({ quantity: body.data.quantity })
      .where(and(eq(cartItemsTable.id, params.data.itemId), eq(cartItemsTable.cartId, cart.id)));
  }
  res.json(UpdateCartItemResponse.parse(await cartResponse(sessionFor(req))));
});

router.delete("/cart/:itemId", async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const cart = await ensureCart(sessionFor(req));
  await db
    .delete(cartItemsTable)
    .where(and(eq(cartItemsTable.id, params.data.itemId), eq(cartItemsTable.cartId, cart.id)));
  res.json(RemoveCartItemResponse.parse(await cartResponse(sessionFor(req))));
});

router.get("/wishlist", async (req, res): Promise<void> => {
  const rows = await db
    .select({ product: productsTable })
    .from(wishlistItemsTable)
    .innerJoin(productsTable, eq(wishlistItemsTable.productId, productsTable.id))
    .where(eq(wishlistItemsTable.sessionId, sessionFor(req)));
  res.json(GetWishlistResponse.parse(rows.map(({ product }) => productShape(product))));
});

router.post("/wishlist", async (req, res): Promise<void> => {
  const parsed = ToggleWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const sessionId = sessionFor(req);
  const existing = await db.select().from(wishlistItemsTable).where(and(eq(wishlistItemsTable.sessionId, sessionId), eq(wishlistItemsTable.productId, parsed.data.productId))).limit(1);
  if (existing[0]) {
    await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, existing[0].id));
  } else {
    await db.insert(wishlistItemsTable).values({ sessionId, productId: parsed.data.productId });
  }
  const rows = await db.select({ product: productsTable }).from(wishlistItemsTable).innerJoin(productsTable, eq(wishlistItemsTable.productId, productsTable.id)).where(eq(wishlistItemsTable.sessionId, sessionId));
  res.json(ToggleWishlistResponse.parse(rows.map(({ product }) => productShape(product))));
});

router.post("/checkout/validate-coupon", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, parsed.data.code.toUpperCase())).limit(1);
  if (!coupon || !coupon.active) {
    res.json(ValidateCouponResponse.parse({ valid: false, code: parsed.data.code, discount: 0, message: "That code is not active." }));
    return;
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.json(ValidateCouponResponse.parse({ valid: false, code: coupon.code, discount: 0, message: "That code has expired." }));
    return;
  }
  if (parsed.data.subtotal < Number(coupon.minimumOrder)) {
    res.json(ValidateCouponResponse.parse({ valid: false, code: coupon.code, discount: 0, message: `Add ${money(Number(coupon.minimumOrder) - parsed.data.subtotal).toFixed(2)} more to use this code.` }));
    return;
  }
  const discount = coupon.discountType === "percentage" ? money(parsed.data.subtotal * (Number(coupon.discountValue) / 100)) : money(Number(coupon.discountValue));
  res.json(ValidateCouponResponse.parse({ valid: true, code: coupon.code, discount, message: `${coupon.code} applied.` }));
});

router.post("/checkout", async (req, res): Promise<void> => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const sessionId = sessionFor(req);
  const cart = await ensureCart(sessionId);
  const rows = await db.select({ item: cartItemsTable, product: productsTable }).from(cartItemsTable).innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id)).where(eq(cartItemsTable.cartId, cart.id));
  if (rows.length === 0) {
    res.status(400).json({ error: "Your cart is empty." });
    return;
  }
  const unavailable = rows.find(({ item, product }) => item.quantity > product.stock);
  if (unavailable) {
    res.status(409).json({
      error: `${unavailable.product.name} does not have enough stock for that quantity.`,
    });
    return;
  }
  const subtotal = rows.reduce((sum, row) => sum + Number(row.product.price) * row.item.quantity, 0);
  let discount = 0;
  if (parsed.data.couponCode) {
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, parsed.data.couponCode.toUpperCase())).limit(1);
    if (coupon?.active && subtotal >= Number(coupon.minimumOrder)) discount = coupon.discountType === "percentage" ? subtotal * Number(coupon.discountValue) / 100 : Number(coupon.discountValue);
  }
  const delivery = parsed.data.deliveryMethod === "express" ? 18 : subtotal >= 100 ? 0 : 8;
  const tax = (subtotal - discount) * 0.08;
  const total = money(subtotal - discount + delivery + tax);
  const created = await db.transaction(async (tx) => {
    const [order] = await tx.insert(ordersTable).values({
      sessionId,
      status: "confirmed",
      paymentStatus: parsed.data.paymentMethod === "cod" ? "pending" : "paid",
      total: String(total),
      address: JSON.stringify(parsed.data.address),
    }).returning();
    await tx.insert(orderItemsTable).values(rows.map(({ item, product }) => ({
      orderId: order.id,
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
    })));
    for (const { item, product } of rows) {
      const updated = await tx
        .update(productsTable)
        .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
        .where(and(eq(productsTable.id, product.id), sql`${productsTable.stock} >= ${item.quantity}`))
        .returning({ id: productsTable.id });
      if (!updated[0]) {
        throw new Error(`Insufficient stock for ${product.name}.`);
      }
    }
    await tx.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
    return order;
  });
  res.status(201).json(CreateCheckoutResponse.parse(await orderResponse(created)));
});

router.get("/orders", async (req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.sessionId, sessionFor(req))).orderBy(ordersTable.createdAt);
  res.json(ListOrdersResponse.parse(await Promise.all(orders.map(orderResponse))));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.sessionId, sessionFor(req)))).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(GetOrderResponse.parse(await orderResponse(order)));
});

router.get("/account", async (req, res): Promise<void> => {
  const sessionId = sessionFor(req);
  const orders = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.sessionId, sessionId));
  const wishlist = await db.select({ id: wishlistItemsTable.id }).from(wishlistItemsTable).where(eq(wishlistItemsTable.sessionId, sessionId));
  res.json(GetAccountResponse.parse({
    id: sessionId,
    name: "NEXORA Guest",
    email: "guest@nexora.local",
    initials: "NG",
    orderCount: orders.length,
    wishlistCount: wishlist.length,
    addresses: [],
  }));
});

export default router;