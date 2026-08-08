# Medy Tech

متجر عربي متجاوب يجمع الملابس المختارة والموازين الدقيقة، مع سلة مشتريات ودفع عند الاستلام ولوحة متابعة للمتجر.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/medy-tech` — واجهة المتجر RTL، الصفحات العامة، السلة، الدفع عند الاستلام، ولوحة الإدارة.
- `artifacts/api-server` — مسارات المنتجات والأقسام والطلبات وملخص لوحة الإدارة.
- `lib/api-spec/openapi.yaml` — مصدر عقود API.
- `lib/db/src/schema/store.ts` — جداول المنتجات والطلبات.
- `artifacts/medy-tech/public/images` — صور المنتجات الافتتاحية.

## Architecture decisions

- واجهة المتجر تستخدم RTL وواجهة عربية أولًا، مع دعم تبديل الوضع الفاتح/الداكن.
- السلة تحفظ محليًا للزائر، بينما إرسال الطلب يتم عبر API حقيقي مع الدفع عند الاستلام فقط.
- يتم استخدام بيانات API عند توفرها مع بيانات احتياطية لعدم كسر تجربة التصفح أثناء تعطل الخادم.
- كتالوج الملابس والموازين موحّد في جدول منتجات واحد مع مواصفات وخيارات مرنة لكل قسم.

## Product

- الصفحة الرئيسية تعرض القسمين والمنتجات المختارة ومزايا الثقة.
- صفحات الأقسام تدعم البحث والفرز، وصفحة المنتج تدعم الخيارات والكمية.
- السلة وإتمام الطلب تدعمان بيانات التوصيل وتسجيل طلب COD وإظهار رقم الطلب.
- لوحة الإدارة تعرض الطلبات والإيرادات والمخزون والتنبيهات والأكثر مبيعًا.
- زر واتساب ثابت للتواصل المباشر مع المتجر.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- بعد تعديل `lib/api-spec/openapi.yaml` يجب تشغيل codegen قبل فحص الحزم أو استخدام hooks جديدة.
- يجب تشغيل الخادم والواجهة عبر الـ workflows لأن `PORT` و`BASE_PATH` يحقنان تلقائيًا.
- صور المنتجات العامة تستخدم مسارات `/images/...` وتخدمها واجهة Vite من `public`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
