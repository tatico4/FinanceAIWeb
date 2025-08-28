import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload from "@/components/file-upload";
import { ChartLine, Upload, Brain, Shield, FileText, Smartphone, TrendingUp, PiggyBank, Lightbulb } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showUpload, setShowUpload] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "Categorización con IA",
      description: "Aprendizaje automático avanzado que categoriza automáticamente tus transacciones con 95% de precisión, aprendiendo de tus patrones."
    },
    {
      icon: ChartLine,
      title: "Visualizaciones Interactivas",
      description: "Gráficos hermosos e interactivos que hacen que tus datos financieros sean fáciles de entender y analizar."
    },
    {
      icon: Lightbulb,
      title: "Recomendaciones Inteligentes",
      description: "Obtén insights personalizados y recomendaciones accionables para optimizar tus gastos e incrementar tus ahorros."
    },
    {
      icon: FileText,
      title: "Múltiples Formatos",
      description: "Compatible con estados de cuenta PDF, hojas de Excel y archivos CSV de todas las principales instituciones financieras."
    },
    {
      icon: Shield,
      title: "Seguridad Bancaria",
      description: "Tus datos financieros están encriptados y se eliminan automáticamente después del análisis. Nunca almacenamos información sensible."
    },
    {
      icon: Smartphone,
      title: "Diseño Responsivo",
      description: "Accede a tus insights financieros en cualquier dispositivo con nuestro diseño completamente responsivo y mobile-first."
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Sube tus Archivos",
      description: "Arrastra y suelta tus estados de cuenta en formato PDF, Excel o CSV. Soportamos todas las principales instituciones financieras."
    },
    {
      number: 2,
      title: "Análisis con IA",
      description: "Nuestro motor de IA procesa tus datos, categoriza transacciones e identifica patrones de gasto en segundos."
    },
    {
      number: 3,
      title: "Obtén Insights",
      description: "Ve dashboards interactivos, recibe recomendaciones personalizadas y rastrea tu progreso financiero."
    }
  ];

  const handleStartAnalysis = () => {
    setShowUpload(true);
    const uploadSection = document.getElementById('upload');
    uploadSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism bg-background/80 border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <ChartLine className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FinanceAI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Características
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                Cómo Funciona
              </a>
              <a href="#upload" className="text-muted-foreground hover:text-foreground transition-colors">
                Subir Archivo
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Iniciar Sesión
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleStartAnalysis}>
                Comenzar
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
              Libera tu
              <span className="block">Inteligencia Financiera</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Sube tus estados de cuenta y obtén insights con IA, categorización inteligente y recomendaciones personalizadas para optimizar tu salud financiera.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold transform hover:scale-105 transition-all"
                onClick={handleStartAnalysis}
                data-testid="button-start-analysis"
              >
                <Upload className="mr-2 h-5 w-5" />
                Iniciar Análisis
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border hover:bg-secondary font-semibold"
                data-testid="button-watch-demo"
              >
                <ChartLine className="mr-2 h-5 w-5" />
                Ver Demo
              </Button>
            </div>
          </div>
          
          {/* Dashboard Preview */}
          <div className="relative">
            <div className="float-animation">
              <Card className="glassmorphism bg-card/40 border border-border shadow-2xl max-w-4xl mx-auto">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl p-6 border border-accent/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Ingresos Mensuales</span>
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                      <div className="text-3xl font-bold text-accent">$8,420</div>
                      <div className="text-sm text-accent/70">+12% del mes pasado</div>
                    </div>
                    <div className="bg-gradient-to-r from-destructive/20 to-destructive/10 rounded-xl p-6 border border-destructive/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Gastos Mensuales</span>
                        <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
                      </div>
                      <div className="text-3xl font-bold text-destructive">$6,180</div>
                      <div className="text-sm text-destructive/70">-5% del mes pasado</div>
                    </div>
                    <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-6 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Tasa de Ahorro</span>
                        <PiggyBank className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-primary">26.6%</div>
                      <div className="text-sm text-primary/70">Sobre el objetivo</div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 rounded-xl p-6 border border-border/50">
                    <h3 className="text-lg font-semibold mb-4">Gastos por Categoría</h3>
                    <div className="flex items-end justify-between h-32 space-x-2">
                      {[
                        { label: 'Comida', height: '80%', color: 'chart-1' },
                        { label: 'Transporte', height: '65%', color: 'chart-2' },
                        { label: 'Compras', height: '45%', color: 'chart-3' },
                        { label: 'Entretenimiento', height: '30%', color: 'chart-4' },
                        { label: 'Salud', height: '20%', color: 'chart-5' }
                      ].map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className={`w-8 bg-${item.color} rounded-t`} 
                            style={{ height: item.height }}
                          />
                          <span className="text-xs mt-2">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Características Poderosas</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para entender y optimizar tu vida financiera
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glassmorphism bg-card/60 border border-border hover:bg-card/80 transition-all transform hover:scale-105">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Cómo Funciona</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Obtén insights financieros en tres simples pasos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                </div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-lg">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* File Upload Section */}
      <section id="upload" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Sube tus Datos Financieros</h2>
            <p className="text-xl text-muted-foreground">
              Sube de forma segura tus estados de cuenta para comenzar con tu análisis financiero
            </p>
          </div>
          
          <FileUpload onSuccess={(analysisId) => setLocation(`/dashboard/${analysisId}`)} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                  <ChartLine className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  FinanceAI
                </span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                Transforma tus datos financieros en insights accionables con análisis con IA y recomendaciones personalizadas.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Características</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Precios</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Política de Privacidad</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Términos de Servicio</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground">
              © 2023 FinanceAI. Todos los derechos reservados. Tus datos financieros nunca se almacenan ni se comparten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
