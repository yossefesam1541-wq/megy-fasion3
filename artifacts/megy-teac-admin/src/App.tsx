import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  getListAdminOrdersQueryKey,
  getListAdminProductsQueryKey,
  getGetAdminOverviewQueryKey,
  getGetAdminSessionQueryKey,
  getListProductsQueryKey,
  useAdminLogin,
  useAdminLogout,
  useCreateAdminProduct,
  useDeleteAdminProduct,
  useGetAdminOverview,
  useGetAdminSession,
  useListAdminOrders,
  useListAdminProducts,
  useUpdateAdminOrderStatus,
} from '@workspace/api-client-react';
import type { AdminOrder, AdminOverview, ProductInput } from '@workspace/api-client-react';
import {
  ArrowUpRight, BarChart3, ChevronDown, Clock3, LogOut, PackageCheck, Plus, ShoppingBag, Trash2, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { setBaseUrl } from "@workspace/api-client-react";
import './index.css';

const queryClient = new QueryClient();
setBaseUrl("https://megy-fasion3-api-server.vercel.app");

function formatPrice(value: number) { return `${value.toLocaleString('ar-EG')} ج.م`; }

function LogoMark({ size = 44 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
    <defs>
      <linearGradient id="logoBadge" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#31408A" />
        <stop offset="1" stopColor="#242F63" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="24" fill="url(#logoBadge)" />
    <line x1="24" y1="45" x2="76" y2="45" stroke="#D79D37" strokeWidth="3.6" strokeLinecap="round" />
    <circle cx="24" cy="45" r="2.2" fill="#D79D37" />
    <circle cx="76" cy="45" r="2.2" fill="#D79D37" />
    <path d="M17 45 Q24 58 31 45" fill="none" stroke="#D79D37" strokeWidth="3" strokeLinecap="round" />
    <path d="M69 45 Q76 58 83 45" fill="none" stroke="#D79D37" strokeWidth="3" strokeLinecap="round" />
    <path d="M29 73 L29 38 L50 59 L71 38 L71 73" fill="none" stroke="#F7F2E8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 45 L50 59" stroke="#F7F2E8" strokeWidth="6" strokeLinecap="round" />
  </svg>;
}

function AdminLoginPage() {
  const login = useAdminLogin();
  const queryClientLocal = useQueryClient();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    login.mutate({ data: { username, password } }, {
      onSuccess: () => {
        void queryClientLocal.invalidateQueries({ queryKey: getGetAdminSessionQueryKey() });
      },
      onError: () => setError('اسم المستخدم أو كلمة المرور غير صحيحة.'),
    });
  };

  return <div dir="rtl" className="flex min-h-[100dvh] items-center justify-center px-4 py-14">
    <div className="w-full max-w-md rounded-[2rem] border bg-card p-7 shadow-sm md:p-10">
      <div className="mx-auto"><LogoMark size={56} /></div>
      <div className="mt-6 text-center"><p className="text-xs font-bold tracking-[.18em] text-accent">MEGY TEAC / PRIVATE</p><h1 className="display mt-3 text-3xl">دخول لوحة الإدارة</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">هذه الصفحة خاصة بإدارة المنتجات والطلبات.</p></div>
      <form onSubmit={submit} className="mt-8 grid gap-5">
        <label><span className="mb-2 block text-sm font-semibold">اسم المستخدم</span><input required value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary" /></label>
        <label><span className="mb-2 block text-sm font-semibold">كلمة المرور</span><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary" /></label>
        {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={login.isPending} className="h-12 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">{login.isPending ? 'جارٍ التحقق...' : 'دخول آمن'}</button>
      </form>
    </div>
  </div>;
}

function AdminGate() {
  const session = useGetAdminSession({ query: { queryKey: getGetAdminSessionQueryKey(), retry: false } });
  if (session.isLoading) return <div dir="rtl" className="flex min-h-[100dvh] items-center justify-center px-4 py-24"><div className="skeleton h-80 w-full max-w-md rounded-[2rem]" /></div>;
  if (!session.data?.authenticated) return <AdminLoginPage />;
  return <AdminPage username={session.data.username} />;
}

function AdminField({ label, value, onChange, placeholder, type = 'text', multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; multiline?: boolean }) {
  return <label><span className="mb-2 block text-sm font-semibold">{label}</span>{multiline ? <textarea required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-24 w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary" /> : <input required={label !== 'السعر القديم (اختياري)'} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary" />}</label>;
}

function orderStatusLabel(status: AdminOrder['status']) {
  return ({ new: 'جديد', preparing: 'قيد التجهيز', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' } as Record<AdminOrder['status'], string>)[status];
}

function Metric({ label, value, icon, tint }: { label: string; value: string; icon: React.ReactNode; tint: string }) { return <div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><span className={`grid size-10 place-items-center rounded-xl ${tint}`}>{icon}</span><ArrowUpRight size={15} className="text-muted-foreground" /></div><p className="mt-6 text-xs text-muted-foreground">{label}</p><strong className="mt-1 block text-2xl">{value}</strong></div>; }

function AdminPage({ username }: { username: string }) {
  const queryClientLocal = useQueryClient();
  const overviewQuery = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey() } });
  const productsQuery = useListAdminProducts({ query: { queryKey: getListAdminProductsQueryKey() } });
  const ordersQuery = useListAdminOrders({ query: { queryKey: getListAdminOrdersQueryKey() } });
  const createProduct = useCreateAdminProduct();
  const deleteProduct = useDeleteAdminProduct();
  const updateOrderStatus = useUpdateAdminOrderStatus();
  const [form, setForm] = useState({
    name: '',
    category: 'clothing' as ProductInput['category'],
    price: '',
    compareAtPrice: '',
    stock: '',
    image: '/images/charcoal-shirt.jpg',
    badge: '',
    description: '',
    options: '',
  });
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const fallbackData: AdminOverview = { ordersToday: 0, revenueToday: 0, activeProducts: 0, lowStock: 0, pendingOrders: 0, sales: [], topProducts: [] };
  const data = overviewQuery.data || fallbackData;
  const products = productsQuery.data || [];
  const orders = ordersQuery.data || [];
  const max = Math.max(...data.sales.map((item) => item.value), 1);

  const submitProduct = (event: React.FormEvent) => {
    event.preventDefault();
    setFormMessage('');
    setFormError('');
    const payload: ProductInput = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stock: Number(form.stock),
      image: form.image.trim(),
      badge: form.badge.trim() || null,
      description: form.description.trim(),
      options: form.options.split(',').map((option) => option.trim()).filter(Boolean),
      specs: [],
    };
    if (!payload.name || !payload.description || !payload.image || !Number.isFinite(payload.price) || !Number.isFinite(payload.stock)) {
      setFormError('اكتب اسم المنتج والوصف والسعر والمخزون والصورة بشكل صحيح.');
      return;
    }
    createProduct.mutate({ data: payload }, {
      onSuccess: () => {
        setForm({
          name: '', category: 'clothing', price: '', compareAtPrice: '', stock: '',
          image: '/images/charcoal-shirt.jpg', badge: '', description: '', options: '',
        });
        setFormMessage('تمت إضافة المنتج وظهر الآن في المتجر.');
        void queryClientLocal.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
        void queryClientLocal.invalidateQueries({ queryKey: getListProductsQueryKey({ limit: 6, sort: 'newest' }) });
        void queryClientLocal.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      },
      onError: () => setFormError('تعذر حفظ المنتج. تأكد من البيانات واتصال قاعدة البيانات.'),
    });
  };

  const changeStatus = (order: AdminOrder, status: AdminOrder['status']) => {
    updateOrderStatus.mutate({ id: order.id, data: { status } }, {
      onSuccess: () => {
        void queryClientLocal.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
        void queryClientLocal.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      },
    });
  };
  const removeProduct = (id: number, name: string) => {
    if (!window.confirm(`حذف "${name}" من المتجر؟`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        void queryClientLocal.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
        void queryClientLocal.invalidateQueries({ queryKey: getListProductsQueryKey({ limit: 6, sort: 'newest' }) });
        void queryClientLocal.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      },
    });
  };
  const logout = useAdminLogout();
  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        void queryClientLocal.clear();
        window.location.reload();
      },
    });
  };

  return <div dir="rtl" className="min-h-[100dvh]">
    <header className="border-b bg-card"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-5"><div className="flex items-center gap-3"><LogoMark size={40} /><div><strong className="display block text-sm leading-none">MEGY TEAC</strong><small className="mt-1 block text-[10px] tracking-[.22em] text-muted-foreground">ADMIN</small></div></div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent"><Zap size={14} /> مرحبًا {username}</span><button onClick={signOut} disabled={logout.isPending} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold hover:bg-muted"><LogOut size={14} /> خروج</button></div></div></header>

    <div className="mx-auto max-w-6xl px-5 py-8 md:py-14">
    <div><h1 className="display text-4xl md:text-5xl">لوحة إدارة المتجر</h1><p className="mt-3 text-sm text-muted-foreground">أضف البضاعة، تابع المخزون، واستلم بيانات العملاء والطلبات من مكان واحد.</p></div>

    {overviewQuery.isLoading ? <div className="mt-10 grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((i) => <div className="skeleton h-32 rounded-2xl" key={i} />)}</div> : <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="طلبات اليوم" value={data.ordersToday.toLocaleString('ar-EG')} icon={<PackageCheck />} tint="bg-secondary" />
      <Metric label="إيرادات اليوم" value={formatPrice(data.revenueToday)} icon={<BarChart3 />} tint="bg-accent text-accent-foreground" />
      <Metric label="منتجات نشطة" value={data.activeProducts.toLocaleString('ar-EG')} icon={<ShoppingBag />} tint="bg-muted" />
      <Metric label="طلبات معلقة" value={data.pendingOrders.toLocaleString('ar-EG')} icon={<Clock3 />} tint="bg-primary text-primary-foreground" />
    </div>}

    <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-2xl border bg-card p-5 md:p-7">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">إضافة منتج جديد</h2><p className="mt-1 text-xs text-muted-foreground">سيظهر المنتج مباشرة في أقسام المتجر.</p></div><span className="grid size-10 place-items-center rounded-xl bg-secondary"><Plus size={19} /></span></div>
        <form onSubmit={submitProduct} className="mt-6 grid gap-4">
          <AdminField label="اسم المنتج" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="مثال: قميص كتان جديد" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-semibold">القسم</span><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ProductInput['category'] }))} className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"><option value="clothing">الملابس</option><option value="scales">الموازين</option></select></label>
            <AdminField label="المخزون" type="number" value={form.stock} onChange={(value) => setForm((current) => ({ ...current, stock: value }))} placeholder="0" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><AdminField label="السعر (ج.م)" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} placeholder="0" /><AdminField label="السعر القديم (اختياري)" type="number" value={form.compareAtPrice} onChange={(value) => setForm((current) => ({ ...current, compareAtPrice: value }))} placeholder="0" /></div>
          <AdminField label="رابط الصورة" value={form.image} onChange={(value) => setForm((current) => ({ ...current, image: value }))} placeholder="/images/product.jpg" />
          <AdminField label="الوصف" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} placeholder="وصف واضح للمنتج..." multiline />
          <AdminField label="الاختيارات (افصل بينها بفاصلة)" value={form.options} onChange={(value) => setForm((current) => ({ ...current, options: value }))} placeholder="S, M, L, XL" />
          {formError && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{formError}</p>}
          {formMessage && <p className="rounded-xl bg-accent/10 px-3 py-2 text-xs text-accent">{formMessage}</p>}
          <button type="submit" disabled={createProduct.isPending} className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">{createProduct.isPending ? 'جارٍ الحفظ...' : <><Plus size={16} /> حفظ المنتج</>}</button>
        </form>
      </section>

      <section className="rounded-2xl border bg-card p-5 md:p-7">
        <div className="flex items-center justify-between gap-4"><div><h2 className="font-bold">المنتجات الموجودة</h2><p className="mt-1 text-xs text-muted-foreground">{products.length} منتج محفوظ في قاعدة البيانات</p></div></div>
       {productsQuery.isLoading ? <div className="mt-6 grid gap-3">{[1, 2, 3].map((i) => <div className="skeleton h-16 rounded-xl" key={i} />)}</div> : products.length ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-right text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="pb-3 font-semibold">المنتج</th><th className="pb-3 font-semibold">القسم</th><th className="pb-3 font-semibold">السعر</th><th className="pb-3 font-semibold">المخزون</th><th className="pb-3 text-left font-semibold">إجراء</th></tr></thead><tbody>{products.map((product) => <tr className="border-b last:border-0" key={product.id}><td className="py-4"><div className="flex items-center gap-3"><img src={product.image} alt="" className="size-11 rounded-lg object-cover" /><span className="font-semibold">{product.name}</span></div></td><td className="py-4 text-muted-foreground">{product.categoryLabel}</td><td className="py-4 font-semibold whitespace-nowrap">{formatPrice(product.price)}</td><td className={`py-4 font-semibold ${product.stock <= 8 ? 'text-destructive' : ''}`}>{product.stock}</td><td className="py-4 text-left"><button type="button" onClick={() => removeProduct(product.id, product.name)} disabled={deleteProduct.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50" data-testid={`button-delete-product-${product.id}`}><Trash2 size={14} /> حذف</button></td></tr>)}</tbody></table></div> : <p className="mt-8 rounded-xl bg-muted p-5 text-center text-sm text-muted-foreground">لا توجد منتجات في قاعدة البيانات بعد.</p>}
      </section>
    </div>

    <section className="mt-6 rounded-2xl border bg-card p-5 md:p-7">
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-bold">طلبات العملاء</h2><p className="mt-1 text-xs text-muted-foreground">كل طلب جديد من المتجر يظهر هنا مع بيانات التوصيل.</p></div><span className="grid size-9 place-items-center rounded-full bg-secondary"><PackageCheck size={17} /></span></div>
      {ordersQuery.isLoading ? <div className="mt-6 grid gap-3">{[1, 2].map((i) => <div className="skeleton h-24 rounded-xl" key={i} />)}</div> : orders.length ? <div className="mt-6 grid gap-3">{orders.map((order) => <div className="rounded-xl bg-muted p-4" key={order.id}><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{order.orderNumber}</strong><span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold">{orderStatusLabel(order.status)}</span></div><p className="mt-2 text-sm font-semibold">{order.customerName} · <a href={`tel:${order.phone}`} className="text-primary hover:underline">{order.phone}</a></p><p className="mt-1 text-xs text-muted-foreground">{order.city} — {order.address}</p><p className="mt-2 text-xs text-muted-foreground">{order.items.map((item) => `${item.productName} × ${item.quantity}${item.option ? ` (${item.option})` : ''}`).join('، ')}</p></div><div className="flex items-center justify-between gap-4 md:flex-col md:items-end"><strong>{formatPrice(order.total)}</strong><select value={order.status} onChange={(event) => changeStatus(order, event.target.value as AdminOrder['status'])} disabled={updateOrderStatus.isPending} className="h-9 rounded-lg border bg-card px-2 text-xs outline-none focus:border-primary"><option value="new">جديد</option><option value="preparing">قيد التجهيز</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></select></div></div></div>)}</div> : <p className="mt-8 rounded-xl bg-muted p-5 text-center text-sm text-muted-foreground">لا توجد طلبات مسجلة حتى الآن.</p>}
    </section>

    {!overviewQuery.isLoading && <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-2xl border bg-card p-5 md:p-7"><div className="flex items-center justify-between"><div><h2 className="font-bold">المبيعات خلال الأسبوع</h2><p className="mt-1 text-xs text-muted-foreground">قيمة الطلبات بالجنيه المصري</p></div><span className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold">هذا الأسبوع <ChevronDown size={13} className="mr-1 inline" /></span></div><div className="mt-8 flex h-56 items-end gap-3 border-b border-dashed pb-0 sm:gap-6">{data.sales.map((point) => <div className="flex h-full flex-1 flex-col justify-end gap-2" key={point.label}><div className="group relative flex-1"><div className="absolute inset-x-0 bottom-0 rounded-t-xl bg-secondary transition group-hover:bg-primary" style={{ height: `${Math.max(9, point.value / max * 100)}%` }}><span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] opacity-0 transition group-hover:opacity-100">{point.value.toLocaleString('ar-EG')}</span></div></div><span className="text-center text-[11px] text-muted-foreground">{point.label}</span></div>)}</div></section><section className="rounded-2xl border bg-card p-5 md:p-7"><div className="flex items-center justify-between"><h2 className="font-bold">الأكثر مبيعاً</h2><span className="text-xs text-muted-foreground">من الطلبات الفعلية</span></div><div className="mt-6 grid gap-5">{data.topProducts.length ? data.topProducts.map((item, index) => <div className="flex items-center gap-3" key={item.name}><span className="grid size-8 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">0{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.sold} مبيعات</p></div><strong className="text-xs">{formatPrice(item.revenue)}</strong></div>) : <p className="text-sm text-muted-foreground">ستظهر الإحصائيات بعد تسجيل الطلبات.</p>}</div></section></div>}
    </div>
  </div>;
}

function App() {
  return <QueryClientProvider client={queryClient}><AdminGate /></QueryClientProvider>;
}

export default App;
