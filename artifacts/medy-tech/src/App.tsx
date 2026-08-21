import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getGetProductQueryKey,
  getGetOrderTrackingQueryKey,
  getListCategoriesQueryKey,
  getListProductsQueryKey,
  useCreateOrder,
  useGetOrderTracking,
  useGetProduct,
  useListCategories,
  useListProducts,
} from "@workspace/api-client-react";
import type {
  Category,
  OrderInput,
  Product,
} from "@workspace/api-client-react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CreditCard,
  Filter,
  Heart,
  Menu,
  Minus,
  Moon,
  PanelRight,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  MessageCircle,
  Sparkles,
  Star,
  Sun,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
  useParams,
} from "wouter";
import "./index.css";

const queryClient = new QueryClient();

type CartLine = { product: Product; quantity: number; option: string | null };

const fallbackImage = (kind: "clothing" | "scales", tone = "#e8dfcf") =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='1000' viewBox='0 0 900 1000'%3E%3Crect width='900' height='1000' fill='${tone.replace("#", "%23")}'/%3E%3Ccircle cx='680' cy='180' r='210' fill='%23ffffff' fill-opacity='.28'/%3E%3Cpath d='M0 820 C220 660 390 920 900 690 L900 1000 L0 1000Z' fill='%232a376e' fill-opacity='.16'/%3E%3C${kind === "clothing" ? "path d='M315 260 L405 195 L495 260 L620 360 L570 440 L505 390 L535 775 L365 775 L395 390 L330 440 L280 360Z' fill='%232a376e' fill-opacity='.88'/%3E" : "rect x='260' y='350' width='380' height='260' rx='28' fill='%23f7f2e8' stroke='%232a376e' stroke-width='16'/%3Cpath d='M315 350v-90h270v90 M400 480h100' fill='none' stroke='%23d79d37' stroke-width='18' stroke-linecap='round'/%3C"}%3C/svg%3E`;

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "قميص ندى الكتاني",
    slug: "nada-linen-shirt",
    category: "clothing",
    categoryLabel: "ملابس",
    price: 185,
    compareAtPrice: 220,
    rating: 4.8,
    reviewCount: 32,
    image: fallbackImage("clothing", "#d9e0dd"),
    badge: "اختيار الفريق",
    description:
      "قميص بقصة هادئة وملمس كتاني خفيف، مصمم لأيام المدينة الطويلة.",
    stock: 18,
    specs: [
      { label: "الخامة", value: "كتان قطني" },
      { label: "القصة", value: "مريحة" },
    ],
    options: ["S", "M", "L", "XL"],
  },
  {
    id: 2,
    name: "ميزان ميرا الدقيق",
    slug: "mira-precision-scale",
    category: "scales",
    categoryLabel: "موازين",
    price: 249,
    compareAtPrice: 289,
    rating: 4.9,
    reviewCount: 41,
    image: fallbackImage("scales", "#dfe3ed"),
    badge: "دقة 0.01 غ",
    description:
      "ميزان صغير للمطبخ والعمل، بقراءة واضحة وثبات يطمئنك من أول استخدام.",
    stock: 9,
    specs: [
      { label: "الدقة", value: "0.01 غرام" },
      { label: "السعة", value: "500 غرام" },
    ],
    options: ["أبيض لؤلؤي", "رمادي حجري"],
  },
  {
    id: 3,
    name: "سترة سُلاف اليومية",
    slug: "sulaf-daily-jacket",
    category: "clothing",
    categoryLabel: "ملابس",
    price: 315,
    compareAtPrice: null,
    rating: 4.7,
    reviewCount: 18,
    image: fallbackImage("clothing", "#e5d9cb"),
    badge: "وصل حديثاً",
    description: "طبقة خفيفة بلون ترابي دافئ، تلتف حول إطلالتك بدون ضجيج.",
    stock: 14,
    specs: [
      { label: "الخامة", value: "قطن ممشط" },
      { label: "اللون", value: "طيني فاتح" },
    ],
    options: ["S", "M", "L"],
  },
  {
    id: 4,
    name: "ميزان أطلس للمحترفين",
    slug: "atlas-pro-scale",
    category: "scales",
    categoryLabel: "موازين",
    price: 410,
    compareAtPrice: 465,
    rating: 4.6,
    reviewCount: 14,
    image: fallbackImage("scales", "#e8dccb"),
    badge: "للعمل الدقيق",
    description:
      "سطح واسع وقراءة سريعة لورش العمل والمطابخ التي لا تساوم على النتيجة.",
    stock: 6,
    specs: [
      { label: "الدقة", value: "0.1 غرام" },
      { label: "السعة", value: "3 كيلوغرام" },
    ],
    options: ["أسود فحمي"],
  },
  {
    id: 5,
    name: "بنطال رَونق المستقيم",
    slug: "rawnaq-straight-pants",
    category: "clothing",
    categoryLabel: "ملابس",
    price: 220,
    compareAtPrice: 260,
    rating: 4.5,
    reviewCount: 21,
    image: fallbackImage("clothing", "#d6d6dc"),
    badge: null,
    description: "بنطال مستقيم بخصر مرن وتفاصيل عملية للحركة اليومية.",
    stock: 23,
    specs: [
      { label: "الخامة", value: "تويل قطني" },
      { label: "الطول", value: "كامل" },
    ],
    options: ["38", "40", "42", "44"],
  },
  {
    id: 6,
    name: "ميزان جيب نُقطة",
    slug: "noqta-pocket-scale",
    category: "scales",
    categoryLabel: "موازين",
    price: 115,
    compareAtPrice: null,
    rating: 4.4,
    reviewCount: 9,
    image: fallbackImage("scales", "#d5e2df"),
    badge: "الأكثر طلباً",
    description: "حجم صغير ودقة مفيدة في حقيبتك أو درج مكتبك.",
    stock: 31,
    specs: [
      { label: "الدقة", value: "0.1 غرام" },
      { label: "السعة", value: "200 غرام" },
    ],
    options: ["فضي"],
  },
];

const fallbackCategories: Category[] = [
  {
    id: 1,
    slug: "clothing",
    name: "ملابس مختارة",
    eyebrow: "ملمس يومي، حضور واضح",
    productCount: 24,
    accent: "#d79d37",
  },
  {
    id: 2,
    slug: "scales",
    name: "موازين دقيقة",
    eyebrow: "قياس تثق به",
    productCount: 12,
    accent: "#2d817a",
  },
];

function formatPrice(value: number) {
  return `${value.toLocaleString("ar-EG")} ج.م`;
}

function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient
          id="logoBadge"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#31408A" />
          <stop offset="1" stopColor="#242F63" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#logoBadge)" />
      <line
        x1="24"
        y1="45"
        x2="76"
        y2="45"
        stroke="#D79D37"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="45" r="2.2" fill="#D79D37" />
      <circle cx="76" cy="45" r="2.2" fill="#D79D37" />
      <path
        d="M17 45 Q24 58 31 45"
        fill="none"
        stroke="#D79D37"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M69 45 Q76 58 83 45"
        fill="none"
        stroke="#D79D37"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M29 73 L29 38 L50 59 L71 38 L71 73"
        fill="none"
        stroke="#F7F2E8"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 45 L50 59"
        stroke="#F7F2E8"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function useCart() {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("medy-cart") || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("medy-cart", JSON.stringify(cart));
  }, [cart]);
  const add = (
    product: Product,
    option: string | null = product.options?.[0] || null,
  ) => {
    if (product.stock <= 0) return;
    setCart((current) => {
      const found = current.find(
        (line) => line.product.id === product.id && line.option === option,
      );
      return found
        ? current.map((line) =>
            line === found
              ? {
                  ...line,
                  quantity: Math.min(line.quantity + 1, product.stock),
                }
              : line,
          )
        : [...current, { product, option, quantity: 1 }];
    });
  };
  const change = (index: number, delta: number) =>
    setCart((current) =>
      current.flatMap((line, i) =>
        i === index
          ? line.quantity + delta > 0
            ? [
                {
                  ...line,
                  quantity: Math.min(line.quantity + delta, line.product.stock),
                },
              ]
            : []
          : [line],
      ),
    );
  const remove = (index: number) =>
    setCart((current) => current.filter((_, i) => i !== index));
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce(
    (sum, line) => sum + line.quantity * line.product.price,
    0,
  );
  return { cart, add, change, remove, count, total, clear: () => setCart([]) };
}

function useTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("medy-theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("medy-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((value) => !value) };
}

function Shell({
  children,
  cartCount,
}: {
  children: React.ReactNode;
  cartCount: number;
}) {
  const { dark, toggle } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [location] = useLocation();
  return (
    <div dir="rtl" className="min-h-[100dvh] overflow-x-hidden">
      <div className="bg-primary px-4 py-2 text-center text-xs font-semibold tracking-wide text-primary-foreground">
        .التوصيل داخل مصر خلال 2–4 أيام  · الدفع عند الاستلام متاح .ضمان يومين من الاستعما                                              ل
      </div>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="header-shell flex h-[76px] items-center justify-between gap-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            data-testid="link-logo"
          >
            <LogoMark size={44} />
            <span className="hidden text-right sm:block">
              <strong className="display block text-lg leading-none tracking-tight">
                MEGY Fashion
              </strong>
              <small className="mt-1 block text-[10px] tracking-[.22em] text-muted-foreground">
                ONLINE STORE
              </small>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <Link
              href="/"
              className={
                location === "/"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
              data-testid="link-home"
            >
              الرئيسية
            </Link>
            <Link
              href="/category/clothing"
              className={
                location.includes("clothing")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
              data-testid="link-clothing"
            >
              الملابس
            </Link>
            <Link
              href="/category/scales"
              className={
                location.includes("scales")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
              data-testid="link-scales"
            >
              الموازين
            </Link>
            <Link
              href="/track"
              className={
                location.includes("track")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }
              data-testid="link-track"
            >
              {" تتبع"}
            </Link>
          </nav>
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="تبديل الوضع"
              data-testid="button-toggle-theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              href="/cart"
              className="relative grid size-10 place-items-center rounded-full text-foreground hover:bg-muted transition-colors"
              aria-label="السلة"
              data-testid="link-cart"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 grid size-[18px] place-items-center rounded-full bg-secondary text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenu((value) => !value)}
              className="grid size-10 place-items-center rounded-full md:hidden"
              aria-label="القائمة"
              data-testid="button-mobile-menu"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="border-t bg-card px-5 py-4 md:hidden">
            <div className="container-shell grid gap-3 text-sm font-semibold">
              <Link
                onClick={() => setMobileMenu(false)}
                href="/"
                className="rounded-xl px-3 py-2 hover:bg-muted"
                data-testid="mobile-link-home"
              >
                الرئيسية
              </Link>
              <Link
                onClick={() => setMobileMenu(false)}
                href="/category/clothing"
                className="rounded-xl px-3 py-2 hover:bg-muted"
                data-testid="mobile-link-clothing"
              >
                الملابس{" "}
              </Link>
              <Link
                onClick={() => setMobileMenu(false)}
                href="/category/scales"
                className="rounded-xl px-3 py-2 hover:bg-muted"
                data-testid="mobile-link-scales"
              >
                الموازين{" "}
              </Link>
              <Link
                onClick={() => setMobileMenu(false)}
                href="/track"
                className="rounded-xl px-3 py-2 hover:bg-muted"
                data-testid="mobile-link-track"
              >
                {" "}
              </Link>
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t bg-card pb-20 md:pb-8">
        <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.2fr_.8fr_.8fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <LogoMark size={40} />
              <strong className="display">MEGY TEAC</strong>
            </div>
            <p className="max-w-sm text-sm leading-8 text-muted-foreground">
              أشياء تم اختيارها بعناية، وأدوات دقيقة تؤدي دورها من أول مرة. متجر محلي
              يعرف ما يحتاجه يومك.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold">تسوق وخدمة</h3>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <Link
                href="/category/clothing"
                className="hover:text-foreground"
                data-testid="footer-link-clothing"
              >
              ملابس  
              </Link>
              <Link
                href="/category/scales"
                className="hover:text-foreground"
                data-testid="footer-link-scales"
              >
               موازين  
              </Link>
              <Link
                href="/cart"
                className="hover:text-foreground"
                data-testid="footer-link-cart"
              >
                راجع السلة
              </Link>
              <Link
                href="/track"
                className="hover:text-foreground"
                data-testid="footer-link-track"
              >
                
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold">نحن هنا</h3>
            <p className="text-sm leading-8 text-muted-foreground">
              القاهرة، جمهورية مصر العربية
              <br />
              السبت — الخميس · 6 ص — 12 م
            </p>
          </div>
        </div>
        <div className="container-shell flex flex-wrap justify-between gap-3 border-t py-5 text-xs text-muted-foreground">
          <span>© 2027 MEGY TEAC</span>
          <span>الدقة في الاختيار، راحة في الوصول</span>
        </div>
      </footer>
      <a
        href="https://wa.me/201154059667?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%B9%D9%86%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%85%D9%86%D8%AA%D8%AC%20%D9%81%D9%8A%20%D9%85%D8%AA%D8%AC%D8%B1%20MEGY%20TEAC"
        target="_blank"
        rel="noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        className="fixed bottom-5 left-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:-translate-y-1"
        data-testid="link-whatsapp"
      >
        <MessageCircle size={24} />
      </a>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  const [liked, setLiked] = useState(false);
  const outOfStock = product.stock <= 0;
  return (
    <article
      className="group relative"
      data-testid={`card-product-${product.id}`}
    >
      <Link
        href={`/product/${product.id}`}
        className="block"
        data-testid={`link-product-${product.id}`}
      >
        <div className="relative aspect-[.9] overflow-hidden rounded-2xl bg-muted">
          <img
            src={product.image || fallbackImage(product.category)}
            alt={product.name}
            className={`size-full object-cover transition duration-500 group-hover:scale-[1.04] ${outOfStock ? "opacity-60 grayscale" : ""}`}
            data-testid={`img-product-${product.id}`}
          />
          {outOfStock ? (
            <span className="absolute right-3 top-3 rounded-full bg-destructive/90 px-3 py-1 text-[11px] font-bold text-destructive-foreground backdrop-blur">
              غير متوفر
            </span>
          ) : (
            product.badge && (
              <span className="absolute right-3 top-3 rounded-full bg-card/90 px-3 py-1 text-[11px] font-bold backdrop-blur">
                {product.badge}
              </span>
            )
          )}
          <button
            onClick={(event) => {
              event.preventDefault();
              setLiked((value) => !value);
            }}
            className={`absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 backdrop-blur transition ${liked ? "text-destructive" : "text-foreground"}`}
            aria-label="إضافة للمفضلة"
            data-testid={`button-favorite-${product.id}`}
          >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
          </button>
          {!outOfStock && (
            <button
              onClick={(event) => {
                event.preventDefault();
                onAdd(product);
              }}
              className="absolute bottom-3 left-3 right-3 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground opacity-100 transition duration-300 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
              data-testid={`button-quick-add-${product.id}`}
            >
              أضف للسلة
            </button>
          )}
        </div>
      </Link>
      <div className="pt-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>{product.categoryLabel}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Star size={12} fill="currentColor" className="text-secondary" />{" "}
            {product.rating}
          </span>
        </div>
        <Link
          href={`/product/${product.id}`}
          className="block min-h-[3rem] text-[15px] font-semibold leading-6 hover:text-primary"
          data-testid={`link-product-name-${product.id}`}
        >
          {product.name}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <strong className="whitespace-nowrap text-sm">
            {formatPrice(product.price)}
          </strong>
          {product.compareAtPrice && (
            <del className="whitespace-nowrap text-xs text-muted-foreground">
              {formatPrice(product.compareAtPrice)}
            </del>
          )}
        </div>
      </div>
    </article>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item}>
          <div className="skeleton aspect-[.9] rounded-2xl" />
          <div className="skeleton mt-4 h-3 w-2/5 rounded" />
          <div className="skeleton mt-3 h-4 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}

function HomePage({ cart }: { cart: ReturnType<typeof useCart> }) {
  const categoriesQuery = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });
  const productsQuery = useListProducts(
    { limit: 6, sort: "newest" },
    {
      query: {
        queryKey: getListProductsQueryKey({ limit: 6, sort: "newest" }),
      },
    },
  );
  const categories = categoriesQuery.data?.length
    ? categoriesQuery.data
    : fallbackCategories;
  const products = productsQuery.data?.length
    ? productsQuery.data
    : fallbackProducts;
  return (
    <div>
      <section className="container-shell pb-10 pt-8 md:pb-16 md:pt-12">
        <div className="texture relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground md:min-h-[480px] md:px-14 md:py-16">
          <div className="absolute -left-10 -top-20 size-64 rounded-full border-[28px] border-secondary/30" />
          <div className="absolute bottom-[-100px] right-[36%] size-64 rounded-full border-[1px] border-secondary/30" />
          <div className="relative z-10 max-w-xl animate-rise md:ml-auto md:max-w-[58%]">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-secondary">
              <Sparkles size={16} /> اعلي جوده واقل سعر
            </p>
            <h1 className="display max-w-[680px] text-5xl leading-[1.15] md:text-7xl">
              MEGY Fashion
              <br />
              <span className="text-secondary">رقم واحد في مصر.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-8 text-primary-foreground/75 md:text-base">
              {" "}
              لان التفاصيل هي التي تصنع الفارق,اخترنا لك الافضل دائما
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/category/clothing"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground transition hover:-translate-y-0.5"
                data-testid="hero-link-clothing"
              >
                اكتشف الملابس <ArrowLeft size={16} />
              </Link>
              <Link
                href="/category/scales"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-primary-foreground/30 px-5 py-3 text-sm font-bold transition hover:bg-primary-foreground/10"
                data-testid="hero-link-scales"
              >
                تصفح الموازين <ArrowLeft size={16} />
              </Link>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 hidden w-[37%] max-w-[390px] animate-drift md:block">
            <div className="texture relative aspect-[.88] overflow-hidden rounded-[1.5rem] border-8 border-primary-foreground/10 bg-secondary shadow-2xl">
              <div className="absolute -right-16 -top-16 size-64 rounded-full border-[28px] border-primary/15" />
              <div className="relative grid size-full place-items-center">
                <div className="rounded-[2rem] bg-primary/95 p-8 shadow-2xl">
                  <LogoMark size={150} />
                </div>
              </div>
              <div className="absolute bottom-4 right-4 left-4 rounded-xl bg-card/90 p-3 text-foreground backdrop-blur">
                <small className="text-[10px] text-muted-foreground">
                  تفاصيل صغيرة، فرق كبير
                </small>
                <p className="mt-1 text-sm font-bold">
                  شغل عالي معمول ب الظبط علي زوقك
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container-shell py-8 md:py-12">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[.16em] text-accent">
              {" "}
            </p>
            <h2 className="display text-3xl md:text-4xl">
              اختار الي عاوز تشتريه
            </h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">
                
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.slice(0, 2).map((category, index) => (
            <Link
              href={`/category/${category.slug}`}
              key={category.id}
              className={`group relative min-h-[280px] overflow-hidden rounded-2xl p-7 ${index === 0 ? "bg-secondary" : "bg-accent text-accent-foreground"}`}
              data-testid={`category-entry-${category.slug}`}
            >
              <img
                src={
                  index === 0
                    ? "/images/cloth.jpeg"
                    : "/images/th.jpg"
                }
                alt=""
                className="absolute inset-0 size-full object-cover opacity-25 mix-blend-multiply transition duration-500 group-hover:scale-105 group-hover:opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="mb-3 text-xs font-bold opacity-80">
                    {index === 0 ? " ملابس شيك" : "جوده  ودقه  "}
                  </p>
                  <h3 className="display text-3xl">
                    {index === 0 ? "ملابس" : "موازين "}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{category.productCount} اختيار متاح</span>
                  <span className="grid size-10 place-items-center rounded-full border border-current transition group-hover:-translate-x-1">
                    <ArrowLeft size={17} />
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-16 left-10 size-56 rounded-full border-[32px] border-current/10 transition duration-500 group-hover:scale-110" />
              <div className="absolute -right-12 -top-16 size-52 rounded-full border border-current/20" />
            </Link>
          ))}
        </div>
      </section>
      <section className="container-shell py-8 md:py-16">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[.16em] text-accent">
              الحجات الي اخترتها خلال الاسبوع
            </p>
            <h2 className="display text-3xl md:text-4xl">اخر اختيرات ليك</h2>
          </div>
          <Link
            href="/category/clothing"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
            data-testid="link-view-all-products"
          >
            عرض الكل <ArrowLeft size={15} />
          </Link>
        </div>
        {productsQuery.isLoading ? (
          <LoadingGrid />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={cart.add}
              />
            ))}
          </div>
        )}
      </section>
      <section className="container-shell py-8 md:py-16">
        <div className="rounded-[2rem] border bg-card p-6 md:p-10">
          <div className="grid gap-8 md:grid-cols-3">
            <Trust
              icon={<ShieldCheck />}
              title="بنختارها بعناية"
              text="كل حاجة عندنا ليها سبب، ووصفنا للمنتج واضح من غير مبالغة."
            />
            <Trust
              icon={<Truck />}
              title="عارف طلبك فين"
              text="تابع حالة طلبك بسهولة من لحظة التأكيد لحد ما يوصل لبابك."
            />
            <Trust
              icon={<CreditCard />}
              title="ادفع لما تستلم"
              text="اطلب براحتك، والدفع نقدي عند الاستلام   ."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Trust({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-accent">
        {icon}
      </div>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function CategoryPage({
  category,
  cart,
}: {
  category: "clothing" | "scales";
  cart: ReturnType<typeof useCart>;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">(
    "newest",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = useListProducts(
    { category, search: search || undefined, sort, limit: 50 },
    {
      query: {
        queryKey: getListProductsQueryKey({
          category,
          search: search || undefined,
          sort,
          limit: 50,
        }),
      },
    },
  );
  const fallback = fallbackProducts.filter(
    (p) => p.category === category && (!search || p.name.includes(search)),
  );
  const products = query.data?.length ? query.data : fallback;
  const title =
    category === "clothing" ? "ملابس ذات جوده عاليه" : "موازين ذات دقه عاليه";
  const intro =
    category === "clothing"
      ? "قطع مريحة وشكلها رايق، تتلبس بسهولة وتكمل يومك من غير تكلف."
      : "موازين ب احسن جوده ف مصر و اقل سعر كمان.";
  return (
    <div className="container-shell py-8 md:py-14">
      <div className="relative overflow-hidden rounded-[2rem] bg-muted px-6 py-9 md:px-12 md:py-12">
        <div className="relative z-10 max-w-lg">
          <p className="mb-3 text-xs font-bold tracking-[.18em] text-accent">
            {category === "clothing" ? "" : ""}
          </p>
          <h1 className="display text-4xl md:text-6xl">{title}</h1>
          <p className="mt-5 text-sm leading-8 text-muted-foreground md:text-base">
            {intro}
          </p>
        </div>
        <div className="absolute -left-10 -top-16 size-64 rounded-full border-[42px] border-secondary/40" />
      </div>
      <div className="mt-10 flex flex-col gap-5 border-b pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {products.length} نتائج
          </span>
          <button
            onClick={() => setFiltersOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold md:hidden"
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal size={15} /> الفلاتر
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث في المنتجات"
              className="h-11 w-full rounded-xl border bg-card pr-10 pl-4 text-sm outline-none transition focus:border-primary sm:w-64"
              data-testid="input-product-search"
            />
          </label>
          <div
            className={`${filtersOpen ? "flex" : "hidden"} items-center gap-2 md:flex`}
          >
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="h-11 rounded-xl border bg-card px-3 text-sm outline-none"
              data-testid="select-product-sort"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="price_asc">السعر: الأقل</option>
              <option value="price_desc">السعر: الأعلى</option>
            </select>
            <button
              onClick={() => {
                setSearch("");
                setSort("newest");
              }}
              className="h-11 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted"
              data-testid="button-reset-filters"
            >
              مسح
            </button>
          </div>
        </div>
      </div>
      <div className="mt-8">
        {query.isLoading ? (
          <LoadingGrid />
        ) : query.isError && products.length === 0 ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={cart.add}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="لم نجد ما يطابق بحثك"
            text="جرب كلمة أخرى أو أعد ضبط الفلاتر."
            onReset={() => setSearch("")}
          />
        )}
      </div>
    </div>
  );
}

function ProductPage({ cart }: { cart: ReturnType<typeof useCart> }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useGetProduct(id, {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(id) },
  });
  const product = query.data || fallbackProducts.find((item) => item.id === id);
  const [option, setOption] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (product) setOption(product.options?.[0] || "");
  }, [product?.id]);
  if (query.isLoading && !product)
    return (
      <div className="container-shell py-16">
        <div className="skeleton h-[500px] rounded-[2rem]" />
      </div>
    );
  if (!product)
    return (
      <div className="container-shell py-24">
        <EmptyState
          title="هذا المنتج غير متاح"
          text="ربما انتقل إلى مكان آخر، لكن لدينا الكثير من الخيارات الأخرى."
          onReset={() => window.history.back()}
        />
      </div>
    );
  const outOfStock = product.stock <= 0;
  return (
    <div className="container-shell py-8 md:py-14">
      <Link
        href={`/category/${product.category}`}
        className="mb-7 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        data-testid="link-back-category"
      >
        <ChevronRight size={16} /> العودة إلى {product.categoryLabel}
      </Link>
      <div className="grid gap-8 md:grid-cols-[1.05fr_.95fr] md:items-start md:gap-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-muted">
          <img
            src={product.image || fallbackImage(product.category)}
            alt={product.name}
            className={`aspect-[.93] w-full object-cover ${outOfStock ? "opacity-60 grayscale" : ""}`}
            data-testid={`img-product-detail-${product.id}`}
          />
          {outOfStock ? (
            <span className="absolute right-5 top-5 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">
              غير متوفر حالياً
            </span>
          ) : (
            product.badge && (
              <span className="absolute right-5 top-5 rounded-full bg-card px-3 py-1 text-xs font-bold">
                {product.badge}
              </span>
            )
          )}
        </div>
        <div className="pt-2">
          <div className="flex items-center justify-between gap-5">
            <p className="text-sm text-accent">{product.categoryLabel}</p>
            <span className="flex items-center gap-1 text-sm">
              <Star size={15} fill="currentColor" className="text-secondary" />{" "}
              {product.rating}{" "}
              <span className="text-muted-foreground">
                ({product.reviewCount})
              </span>
            </span>
          </div>
          <h1 className="display mt-4 text-4xl leading-tight md:text-5xl">
            {product.name}
          </h1>
          <div className="mt-5 flex items-center gap-3">
            <strong className="text-xl">{formatPrice(product.price)}</strong>
            {product.compareAtPrice && (
              <del className="text-sm text-muted-foreground">
                {formatPrice(product.compareAtPrice)}
              </del>
            )}
          </div>
          <p className="mt-6 text-sm leading-8 text-muted-foreground">
            {product.description}
          </p>
          <div className="my-7 border-y py-6">
            <p className="mb-3 text-sm font-bold">
              اختر {product.category === "clothing" ? "المقاس" : "الاختيار"}
            </p>
            <div className="flex flex-wrap gap-2">
              {(product.options?.length
                ? product.options
                : ["الاختيار القياسي"]
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => setOption(item)}
                  className={`rounded-xl border px-4 py-2 text-sm transition ${option === item ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}
                  data-testid={`button-option-${item}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-12 items-center rounded-xl border">
              <button
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={outOfStock}
                className="grid size-11 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                aria-label="تقليل الكمية"
                data-testid="button-decrease-quantity"
              >
                <Minus size={16} />
              </button>
              <span
                className="w-8 text-center text-sm font-bold"
                data-testid="text-product-quantity"
              >
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((value) => Math.min(product.stock, value + 1))
                }
                disabled={outOfStock}
                className="grid size-11 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                aria-label="زيادة الكمية"
                data-testid="button-increase-quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => {
                for (let i = 0; i < quantity; i++)
                  cart.add(product, option || null);
                setAdded(true);
                setTimeout(() => setAdded(false), 1800);
              }}
              disabled={outOfStock}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              data-testid="button-add-to-cart"
            >
              {outOfStock ? (
                "غير متوفر حالياً"
              ) : added ? (
                <>
                  <Check size={18} /> تمت الإضافة
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> أضف للسلة
                </>
              )}
            </button>
          </div>
          <div className="mt-7 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-accent" /> جودة مجرّبة
            </span>
            <span className="flex items-center gap-2">
              <Truck size={16} className="text-accent" /> شحن موثوق
            </span>
            <span className="flex items-center gap-2">
              <CreditCard size={16} className="text-accent" /> دفع عند الاستلام
            </span>
          </div>
        </div>
      </div>
      <section className="mt-14 border-t pt-10">
        <h2 className="display mb-6 text-2xl">تفاصيل تعرفها قبل الشراء</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {product.specs?.map((spec) => (
            <div
              key={spec.label}
              className="flex justify-between rounded-xl bg-muted px-4 py-3 text-sm"
            >
              <span className="text-muted-foreground">{spec.label}</span>
              <strong>{spec.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CartPage({ cart }: { cart: ReturnType<typeof useCart> }) {
  if (!cart.cart.length)
    return (
      <div className="container-shell py-20 md:py-28">
        <EmptyState
          title="السلة فاضية لسه"
          text="اختار حاجة عجبتك، وسيب علينا باقي المشوار."
          onReset={() => window.history.back()}
          action={
            <Link
              href="/"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              data-testid="link-empty-cart-home"
            >
              لف في المتجر
            </Link>
          }
        />
      </div>
    );
  return (
    <div className="container-shell py-8 md:py-14">
      <p className="mb-3 text-xs font-bold tracking-[.16em] text-accent">
        مراجعة طلبك
      </p>
      <h1 className="display text-4xl md:text-5xl">السلة بتاعتك</h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y rounded-2xl border bg-card px-5">
          {cart.cart.map((line, index) => (
            <div
              className="flex gap-4 py-5"
              key={`${line.product.id}-${line.option}-${index}`}
              data-testid={`cart-line-${line.product.id}`}
            >
              <img
                src={line.product.image}
                alt={line.product.name}
                className="size-24 shrink-0 rounded-xl object-cover"
              />
              <div className="cart-line flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-bold leading-6">
                      {line.product.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.option || "اختيار قياسي"}
                    </p>
                  </div>
                  <button
                    onClick={() => cart.remove(index)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="حذف المنتج"
                    data-testid={`button-remove-cart-${line.product.id}`}
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-sm">
                    {formatPrice(line.product.price * line.quantity)}
                  </strong>
                  <div className="flex h-9 items-center rounded-lg border">
                    <button
                      onClick={() => cart.change(index, -1)}
                      className="grid size-9 place-items-center"
                      data-testid={`button-cart-minus-${line.product.id}`}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center text-xs">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() => cart.change(index, 1)}
                      className="grid size-9 place-items-center"
                      data-testid={`button-cart-plus-${line.product.id}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-2xl bg-primary p-6 text-primary-foreground">
          <h2 className="text-lg font-bold">ملخص طلبك</h2>
          <div className="mt-6 grid gap-4 border-b border-primary-foreground/15 pb-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-primary-foreground/70">المجموع</span>
              <span className="shrink-0">{formatPrice(cart.total)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-primary-foreground/70">التوصيل</span>
              <span className="shrink-0 text-secondary">يتحدد وقت التأكيد</span>
            </div>
          </div>
          <div className="mt-5 flex justify-between gap-4 text-lg font-bold">
            <span>الإجمالي</span>
            <span className="shrink-0">{formatPrice(cart.total)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-7 flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground transition hover:-translate-y-0.5"
            data-testid="link-checkout"
          >
            كمّل بيانات التوصيل <ArrowLeft size={17} />
          </Link>
          <p className="mt-4 text-center text-[11px] text-primary-foreground/60">
            الدفع نقدي عند الاستلام · من غير بطاقة
          </p>
        </aside>
      </div>
    </div>
  );
}

function CheckoutPage({ cart }: { cart: ReturnType<typeof useCart> }) {
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    city: "",
  });
  const [order, setOrder] = useState<{
    orderNumber: string;
    total: number;
  } | null>(null);
  const [fallbackError, setFallbackError] = useState("");
  const update =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      form.customerName.trim().length < 2 ||
      form.phone.trim().length < 8 ||
      form.address.trim().length < 5 ||
      form.city.trim().length < 2
    ) {
      setFallbackError("أكمل البيانات المطلوبة حتى نصل إليك بسهولة.");
      return;
    }
    const payload: OrderInput = {
      ...form,
      items: cart.cart.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
        option: line.option,
      })),
    };
    setFallbackError("");
    createOrder.mutate(
      { data: payload },
      {
        onSuccess: (result) => {
          cart.clear();
          setOrder({ orderNumber: result.orderNumber, total: result.total });
          
        },
        onError: () =>
          setFallbackError(
            "تعذر إرسال الطلب الآن. تحقق من الاتصال وحاول مرة أخرى.",
          ),
      },
    );
  };
  if (!cart.cart.length && !order && !createOrder.isPending && !createOrder.isPending)
    return (
      <div className="container-shell py-20">
        <EmptyState
          title="لا توجد منتجات للدفع"
          text="أضف شيئاً إلى السلة ثم عد لإتمام الطلب."
          action={
            <Link
              href="/"
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              data-testid="link-checkout-home"
            >
              العودة للمتجر
            </Link>
          }
        />
      </div>
    );
  if (order)
    return (
      <div className="container-shell py-20 md:py-28">
        <div className="mx-auto max-w-xl rounded-[2rem] border bg-card p-8 text-center md:p-14">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
            <CircleCheck size={30} />
          </div>
          <p className="mt-6 text-sm font-semibold text-accent">
            الطلب اتسجل بنجاح
          </p>
          <h1 className="display mt-3 text-4xl">تمام يا باشا، وصلنا طلبك</h1>
          <p className="mt-5 text-sm leading-8 text-muted-foreground">
            رقم طلبك{" "}
            <strong className="text-foreground">{order.orderNumber}</strong>.
            هنكلمك قريب عشان نأكد معاك ميعاد التوصيل.
          </p>
          <div className="my-7 rounded-xl bg-muted px-4 py-4 text-sm">
            الإجمالي عند الاستلام: <strong>{formatPrice(order.total)}</strong>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/track?order=${order.orderNumber}`}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground"
              data-testid="link-success-track"
            >
              تابع طلبك <ArrowLeft size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold"
              data-testid="link-success-home"
            >
              كمّل تسوق <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  return (
    <div className="container-shell py-8 md:py-14">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="mb-3 text-xs font-bold tracking-[.16em] text-accent">
            آخر خطوة
          </p>
          <h1 className="display text-4xl md:text-5xl">نوصّلهالك فين؟</h1>
        </div>
        <Link
          href="/cart"
          className="text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-back-cart"
        >
          راجع السلة
        </Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <form
          onSubmit={submit}
          className="rounded-2xl border bg-card p-6 md:p-8"
        >
          <h2 className="text-lg font-bold">بيانات التوصيل</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            الدفع نقدي عند الاستلام، وإحنا هنتواصل معاك للتأكيد.
          </p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field
              label="اسمك بالكامل"
              value={form.customerName}
              onChange={update("customerName")}
              placeholder="مثال: سارة محمد"
              testId="input-customer-name"
            />
            <Field
              label="رقم الموبايل"
              value={form.phone}
              onChange={update("phone")}
              placeholder="01xxxxxxxxx"
              type="tel"
              testId="input-customer-phone"
            />
            <Field
              label="المحافظة / المدينة"
              value={form.city}
              onChange={update("city")}
              placeholder="القاهرة"
              testId="input-customer-city"
            />
            <Field
              label="العنوان بالتفصيل"
              value={form.address}
              onChange={update("address")}
              placeholder="الحي، الشارع، رقم البيت"
              testId="input-customer-address"
              wide
            />
          </div>
          {fallbackError && (
            <div
              className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
              data-testid="status-checkout-error"
            >
              <CircleAlert size={17} /> {fallbackError}
            </div>
          )}
          <button
            disabled={createOrder.isPending}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-60"
            data-testid="button-submit-order"
          >
            {createOrder.isPending ? (
              "بنسجل طلبك..."
            ) : (
              <>
                أكد الطلب والدفع عند الاستلام <ArrowLeft size={17} />
              </>
            )}
          </button>
        </form>
        <aside className="h-fit rounded-2xl bg-muted p-6">
          <h2 className="font-bold">ملخص طلبك</h2>
          <div className="mt-5 grid gap-4">
            {cart.cart.map((line) => (
              <div
                className="flex items-start justify-between gap-4 text-sm"
                key={`${line.product.id}-${line.option}`}
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold leading-6">
                    {line.product.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {line.option || "اختيار قياسي"} · الكمية {line.quantity}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {formatPrice(line.product.price * line.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between gap-4 border-t pt-5 font-bold">
            <span>الإجمالي</span>
            <span className="shrink-0">{formatPrice(cart.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TrackOrderPage() {
  const initialOrder =
    new URLSearchParams(window.location.search).get("order") || "";
  const [input, setInput] = useState(initialOrder);
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const query = useGetOrderTracking(orderNumber, {
    query: {
      enabled: orderNumber.length >= 3,
      queryKey: getGetOrderTrackingQueryKey(orderNumber),
      retry: false,
    },
  });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setOrderNumber(input.trim().toUpperCase());
  };
  const labels: Record<string, string> = {
    new: "استلمنا الطلب",
    preparing: "بنجهز طلبك",
    shipped: "الطلب في الطريق",
    delivered: "وصل بالسلامة",
    cancelled: "الطلب اتلغى",
  };
  const steps = ["new", "preparing", "shipped", "delivered"];
  const currentStep =
    query.data?.status === "cancelled"
      ? -1
      : steps.indexOf(query.data?.status || "new");

  return (
    <div className="container-shell py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-bold tracking-[.16em] text-accent">
          خدمة بعد الطلب
        </p>
        <h1 className="display text-4xl md:text-5xl">اطمّن على طلبك</h1>
        <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
          اكتب رقم الطلب اللي ظهر لك بعد التأكيد، وهتعرف إحنا وصلنا لفين.
        </p>
        <form
          onSubmit={submit}
          className="mt-8 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="مثال: MT-04464659"
            className="h-12 min-w-0 flex-1 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary"
            aria-label="رقم الطلب"
            data-testid="input-track-order"
          />
          <button
            disabled={input.trim().length < 3 || query.isFetching}
            className="h-12 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50"
            data-testid="button-track-order"
          >
            {query.isFetching ? "بندور عليه..." : "اعرض حالة الطلب"}
          </button>
        </form>
        {query.isError && orderNumber && (
          <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            مش لاقيين طلب بالرقم ده. راجع الرقم وجرب تاني.
          </p>
        )}
        {query.data && (
          <div className="mt-8 rounded-[2rem] border bg-card p-6 md:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">رقم الطلب</p>
                <h2 className="mt-1 text-2xl font-bold tracking-wide">
                  {query.data.orderNumber}
                </h2>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-bold ${query.data.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}
              >
                {labels[query.data.status]}
              </span>
            </div>
            {currentStep >= 0 ? (
              <div className="mt-10 grid grid-cols-4 gap-2">
                {steps.map((step, index) => (
                  <div key={step} className="text-center">
                    <div
                      className={`mx-auto grid size-10 place-items-center rounded-full text-sm font-bold ${index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {index + 1}
                    </div>
                    <p className="mt-2 text-xs font-semibold">
                      {["اتأكدنا", "بنجهزه", "اتشحن", "اتسلّم"][index]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                الطلب ده اتلغى. لو محتاج مساعدة كلمنا على واتساب.
              </div>
            )}
            <div className="mt-8 grid gap-3 border-t pt-6 text-sm sm:grid-cols-2">
              <p className="text-muted-foreground">
                المنتجات{" "}
                <span className="mt-1 block font-semibold text-foreground">
                  {query.data.items
                    .map((item) => `${item.productName} × ${item.quantity}`)
                    .join("، ")}
                </span>
              </p>
              <p className="text-muted-foreground">
                الإجمالي عند الاستلام{" "}
                <span className="mt-1 block font-semibold text-foreground">
                  {formatPrice(query.data.total)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  testId,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  testId: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        required
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
        data-testid={testId}
      />
    </label>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
      <CircleAlert className="mx-auto text-destructive" size={28} />
      <h2 className="mt-4 font-bold">حدث عذر تقني بسيط</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        تعذر تحميل البيانات من المتجر.
      </p>
      <button
        onClick={onRetry}
        className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        data-testid="button-retry"
      >
        حاول مرة أخرى
      </button>
    </div>
  );
}
function EmptyState({
  title,
  text,
  onReset,
  action,
}: {
  title: string;
  text: string;
  onReset?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted text-accent">
        <PanelRight size={28} />
      </div>
      <h2 className="mt-6 text-xl font-bold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
      {action || (
        <button
          onClick={onReset}
          className="mt-6 rounded-xl border px-5 py-3 text-sm font-bold hover:bg-muted"
          data-testid="button-empty-reset"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-shell py-28 text-center">
      <p className="display text-8xl text-secondary">404</p>
      <h1 className="mt-5 text-2xl font-bold">خطا ف التحميل</h1>
      <Link
        href="/"
        className="mt-7 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
        data-testid="link-not-found-home"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}

function RouterContent({ cart }: { cart: ReturnType<typeof useCart> }) {
  return (
    <Switch>
      <Route path="/" component={() => <HomePage cart={cart} />} />
      <Route
        path="/category/clothing"
        component={() => <CategoryPage category="clothing" cart={cart} />}
      />
      <Route
        path="/category/scales"
        component={() => <CategoryPage category="scales" cart={cart} />}
      />
      <Route
        path="/product/:id"
        component={() => <ProductPage cart={cart} />}
      />
      <Route path="/cart" component={() => <CartPage cart={cart} />} />
      <Route path="/checkout" component={() => <CheckoutPage cart={cart} />} />
      <Route path="/track" component={TrackOrderPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const cart = useCart();
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Shell cartCount={cart.count}>
          <RouterContent cart={cart} />
        </Shell>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
