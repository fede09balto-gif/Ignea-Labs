# IGNEA LABS — Complete Build Specification

## Table of Contents
1. Project Overview
2. Shared Components
3. Page 1: Homepage (index.html)
4. Page 2: Diagnostic Survey (diagnostic.html)
5. Page 3: Results Report (results.html)
6. Page 4: Manifesto (manifesto.html)
7. Page 5: Contact (contact.html)
8. Diagnostic Questions & Scoring Logic
9. All Copy (ES + EN)
10. Technical Implementation Notes

---

## 1. PROJECT OVERVIEW

Ignea Labs is a website + web app for an AI solutions company in Puerto Rico. The site has two jobs:
1. **Marketing**: Convince business owners they need AI (homepage, manifesto)
2. **Conversion**: Get them to take the diagnostic and see their results (diagnostic, results)

The diagnostic survey is the core product. Everything else drives traffic to it.

---

## 2. SHARED COMPONENTS

### 2.1 Navigation Bar
Sticky top nav with backdrop blur. Same across all pages.

```
[Logo: IGNEA.LABS]                    [Inicio] [Manifiesto] [Diagnóstico] [Contacto] [ES|EN]
```

- Logo links to index.html
- "Diagnóstico" is visually emphasized (border accent)
- ES/EN toggle switches all content site-wide
- On mobile: hamburger menu with slide-in panel

### 2.2 Footer
Same across all pages.

```
IGNEA.LABS                                    Inicio | Manifiesto | Diagnóstico | hola@ignealabs.com
Cerrando la brecha de IA en Puerto Rico.
                                           © 2026 Ignea Labs. Todos los derechos reservados.
```

### 2.3 Animated Grid Background
Canvas-based. Subtle grid lines with floating glowing particles in accent color. Runs on every page but at lower intensity on interior pages (reduce particle count from 20 to 10).

### 2.4 Encryption Strip
Scrolling strip of random characters prefixed with `/// E2E-ENCRYPTED ///`. Updates every 80ms. Used as a visual divider between sections. Appears on homepage and diagnostic page.

### 2.5 Language Toggle System
JavaScript i18n system using data attributes. All strings stored in a single translations object. Default language: Spanish. Persists language choice in localStorage.

---

## 3. PAGE 1: HOMEPAGE (index.html) — DONE

Already built. See the existing index.html file. Contains:
- Hero with headline, subtext, two CTAs
- Neural network canvas animation
- Stats grid (92%, 3.7x, 40%, 10min)
- Process section (4 steps in 2x2 grid)
- Terminal simulation
- Solutions grid (3 cards: WhatsApp Bot, Website + AI Chat, Internal Automation)
- Diagnostic CTA section
- Footer

---

## 4. PAGE 2: DIAGNOSTIC SURVEY (diagnostic.html)

### 4.1 Purpose
This is the lead generation engine. Business owners answer 11 questions. Their answers feed into a scoring algorithm that generates a Digital Readiness Score and identifies their top opportunities.

### 4.2 Layout & Flow

**Entry screen:**
```
[Encrypted Diagnostic header]

DESCUBRE LO QUE REALMENTE TE CUESTAN TUS OPERACIONES.

Once preguntas. Cada una diseñada para revelar lo que más importa.

11 preguntas · 10-15 minutos · Resultados inmediatos

Tus respuestas están encriptadas de extremo a extremo.
Existen únicamente para construir tu perfil de preparación personalizado.

[Comenzar Diagnóstico →]
```

**Survey interface:**
- One question per screen (full viewport, centered)
- Progress bar at top (thin accent line showing % complete)
- Question number in monospace: `01 / 11`
- Question text large and bold
- Answer input below (varies by question type)
- [Siguiente →] button to advance
- [← Anterior] subtle link to go back
- Subtle encryption animation running in background
- Smooth transitions between questions (slide or fade)

**Question types needed:**
- Text input (short answer)
- Text area (longer answer)
- Multiple choice (radio buttons, styled as cards)
- Numeric input (with unit label)
- Range slider (with labels at each end)

### 4.3 The 11 Questions

**Q1: Industry / Business Type**
- ES: "¿A qué se dedica tu negocio?"
- EN: "What does your business do?"
- Type: Text input
- Placeholder ES: "Ej: Clínica dental, Hotel boutique, Restaurante..."
- Placeholder EN: "E.g.: Dental clinic, Boutique hotel, Restaurant..."
- Scoring: Used for industry context, not scored numerically

**Q2: Team Size**
- ES: "¿Cuántos empleados tiene tu empresa?"
- EN: "How many employees does your company have?"
- Type: Multiple choice cards
- Options: 1-5 / 6-15 / 16-50 / 50+
- Scoring: Larger teams = more potential savings = higher opportunity score

**Q3: Top Time-Consuming Tasks**
- ES: "¿Cuáles son las 3 tareas que más tiempo consumen a tu equipo cada semana?"
- EN: "What are the top 3 tasks that consume the most employee time each week?"
- Type: Text area
- Placeholder ES: "Ej: Responder mensajes de WhatsApp, agendar citas, hacer inventario..."
- Scoring: Used for recommendation engine, not scored numerically

**Q4: Customer Interaction Hours**
- ES: "¿Cuántas horas por semana dedica tu equipo a responder consultas de clientes (teléfono, WhatsApp, email, redes sociales)?"
- EN: "How many hours per week does your team spend answering customer inquiries (phone, WhatsApp, email, social media)?"
- Type: Range slider (0-80 hrs, step 5)
- Labels: "0 hrs" ←→ "80+ hrs"
- Scoring: Higher hours = higher automation opportunity for customer service AI

**Q5: Digital Presence**
- ES: "¿Tu negocio tiene sitio web actualmente?"
- EN: "Does your business currently have a website?"
- Type: Multiple choice cards
- Options ES: "No tenemos" / "Sí, pero no genera clientes" / "Sí, y genera algunos clientes" / "Sí, es nuestra principal fuente de clientes"
- Options EN: "We don't have one" / "Yes, but it doesn't generate clients" / "Yes, and it generates some clients" / "Yes, it's our main client source"
- Scoring: Lower digital presence = higher opportunity for web + AI chat solution

**Q6: Scheduling & Operations**
- ES: "¿Cómo manejan actualmente la agenda, inventario o citas?"
- EN: "How do you currently manage scheduling, inventory, or appointments?"
- Type: Multiple choice (allow multiple selections)
- Options ES: "Cuaderno / papel" / "Excel o Google Sheets" / "Software especializado" / "WhatsApp / llamadas" / "De memoria"
- Options EN: "Notebook / paper" / "Excel or Google Sheets" / "Specialized software" / "WhatsApp / phone calls" / "From memory"
- Scoring: More manual = higher automation opportunity

**Q7: Current Tech Stack**
- ES: "¿Qué herramientas o software usa tu negocio actualmente?"
- EN: "What tools or software does your business currently use?"
- Type: Multiple choice (allow multiple selections)
- Options ES: "Ninguno" / "Redes sociales (Instagram, Facebook)" / "WhatsApp Business" / "Excel / Google Sheets" / "Software de contabilidad" / "CRM o sistema de ventas" / "Sistema POS" / "Otro"
- Scoring: Fewer tools = lower tech maturity = higher opportunity

**Q8: AI Familiarity**
- ES: "¿Has usado alguna herramienta de IA (ChatGPT, Gemini, etc.)?"
- EN: "Have you ever used any AI tool (ChatGPT, Gemini, etc.)?"
- Type: Multiple choice cards
- Options ES: "Nunca he oído de ellas" / "He oído pero nunca las he usado" / "Las he probado algunas veces" / "Las uso regularmente"
- Options EN: "I've never heard of them" / "I've heard of them but never used them" / "I've tried them a few times" / "I use them regularly"
- Scoring: Lower familiarity = needs more education but also = untapped market

**Q9: Biggest Bottleneck**
- ES: "¿Cuál es el mayor cuello de botella o frustración en tus operaciones diarias?"
- EN: "What is the biggest bottleneck or frustration in your daily operations?"
- Type: Text area
- Placeholder ES: "Sé honesto — mientras más específico seas, mejor será tu diagnóstico."
- Placeholder EN: "Be honest — the more specific you are, the better your diagnostic will be."
- Scoring: Used for recommendation engine, emotional anchor for proposal

**Q10: Dream Automation**
- ES: "Si pudieras automatizar UNA cosa en tu negocio mañana, ¿qué sería?"
- EN: "If you could automate ONE thing in your business tomorrow, what would it be?"
- Type: Text input
- Placeholder ES: "Ej: Responder WhatsApp automáticamente, generar facturas, agendar citas..."
- Placeholder EN: "E.g.: Auto-reply WhatsApp, generate invoices, schedule appointments..."
- Scoring: Becomes the first project we propose

**Q11: Revenue / Budget**
- ES: "¿Cuál es el ingreso mensual aproximado de tu negocio?"
- EN: "What is your business's approximate monthly revenue?"
- Type: Multiple choice cards
- Options ES: "Menos de $2,000" / "$2,000 - $5,000" / "$5,000 - $15,000" / "$15,000 - $50,000" / "Más de $50,000" / "Prefiero no decir"
- Options EN: "Less than $2,000" / "$2,000 - $5,000" / "$5,000 - $15,000" / "$15,000 - $50,000" / "More than $50,000" / "Prefer not to say"
- Scoring: Determines ability to pay and calibrates ROI presentation

### 4.4 Contact Info Collection (After Q11)

Before showing results, collect:
- Nombre / Name (text input, required)
- Email (email input, required)
- WhatsApp (tel input, optional but encouraged)
- Nombre de empresa / Company name (text input, required)

ES: "¿A dónde enviamos tu reporte?"
EN: "Where should we send your report?"

Subtitle ES: "Tu información es confidencial. La usamos únicamente para enviarte tu diagnóstico personalizado."
Subtitle EN: "Your information is confidential. We use it only to send you your personalized diagnostic."

### 4.5 Visual Design Notes
- Dark background consistent with homepage
- Each question screen should feel spacious and focused
- Progress indicator: thin accent-colored line at top of viewport
- Question number in monospace, dimmed
- Question text in Syne, 24-28px, bold
- Input styling: dark surface background, accent border on focus, monospace for text inputs
- Multiple choice cards: dark surface, 0.5px border, accent border + subtle glow on selection
- Transitions between questions: subtle slide-left animation
- After submitting: show a "processing" animation (encryption characters scrambling, then resolving into the score)

---

## 5. PAGE 3: RESULTS REPORT (results.html)

### 5.1 Purpose
Shows the Digital Readiness Score and personalized recommendations after completing the diagnostic. This page sells the engagement.

### 5.2 Layout

**Header:**
```
DIAGNOSTICO COMPLETADO

Tu Puntuacion de Preparacion Digital

[Large animated number: 34/100]
[Label: "En Desarrollo"]
[Subtitle: "Tu negocio tiene un potencial significativo de transformacion con IA."]
```

**Radar/Spider Chart:**
Visual showing the 5 dimensions as a radar chart. Filled area in accent color with transparency. Grid lines in border color.

**Dimension Breakdown:**
5 horizontal bars or cards, each showing:
- Dimension name
- Score out of 20
- One-line insight

**Top 3 Recommendations:**
```
OPORTUNIDADES IDENTIFICADAS

01  Bot de WhatsApp con IA
    Ahorro estimado: $800-1,200/mes
    Tiempo de implementacion: 2-3 semanas
    Tu equipo recuperaria ~30 hrs/semana en atencion al cliente.

02  Sitio Web + Chat Inteligente
    Ahorro estimado: $400-600/mes
    Tiempo de implementacion: 2-4 semanas
    Captura clientes las 24 horas sin depender de redes sociales.

03  Automatizacion de Agenda/Inventario
    Ahorro estimado: $300-500/mes
    Tiempo de implementacion: 3-4 semanas
    Elimina el seguimiento manual y los errores humanos.
```

**ROI Summary:**
```
RESUMEN DE RETORNO

Ahorro mensual estimado total:     $1,500 - 2,300/mes
Inversion recomendada:             $3,000 - 5,000
Periodo de recuperacion:           2-3 meses
ROI a 12 meses:                    +340%
```

**CTA:**
```
Listo para actuar?

[Agendar una llamada ->]     [Descargar reporte en PDF]

O escribenos directamente: hola@ignealabs.com
```

---

## 6. PAGE 4: MANIFESTO (manifesto.html)

### 6.1 Purpose
The "why we exist" page. Builds trust, establishes credibility, creates emotional connection.

### 6.2 Layout
Full-width editorial layout. Long-form text with dramatic spacing. No sidebar, no distractions. Text centered, max-width 640px.

### 6.3 Copy (Spanish)

```
MANIFIESTO

Puerto Rico se forjó con fuego. El próximo terreno es digital.

Las empresas que mueven la economia de Puerto Rico estan rodeadas de oceanos de datos que no pueden ver, sistemas que no se comunican entre si, y departamentos que operan en aislamiento — mientras sus lideres toman decisiones por instinto porque la informacion que necesitan esta atrapada en algun lugar que no pueden alcanzar.

Restaurantes que atienden turistas de todo el mundo siguen coordinando por WhatsApp. Clinicas que manejan cientos de pacientes agendan en cuadernos. Hoteles que compiten con Airbnb no tienen presencia digital mas alla de una pagina de Facebook abandonada.

La inteligencia para cambiar todo esto ya existe. La tecnologia esta lista. Lo que ha faltado es alguien dispuesto a construir la conexion entre lo que la IA puede hacer y lo que los negocios puertorriqueños realmente necesitan.

Eso es Ignea.

No somos una consultora que vende presentaciones. No somos una agencia que escribe codigo y desaparece. Nos metemos dentro de tu operacion, aprendemos donde sangra, y construimos los sistemas que detienen el sangrado — permanentemente.

Trabajamos con un numero reducido de socios. No porque no podamos escalar, sino porque la transformacion exige proximidad, honestidad, y el tipo de atencion que desaparece en el momento que intentas atender a todos. Cada empresa que tomamos recibe todo el peso de lo que sabemos. Eso no es una filosofia. Es una promesa.

Nos llamamos Ignea porque la transformación, como el fuego, se propaga. Cada automatización enciende la siguiente. Cada insight agudiza el que sigue. La brecha entre tu negocio y tu competencia se amplia silenciosamente, y luego de golpe.

La proxima generacion de lideres empresariales en Puerto Rico se definira por una sola decision. No que mercado entraron. No que producto lanzaron. Si adoptaron IA antes que su competencia o pasaron anos viendo como la brecha se ampliaba desde el lado equivocado.

No vendemos IA. Construimos infraestructura.
```

### 6.4 Copy (English)

```
MANIFESTO

Puerto Rico was forged by fire. The next ground is digital.

The enterprises that power Puerto Rico's economy are surrounded by oceans of data they cannot see, systems that don't speak to each other, and departments operating in isolation — while their leaders make decisions on instinct because the information they need is trapped somewhere they cannot reach.

Restaurants serving tourists from around the world still coordinate by WhatsApp. Clinics managing hundreds of patients schedule in notebooks. Hotels competing with Airbnb have no digital presence beyond an abandoned Facebook page.

The intelligence to change all of this already exists. The technology is ready. What's been missing is someone willing to build the connection between what AI can do and what Puerto Rico businesses actually need.

That is Ignea.

We are not a consultancy that sells slide decks. We are not an agency that writes code and disappears. We embed ourselves in your operation, learn where it bleeds, and build the systems that stop the bleeding — permanently.

We work with a small number of partners. Not because we can't scale, but because transformation demands proximity, honesty, and the kind of attention that vanishes the moment you try to serve everyone. Every company we take on gets the full weight of what we know. That is not a philosophy. It is a promise.

We named ourselves Ignea because transformation, like fire, spreads. Every automation ignites the next. Every insight sharpens the one that follows. The gap between your business and your competition widens quietly, then all at once.

The next generation of business leaders in Puerto Rico will be defined by a single decision. Not which market they entered. Not which product they launched. Whether they embraced AI before their competitors or spent years watching the gap widen from the wrong side.

We don't sell AI. We build infrastructure.
```

### 6.5 Design Notes
- Large display text for the title (Syne at heavy weight)
- Body text at 16-18px, generous line height (1.8)
- Accent-colored horizontal rule between major sections
- Final line "No vendemos IA. Construimos infraestructura." displayed larger, bolder, as a statement
- Subtle parallax or fade-in on scroll for text blocks
- CTA at bottom: "Descubre tu potencial -> Iniciar Diagnostico"

---

## 7. PAGE 5: CONTACT (contact.html)

### 7.1 Layout

Split layout or centered single column.

### 7.2 Form Fields
- Nombre / Name (required)
- Email (required)
- Empresa / Company (optional)
- Mensaje / Message (required, textarea)
- Submit button: "Enviar Mensaje ->" / "Send Message ->"

### 7.3 Technical Notes
- Form submission: use Formspree or Netlify Forms
- After submission: show a success message with encrypted animation
- Include a direct WhatsApp link

---

## 8. DIAGNOSTIC SCORING ALGORITHM

### Score Dimensions (each 0-20, total 0-100)

1. **Customer Interaction** (0-20) — Based on Q4 + Q5
2. **Process Maturity** (0-20) — Based on Q6 + Q7
3. **Digital Presence** (0-20) — Based on Q5 + Q7
4. **Data Utilization** (0-20) — Based on Q7 + Q6
5. **AI Readiness** (0-20) — Based on Q8 + Q7

### Score Levels
- 0-25: "Critico" / "Critical"
- 26-50: "En desarrollo" / "Developing"
- 51-75: "Competente" / "Competent"
- 76-100: "Avanzado" / "Advanced"

### Recommendation Engine
1. If customerInteraction < 10 -> Recommend WhatsApp AI Bot first
2. If digitalPresence < 10 -> Recommend Website + AI Chat
3. If processMaturity < 10 -> Recommend Internal Automation
4. If dataUtilization < 10 -> Recommend Data/Analytics Setup
5. If aiReadiness < 10 -> Include AI training/onboarding in proposal

### ROI Calculation
- Based on team size (Q2), hours on inquiries (Q4), and revenue bracket (Q11)
- Maps revenue brackets to estimated hourly employee cost
- Calculates: monthly savings, payback period, 12-month ROI

---

## 9. ADDITIONAL COPY

### 404 Page
- ES: "Esta pagina no existe. Pero tu diagnostico de IA si. -> Iniciar Diagnostico"
- EN: "This page doesn't exist. But your AI diagnostic does. -> Begin Diagnostic"

### Loading States
- ES: "Procesando tu diagnostico..." / "Calculando tu puntuacion..." / "Generando recomendaciones..."
- EN: "Processing your diagnostic..." / "Calculating your score..." / "Generating recommendations..."

---

## 10. TECHNICAL NOTES

### Performance
- Lazy load neural network animation (homepage only)
- requestAnimationFrame for all canvas animations
- Reduce grid particles on mobile (10 instead of 20)
- Compress Google Fonts request (only needed weights)

### SEO
- Proper semantic HTML
- Structured data (JSON-LD) for LocalBusiness
- Open Graph tags for social sharing
- Canonical URLs
