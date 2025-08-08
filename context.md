# GrupoIP3 - Sistema Contable Multi-tenant

## 📋 Información General del Proyecto

### **Cliente Principal:** GrupoIP3
### **Desarrollador:** Sebastian Gonzalez
### **Valor Primera Empresa (Fukubar):** $1.200.000 COP
### **Valor Empresas Adicionales:** $300.000 COP c/u
### **Duración Fukubar:** 2-3 semanas
### **Duración Empresas Adicionales:** 1 día c/u
### **Fecha Inicio:** Agosto 6, 2025

## 👥 **Sistema de Usuarios Multi-tenant**

### **Flexibilidad de Emails:**
- **Emails personales permitidos:** Gmail, Outlook, Yahoo, etc.
- **Emails corporativos opcionales:** admin@fukubar.com, contador@empresa.com
- **Mismo email en múltiples empresas:** Consultores/contadores externos
- **Control de acceso por BD:** No por dominio de email

### **Ejemplos de Usuarios:**

#### **Fukubar (fukubar.grupoip3.com):**
```sql
juan.perez@gmail.com → ADMIN → Solo accede a Fukubar
maria.rodriguez@hotmail.com → VIEWER → Solo accede a Fukubar
contador@fukubar.com → ACCOUNTANT → Solo accede a Fukubar
```

#### **GrupoPance (grupopance.grupoip3.com):**
```sql
carlos.lopez@gmail.com → MANAGER → Solo accede a GrupoPance
ana.martinez@yahoo.com → VIEWER → Solo accede a GrupoPance
```

#### **Consultor Multi-empresa:**
```sql
consultor@gmail.com → ACCOUNTANT → fukubar.grupoip3.com
consultor@gmail.com → ADMIN → grupopance.grupoip3.com
(Mismo email, diferentes empresas, roles diferentes)
```

### **Flow de Autenticación:**
1. Usuario visita `fukubar.grupoip3.com/login`
2. Ingresa cualquier email: `usuario@gmail.com`
3. Sistema verifica en BD: ¿Este email está registrado para Fukubar?
4. Si SÍ → Login exitoso con datos de Fukubar
5. Si NO → Error de acceso denegado

### **Seguridad:**
- ✅ **Control por BD:** No por dominio de email
- ✅ **Aislamiento total:** Cada empresa ve solo sus datos
- ✅ **Roles personalizados:** Diferentes permisos por empresa
- ✅ **Multi-tenant:** Mismo email puede acceder a múltiples empresas

### **Administración de Usuarios:**

#### **Agregar Usuario a Empresa:**
```javascript
// Ejemplo: Dar acceso a un usuario personal a Fukubar
await prisma.user.create({
  data: {
    email: "cualquier.email@gmail.com",
    password: await bcrypt.hash("password123", 12),
    firstName: "Juan",
    lastName: "Pérez",
    companyId: fukubarCompanyId,
    role: "VIEWER"
  }
})
```

#### **Usuario Multi-empresa:**
```javascript
// Mismo email puede acceder a múltiples empresas
await prisma.user.createMany({
  data: [
    {
      email: "contador@gmail.com",
      password: hashedPassword,
      companyId: fukubarCompanyId,
      role: "ACCOUNTANT"
    },
    {
      email: "contador@gmail.com", // Mismo email
      password: hashedPassword,
      companyId: grupopanceCompanyId,
      role: "ADMIN" // Diferente rol
    }
  ]
})
```

#### **Panel de Administración (Futuro):**
- Agregar usuarios con cualquier email
- Asignar roles específicos por empresa
- Gestionar accesos multi-empresa
- No restricciones de dominio de email

---

## 🎯 Arquitectura del Sistema

### **Dominio Principal:** grupoip3.com
### **Estructura Subdominios:**
- `fukubar.grupoip3.com` (Primera empresa - Piloto)
- `empresa2.grupoip3.com` (Futuras empresas)
- `empresa3.grupoip3.com` (Según demanda)

### **Funcionalidad por Subdominio:**
- **Login independiente** por empresa
- **Dashboard contable personalizado** con branding
- **4 módulos principales:** P&G, Balance, CXC, CXP
- **Integración directa** con SIIGO API
- **Sin landing pages** - directamente al sistema

---

## 🛠 Stack Tecnológico

### **Framework & UI**
```bash
Next.js 15 (App Router)
Tailwind CSS 4
TailAdmin (Dashboard template premium)
TypeScript
```

### **Database & Auth**
```bash
Supabase (PostgreSQL + Auth)
Prisma ORM
bcryptjs (Password hashing)
```

### **Deployment & Tools**
```bash
Vercel (Hosting)
pnpm (Package manager)
ESLint + Prettier
```

### **External APIs**
```bash
SIIGO API v1 (Datos contables)
```

---

## 📁 Estructura del Proyecto

```
grupoip3-dashboard/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx              # Login universal
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── pg/page.tsx           # Pérdidas y Ganancias
│   │   │   │   ├── cxc/page.tsx          # Cuentas por Cobrar
│   │   │   │   ├── cxp/page.tsx          # Cuentas por Pagar
│   │   │   │   ├── balance/page.tsx      # Balance de Prueba
│   │   │   │   └── page.tsx              # Dashboard principal
│   │   │   └── layout.tsx                # Layout con sidebar
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── siigo/
│   │   │   │   ├── auth/route.ts         # SIIGO authentication
│   │   │   │   ├── customers/route.ts    # Clientes
│   │   │   │   ├── invoices/route.ts     # Facturas
│   │   │   │   ├── products/route.ts     # Productos
│   │   │   │   └── purchases/route.ts    # Compras
│   │   │   └── companies/
│   │   │       └── [subdomain]/route.ts # Company config by subdomain
│   │   ├── globals.css
│   │   └── layout.tsx                    # Root layout
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── dashboard/
│   │   │   ├── charts/
│   │   │   │   ├── SalesChart.tsx
│   │   │   │   ├── AgingChart.tsx
│   │   │   │   ├── BalanceChart.tsx
│   │   │   │   └── TrendChart.tsx
│   │   │   ├── kpis/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── MetricGrid.tsx
│   │   │   │   └── SummaryCards.tsx
│   │   │   ├── tables/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── InvoiceTable.tsx
│   │   │   │   └── CustomerTable.tsx
│   │   │   └── filters/
│   │   │       ├── DateRangeFilter.tsx
│   │   │       ├── CompanyFilter.tsx
│   │   │       └── FilterBar.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── BrandingProvider.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── auth.ts                       # Auth helpers
│   │   ├── prisma.ts                     # Prisma client
│   │   ├── supabase.ts                   # Supabase client
│   │   ├── siigo-client.ts               # SIIGO API client
│   │   ├── crypto.ts                     # Encryption utilities
│   │   ├── subdomain.ts                  # Subdomain detection
│   │   ├── utils.ts                      # General utilities
│   │   └── types.ts                      # TypeScript types
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-company.ts
│   │   ├── use-siigo-data.ts
│   │   └── use-dashboard-config.ts
│   └── styles/
│       └── tailwind.css
├── middleware.ts                         # Subdomain routing
├── tailwind.config.ts                    # Tailwind configuration
├── next.config.js                        # Next.js configuration
├── package.json
└── .env.local                           # Environment variables
```

---

## 🚀 Flujo de Desarrollo

### **Fase 1: Setup Base (Semana 1)**
1. **Configuración inicial del proyecto**
2. **Setup base de datos y autenticación**
3. **Middleware para subdominios**
4. **Sistema de login básico**
5. **Layout base con TailAdmin**

### **Fase 2: Integración SIIGO (Semana 1-2)**
1. **Cliente API SIIGO**
2. **Autenticación y manejo de tokens**
3. **Endpoints para datos contables**
4. **Cache y optimización**

### **Fase 3: Dashboards (Semana 2-3)**
1. **Dashboard P&G (Pérdidas y Ganancias)**
2. **Dashboard CXC (Cuentas por Cobrar)**
3. **Dashboard CXP (Cuentas por Pagar)**
4. **Dashboard Balance de Prueba**

### **Fase 4: Fukubar Específico (Semana 3)**
1. **Branding Fukubar**
2. **Configuración específica**
3. **Testing completo**
4. **Deploy a fukubar.grupoip3.com**

### **Fase 5: Multi-tenant (Ongoing)**
1. **Panel de administración**
2. **Setup empresas adicionales**
3. **Documentación**

---

## 🎨 Branding por Empresa

### **Fukubar**
- **Colores:** Primario #2D5AA0, Secundario #FF6B35
- **Logo:** A definir con cliente
- **Subdominio:** fukubar.grupoip3.com

### **Futuras Empresas**
- **Configuración dinámica** por empresa
- **Colores personalizables** en dashboard admin
- **Logo upload** por empresa
- **Subdominios automáticos**

---

## 📊 Módulos del Sistema

### **1. Dashboard P&G (Pérdidas y Ganancias)**
- Ventas totales, cantidad facturas, promedio
- Gráficos de tendencia mensual
- Filtros por fecha, centro de costo
- Impuestos y retenciones

### **2. Dashboard CXC (Cuentas por Cobrar)**
- Cartera total, aging de cartera
- Top deudores, alertas de vencimiento
- Filtros por antigüedad, cliente, monto

### **3. Dashboard CXP (Cuentas por Pagar)**
- Total por pagar, pagos por vencer
- Matriz de antigüedad
- Calendar de vencimientos

### **4. Balance de Prueba**
- Activos, Pasivos, Patrimonio
- Balance visual, ratios financieros
- Filtros por grupo de cuentas

---

## 🔒 Seguridad

### **Autenticación**
- Login por subdominio
- Sessions con Supabase Auth
- Password hashing con bcryptjs

### **Autorización**
- Role-based access (Admin, Manager, Accountant, Viewer)
- Row Level Security en Supabase
- API route protection

### **Data Protection**
- SIIGO credentials encrypted
- HTTPS only
- API rate limiting

---

## 💰 Modelo de Pricing

### **Primera Empresa (Fukubar)**
- **Desarrollo completo:** $1,200,000 COP
- **Incluye:** 4 dashboards, branding, integración SIIGO

### **Empresas Adicionales**
- **Setup y configuración:** $300,000 COP
- **Tiempo de implementación:** 1 día
- **Incluye:** Configuración, branding, capacitación

### **Proyección (10 empresas)**
- **Total estimado:** $3,900,000 COP
- **Margen empresas adicionales:** 95%+ (1 día vs $300k)