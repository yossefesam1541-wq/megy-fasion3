import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { and, asc, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import {
  AdminLoginBody,
  CreateAdminProductBody,
  CreateAdminProductResponse,
  CreateOrderBody,
  CreateOrderResponse,
  GetAdminOverviewResponse,
  GetProductParams,
  GetProductResponse,
  ListAdminOrdersResponse,
  ListAdminProductsResponse,
  ListCategoriesResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  UpdateAdminOrderStatusBody,
  UpdateAdminOrderStatusParams,
  UpdateAdminOrderStatusResponse,
} from "@workspace/api-zod";
import { db, ordersTable, productsTable } from "@workspace/db";

const router: IRouter = Router();

const categoryLabels = { clothing: "الملابس", scales: "الموازين" } as const;
const ADMIN_USERNAME = "admin";
const ADMIN_SESSION_COOKIE = "medy_admin_session";
const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

// Brute-force protection for the admin login form.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

// Basic abuse/stock-exhaustion protection for public order creation.
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many orders from this device. Try again later." },
});

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be configured for admin sessions");
  return secret;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string) {
  const leftHash = hashValue(left);
  const rightHash = hashValue(right);
  return timingSafeEqual(leftHash, rightHash);
}

function createAdminSession() {
  const payload = `${ADMIN_USERNAME}.${Date.now()}`;
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

function hasValidAdminSession(req: Request) {
  const token = req.cookies?.[ADMIN_SESSION_COOKIE];
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const [username, timestampText] = payload.split(".");
    const timestamp = Number(timestampText);
    const expectedSignature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
    return username === ADMIN_USERNAME
      && Number.isFinite(timestamp)
      && Date.now() - timestamp >= 0
      && Date.now() - timestamp < ADMIN_SESSION_MAX_AGE_MS
      && safeEqual(signature, expectedSignature);
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (hasValidAdminSession(req)) {
    next();
    return;
  }
  res.status(401).json({ error: "Admin authentication required" });
}

// Thrown to signal an expected, user-facing order failure (e.g. out of stock)
// from inside a db.transaction() callback, distinguishing it from unexpected
// errors that should still bubble up as 500s.
class OrderFailure extends Error {}

function serializeProduct(product: typeof productsTable.$inferSelect) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category as "clothing" | "scales",
    categoryLabel: product.categoryLabel,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice == null ? null : Number(product.compareAtPrice),
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    image: product.image,
    badge: product.badge,
    description: product.description,
    stock: product.stock,
    specs: product.specs,
    options: product.options,
  };
}

router.get("/categories", async (_req, res): Promise<void> => {
  const grouped = await db
    .select({
      category: productsTable.category,
      count: sql<number>`count(*)`,
    })
    .from(productsTable)
    .groupBy(productsTable.category);

  const countByCategory = new Map(grouped.map((row) => [row.category, Number(row.count)]));
  const categories = [
    {
      id: 1,
      slug: "clothing",
      name: "الملابس",
      eyebrow: "أساسيات يومية",
      productCount: countByCategory.get("clothing") ?? 0,
      accent: "clay",
    },
    {
      id: 2,
      slug: "scales",
      name: "الموازين",
      eyebrow: "دقة تثق بها",
      productCount: countByCategory.get("scales") ?? 0,
      accent: "blue",
    },
  ];

  res.json(ListCategoriesResponse.parse(categories));
});

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, search, sort, limit } = parsed.data;
  const filters = [];
  if (category === "clothing" || category === "scales") {
    filters.push(eq(productsTable.category, category));
  }
  if (search) {
    filters.push(
      or(
        ilike(productsTable.name, `%${search}%`),
        ilike(productsTable.description, `%${search}%`),
      ),
    );
  }

  const query = db
    .select()
    .from(productsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(sort === "price_asc" ? asc(productsTable.price) : sort === "price_desc" ? desc(productsTable.price) : desc(productsTable.createdAt))
    .limit(limit ?? 50);
  const products = (await query).map(serializeProduct);
  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(serializeProduct(product)));
});

router.post("/orders", createOrderLimiter, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Merge duplicate lines for the same product+option so a repeated line
  // can't be used to decrement stock more than once per unit intended.
  const mergedItems = new Map<string, { productId: number; quantity: number; option?: string | null }>();
  for (const item of parsed.data.items) {
    const key = `${item.productId}:${item.option ?? ""}`;
    const existing = mergedItems.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      mergedItems.set(key, { ...item });
    }
  }

  try {
    const order = await db.transaction(async (tx) => {
      const productIds = [...mergedItems.values()].map((item) => item.productId);
      const products = await tx
        .select()
        .from(productsTable)
        .where(sql`${productsTable.id} IN ${sql.join(productIds.map((id) => sql`${id}`), sql`, `)}`);
      const productById = new Map(products.map((product) => [product.id, product]));

      let total = 0;
      for (const item of mergedItems.values()) {
        const product = productById.get(item.productId);
        if (!product) {
          throw new OrderFailure("Some products are unavailable or out of stock");
        }
        total += Number(product.price) * item.quantity;
      }

      // Atomically decrement stock: the WHERE clause only succeeds if enough
      // stock is still available at the moment of the write, which closes the
      // read-check-write race that concurrent orders could otherwise exploit.
      for (const item of mergedItems.values()) {
        const [updated] = await tx
          .update(productsTable)
          .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
          .where(and(eq(productsTable.id, item.productId), gte(productsTable.stock, item.quantity)))
          .returning({ id: productsTable.id });
        if (!updated) {
          throw new OrderFailure("Some products are unavailable or out of stock");
        }
      }

      const orderNumber = `MT-${Date.now().toString().slice(-8)}`;
      const [created] = await tx
        .insert(ordersTable)
        .values({
          orderNumber,
          customerName: parsed.data.customerName,
          phone: parsed.data.phone,
          address: parsed.data.address,
          city: parsed.data.city,
          total: total.toFixed(2),
          status: "new",
          paymentStatus: "pending",
          items: [...mergedItems.values()],
        })
        .returning();

      return created;
    });

    res.status(201).json(CreateOrderResponse.parse({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      total: Number(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    }));
  } catch (error) {
    if (error instanceof OrderFailure) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post("/admin/auth/login", adminLoginLimiter, async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    res.status(503).json({ error: "Admin password is not configured" });
    return;
  }

  if (parsed.data.username !== ADMIN_USERNAME || !safeEqual(parsed.data.password, configuredPassword)) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return;
  }

  res.cookie(ADMIN_SESSION_COOKIE, createAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE_MS,
    path: "/",
  });
  res.json({ authenticated: true, username: ADMIN_USERNAME });
});

router.get("/admin/auth/session", (req, res): void => {
  if (!hasValidAdminSession(req)) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.json({ authenticated: true, username: ADMIN_USERNAME });
});

router.post("/admin/auth/logout", (req, res): void => {
  res.clearCookie(ADMIN_SESSION_COOKIE, { httpOnly: true, sameSite: "lax", path: "/" });
  res.json({ success: true });
});

// getDay(): 0=Sunday...6=Saturday, matching this array's index.
const ARABIC_DAY_LABELS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

router.get("/admin/overview", requireAdmin, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  // Cancelled orders never generated real revenue or fulfilled sales, so they
  // are excluded from every metric below.
  const activeOrders = orders.filter((order) => order.status !== "cancelled");

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysOrders = activeOrders.filter((order) => order.createdAt.toISOString().slice(0, 10) === todayKey);
  const revenueToday = todaysOrders.reduce((sum, order) => sum + Number(order.total), 0);

  // Real revenue per day for the last 7 days (today inclusive), keyed by date
  // so multiple orders on the same day accumulate correctly.
  const revenueByDate = new Map<string, number>();
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    last7Days.push(key);
    revenueByDate.set(key, 0);
  }
  for (const order of activeOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (revenueByDate.has(key)) {
      revenueByDate.set(key, (revenueByDate.get(key) ?? 0) + Number(order.total));
    }
  }
  const sales = last7Days.map((key) => ({
    label: ARABIC_DAY_LABELS[new Date(key).getUTCDay()],
    value: revenueByDate.get(key) ?? 0,
  }));

  // Real best-sellers computed from actual order line items, not a fixture.
  const soldByProduct = new Map<number, number>();
  for (const order of activeOrders) {
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      soldByProduct.set(item.productId, (soldByProduct.get(item.productId) ?? 0) + item.quantity);
    }
  }
  const productById = new Map(products.map((product) => [product.id, product]));
  const topProducts = [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([productId, sold]) => {
      const product = productById.get(productId);
      return {
        name: product?.name ?? `منتج #${productId}`,
        sold,
        // Revenue uses the product's current price since line-item prices
        // aren't stored on the order; treat as an estimate for past price changes.
        revenue: (product ? Number(product.price) : 0) * sold,
      };
    });

  const overview = {
    ordersToday: todaysOrders.length,
    revenueToday,
    activeProducts: products.length,
    lowStock: products.filter((product) => product.stock <= 8).length,
    pendingOrders: orders.filter((order) => order.status === "new" || order.status === "preparing").length,
    sales,
    topProducts,
  };
  res.json(GetAdminOverviewResponse.parse(overview));
});

router.get("/admin/products", requireAdmin, async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.createdAt));
  res.json(ListAdminProductsResponse.parse(products.map(serializeProduct)));
});

router.post("/admin/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAdminProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const slugBase = input.name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "") || "product";
  const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;
  const [product] = await db
    .insert(productsTable)
    .values({
      name: input.name.trim(),
      slug,
      category: input.category,
      categoryLabel: categoryLabels[input.category],
      price: input.price.toFixed(2),
      compareAtPrice: input.compareAtPrice == null ? null : input.compareAtPrice.toFixed(2),
      image: input.image.trim(),
      badge: input.badge?.trim() || null,
      description: input.description.trim(),
      stock: input.stock,
      specs: input.specs ?? [],
      options: input.options ?? [],
    })
    .returning();

  res.status(201).json(CreateAdminProductResponse.parse(serializeProduct(product)));
});

function serializeAdminOrder(
  order: typeof ordersTable.$inferSelect,
  productById: Map<number, typeof productsTable.$inferSelect>,
) {
  const rawItems = Array.isArray(order.items) ? order.items : [];
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    city: order.city,
    total: Number(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    items: rawItems.map((item) => ({
      productId: item.productId,
      productName: productById.get(item.productId)?.name ?? `منتج #${item.productId}`,
      quantity: item.quantity,
      option: item.option ?? null,
    })),
    createdAt: order.createdAt,
  };
}

router.get("/admin/orders", requireAdmin, async (_req, res): Promise<void> => {
  const [orders, products] = await Promise.all([
    db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)),
    db.select().from(productsTable),
  ]);
  const productById = new Map(products.map((product) => [product.id, product]));
  res.json(ListAdminOrdersResponse.parse(orders.map((order) => serializeAdminOrder(order, productById))));
});

router.patch("/admin/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateAdminOrderStatusParams.safeParse(req.params);
  const body = UpdateAdminOrderStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid order status" });
    return;
  }

  const updated = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
    if (!existing) return null;

    const isNewlyCancelled = body.data.status === "cancelled" && existing.status !== "cancelled";
    const isUncancelled = body.data.status !== "cancelled" && existing.status === "cancelled";

    // Cancelling an order releases the stock it had reserved. Re-activating a
    // previously-cancelled order (e.g. an admin correcting a mistake) takes it
    // back out, subject to stock still being available.
    if (isNewlyCancelled) {
      const items = Array.isArray(existing.items) ? existing.items : [];
      for (const item of items) {
        await tx
          .update(productsTable)
          .set({ stock: sql`${productsTable.stock} + ${item.quantity}` })
          .where(eq(productsTable.id, item.productId));
      }
    } else if (isUncancelled) {
      const items = Array.isArray(existing.items) ? existing.items : [];
      for (const item of items) {
        const [decremented] = await tx
          .update(productsTable)
          .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
          .where(and(eq(productsTable.id, item.productId), gte(productsTable.stock, item.quantity)))
          .returning({ id: productsTable.id });
        if (!decremented) {
          throw new OrderFailure("Cannot restore this order: insufficient stock");
        }
      }
    }

    const [row] = await tx
      .update(ordersTable)
      .set({
        status: body.data.status,
        paymentStatus: isNewlyCancelled
          ? "pending"
          : body.data.status === "delivered"
            ? "collected"
            : undefined,
      })
      .where(eq(ordersTable.id, params.data.id))
      .returning();
    return row ?? null;
  }).catch((error) => {
    if (error instanceof OrderFailure) return "conflict" as const;
    throw error;
  });

  if (updated === "conflict") {
    res.status(409).json({ error: "Cannot restore this order: insufficient stock" });
    return;
  }
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const products = await db.select().from(productsTable);
  res.json(UpdateAdminOrderStatusResponse.parse(serializeAdminOrder(updated, new Map(products.map((product) => [product.id, product])))));
});

export default router;