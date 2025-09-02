# Prompt Completo para Crear FinanceAI - Aplicación de Análisis Financiero

## Descripción General del Proyecto

Desarrolla una aplicación web completa llamada **FinanceAI** que permite a usuarios chilenos subir estados de cuenta de tarjetas de crédito (PDF, Excel, CSV) y recibir análisis financieros inteligentes con recomendaciones personalizadas. La aplicación debe estar completamente en español y ser optimizada para el formato específico de estados de cuenta chilenos.

## Características Principales Requeridas

### 1. Procesamiento de Archivos Especializado
- **Soporte multi-formato**: PDF, Excel (.xlsx, .xls), CSV
- **Límite de archivos**: Máximo 10MB por archivo
- **Procesamiento especializado para PDFs chilenos** con el formato específico:
  - `"Ciudad DD/MM/YYYY Descripción Código Monto1 Monto2 VencimientoFinal MontoFinal"`
  - Ejemplo: `"Las Condes 19/07/2025 Mercadopago *sociedad A2 89.990 89.990 01/01 sep-2025 89.990"`

### 2. Motor de Extracción de Transacciones (Crítico para PDFs)
Implementa múltiples patrones regex para capturar diferentes formatos encontrados en estados de cuenta chilenos:

#### Patrón 1: Formato estándar con espacios
```
"Las Condes 19/07/2025 Mercadopago *sociedad A2 89.990 89.990 01/01 sep-2025 89.990"
```

#### Patrón 2: Formato condensado sin espacios  
```
"Las Condes17/08/2025Mercadopago *lavuelta T7.1507.15001/01sep-20257.150"
```

#### Patrón 3: Formato S/I (Sin Identificar)
```
"S/I27/07/2025Compra falabella plaza vespucio T37.90537.90501/01sep-202537.905"
```

#### Patrón 4: Sin ciudad, inicia con fecha
```
"27/07/2025Pago automatico seg auto subaru T113.678113.67801/01sep-2025113.678"
```

#### Patrón 5: Transacciones de reversa (montos negativos)
```
"06/08/2025Anulacion pago automatico abono T17.040-17.04001/01sep-2025-17.040"
```

#### Patrón 6: Muy flexible para casos edge
Para capturar variaciones no contempladas en los patrones anteriores.

### 3. Sistema de Categorización Inteligente
Categoriza automáticamente las transacciones usando palabras clave en español:

- **Alimentación**: Supermercado, restaurante, delivery, comida
- **Transporte**: Uber, taxi, metro, combustible, parking, peaje
- **Entretenimiento**: Cine, Netflix, Spotify, juegos, teatro
- **Salud**: Farmacia, médico, dentista, laboratorio, clínica
- **Tecnología**: Amazon, MercadoLibre, electrónicos, software
- **Servicios**: Luz, agua, gas, internet, teléfono, seguros
- **Educación**: Colegio, universidad, libros, cursos
- **Hogar**: Homecenter, Sodimac, muebles, decoración
- **Ropa**: Zara, H&M, Falabella, ropa, zapatos
- **Otros**: Todo lo que no encaje en categorías anteriores

### 4. Dashboard de Análisis Completo

#### Métricas Principales (Solo Gastos)
- **Gastos Totales**: Suma de todas las transacciones positivas
- **Transacciones**: Número total de compras realizadas  
- **Gasto Promedio**: Promedio por transacción
- **Día Más Activo**: Día de la semana con más transacciones

#### Visualizaciones Interactivas
1. **Gráfico de Torta**: Distribución de gastos por categoría
2. **Gráfico de Líneas**: Tendencia de gastos por día
3. **Lista de Transacciones**: Con paginación (20 por página)

### 5. Sistema de Recomendaciones Personalizadas
Genera automáticamente 3-5 recomendaciones basadas en patrones de gasto:

- Alertas por gastos excesivos en categorías específicas
- Sugerencias de optimización financiera
- Comparaciones con periodos anteriores
- Tips de ahorro personalizados

### 6. Interfaz de Usuario Moderna

#### Landing Page
- Hero section con título atractivo
- Explicación clara de la funcionalidad
- Botón CTA para subir archivos
- Diseño responsive y profesional

#### Componente de Subida de Archivos
- Drag & drop interface
- Indicador de progreso
- Validación en tiempo real
- Mensajes de error claros en español

#### Dashboard Responsivo
- Layout adaptativo para móvil y desktop
- Cards con métricas destacadas
- Gráficos interactivos
- Navegación intuitiva

## Especificaciones Técnicas

### Stack Tecnológico Requerido

#### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Recharts** para visualizaciones
- **TanStack Query** para gestión de estado
- **Wouter** para routing
- **React Hook Form** para formularios

#### Backend  
- **Node.js** con Express
- **TypeScript** en todo el proyecto
- **Multer** para manejo de archivos
- **pdf-parse** para procesamiento de PDFs
- **xlsx** para archivos Excel
- **papaparse** para archivos CSV

#### Base de Datos
- **Almacenamiento en memoria** para desarrollo (Map structures)
- **PostgreSQL con Drizzle ORM** para producción
- Esquema flexible con campos JSONB

### Estructura de Datos

#### Transaction
```typescript
interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  city?: string;
}
```

#### AnalysisResult  
```typescript
interface AnalysisResult {
  id: string;
  userId: string;
  fileName: string;
  uploadDate: Date;
  totalExpenses: number;
  transactionCount: number;
  averageExpense: number;
  mostActiveDay: string;
  transactions: Transaction[];
  categories: CategoryData[];
  recommendations: string[];
  trends: TrendData[];
}
```

### API Endpoints Requeridos

#### POST /api/upload
- Acepta archivos PDF, Excel, CSV
- Procesa y extrae transacciones
- Categoriza automáticamente
- Genera análisis completo
- Retorna ID de análisis

#### GET /api/analysis/:id
- Retorna análisis completo por ID
- Incluye transacciones, métricas, recomendaciones

### Validaciones y Manejo de Errores

#### Validaciones de Archivo
- Tipos permitidos: .pdf, .xlsx, .xls, .csv
- Tamaño máximo: 10MB
- Verificación de integridad del archivo

#### Procesamiento Robusto
- Manejo de PDFs corruptos o mal formateados
- Detección de líneas que no son transacciones
- Logging detallado para debugging
- Mensajes de error descriptivos en español

#### Filtros de Datos No Transaccionales
Excluir líneas que contengan:
- Headers de estado de cuenta
- Información del titular
- Totales y resúmenes
- Información legal y términos
- URLs y contactos del banco

## Casos de Uso Específicos para Testing

### Formatos de Transacciones de Prueba
Incluye estas líneas como casos de prueba para verificar el parsing:

```
Las Condes 19/07/2025 Mercadopago *sociedad A2 89.990 89.990 01/01 sep-2025 89.990
S/I27/07/2025Compra falabella plaza vespucio T37.90537.90501/01sep-202537.905  
27/07/2025Pago automatico seg auto subaru T113.678113.67801/01sep-2025113.678
06/08/2025Anulacion pago automatico abono T17.040-17.04001/01sep-2025-17.040
Santiago05/08/2025Colmena golden crossA2351.357351.35701/01sep-2025351.357
Santiago19/07/2025Uber eats T27.43727.43701/01sep-202527.437
```

### Líneas que NO son transacciones (para filtrar)
```
ESTADO DE CUENTA
CLIENTE ELITE
Nombre del Titular
Cupon de Pago
Próximo Período a Facturar
Costo Monetario Prepago
Infórmese sobre las entidades autorizadas
```

## Flujo de Usuario Esperado

1. **Landing**: Usuario llega a la página principal
2. **Upload**: Arrastra o selecciona su estado de cuenta
3. **Processing**: Sistema procesa archivo y extrae transacciones
4. **Analysis**: Genera categorización y análisis automático
5. **Dashboard**: Muestra métricas, gráficos y recomendaciones
6. **Navigation**: Usuario puede explorar diferentes vistas del análisis

## Requerimientos de UX/UI

### Principios de Diseño
- **Minimalista y moderno**: Interfaz limpia sin elementos innecesarios
- **Responsive first**: Diseño móvil prioritario
- **Accessibility**: Cumplir estándares WCAG
- **Performance**: Carga rápida de gráficos y datos

### Paleta de Colores Sugerida
- **Primario**: Azul corporativo (#3B82F6)
- **Secundario**: Verde éxito (#10B981) 
- **Advertencia**: Naranja (#F59E0B)
- **Error**: Rojo (#EF4444)
- **Neutros**: Escala de grises para textos

### Componentes Clave
- Botones con estados hover/active/disabled
- Cards con sombras y borders sutiles
- Gráficos con colores distintivos
- Loading skeletons durante cargas
- Toasts para feedback de acciones

## Consideraciones de Seguridad

### Manejo de Archivos
- Validación estricta de tipos MIME
- Sanitización de nombres de archivo
- Limpieza automática de archivos temporales
- Límites de rate limiting para uploads

### Datos Sensibles
- No almacenar información personal permanentemente
- Encriptar datos en tránsito
- Sessions con timeout automático
- Logs sin información sensible

## Métricas de Éxito

### Funcionalidad Core
- ✅ Procesamiento correcto de PDFs chilenos (>95% accuracy)
- ✅ Categorización automática efectiva (>90% precision)
- ✅ Dashboard responsive en todos los dispositivos
- ✅ Tiempo de procesamiento < 5 segundos para archivos normales

### Experiencia de Usuario
- ✅ Interfaz intuitiva sin curva de aprendizaje
- ✅ Feedback claro en cada paso del proceso
- ✅ Manejo graceful de errores
- ✅ Performance fluida en móvil y desktop

## Instrucciones Específicas de Implementación

### Prioridades de Desarrollo
1. **Fase 1**: Procesamiento robusto de PDFs con todos los patrones
2. **Fase 2**: Dashboard completo con métricas y gráficos
3. **Fase 3**: Sistema de recomendaciones inteligentes
4. **Fase 4**: Optimizaciones de UX y performance

### Testing y Validation
- Implementar logging detallado para debugging de patrones
- Crear suite de casos de prueba con archivos reales
- Validar en múltiples tamaños de pantalla
- Probar con diferentes bancos chilenos si es posible

### Deployment Ready
- Variables de entorno para configuración
- Docker containerization opcional
- CI/CD pipeline preparado
- Monitoring y health checks

---

**Nota Importante**: Este prompt está basado en una implementación completamente funcional y probada con estados de cuenta chilenos reales. La aplicación resultante debe ser capaz de procesar archivos complejos y generar insights financieros valiosos para usuarios chilenos.