/* ============================================================
   ONDA AI — i18n System
   All translations for all pages. Spanish is primary.
   Usage: data-i18n="key" for textContent
          data-i18n-html="key" for innerHTML
          data-i18n-placeholder="key" for placeholder
   ============================================================ */

var OndaI18n = (function() {

  var translations = {
    es: {
      // ---- NAV ----
      "nav.home": "Inicio",
      "nav.manifesto": "Manifiesto",
      "nav.diagnostic": "Diagnóstico",
      "nav.contact": "Contacto",

      // ---- HOMEPAGE: HERO ----
      "hero.tag": "// Infraestructura de IA para Centroamérica",
      "hero.title": 'Tus operaciones funcionan por instinto. Nosotros las hacemos funcionar con <em>inteligencia.</em>',
      "hero.sub": "Diagnosticamos ineficiencias, cuantificamos el costo y desplegamos sistemas de IA personalizados que las eliminan. Para empresas listas para liderar.",
      "hero.cta1": "Iniciar Diagnóstico &rarr;",
      "hero.cta2": "Leer Manifiesto",

      // ---- HOMEPAGE: STATS ----
      "stats.s1": "de PYMEs en LatAm sin IA",
      "stats.s2": "retorno promedio por dólar",
      "stats.s3": "reducción de costos",
      "stats.s4": "min para diagnosticar",

      // ---- HOMEPAGE: PROCESS ----
      "process.tag": "// Proceso",
      "process.title": "Encontramos dónde la IA genera más valor — y lo construimos.",
      "process.p1": "Cada proyecto comienza con nuestro diagnóstico: 11 preguntas diseñadas para revelar las ineficiencias ocultas en tus operaciones. Mapeamos tus flujos de trabajo, cuantificamos el desperdicio y desplegamos sistemas que lo eliminan permanentemente.",
      "process.p2": "Trabajamos con un número selecto de socios a la vez. Cada proyecto recibe toda nuestra atención.",
      "process.s1t": "Diagnóstico",
      "process.s1d": "11 preguntas que mapean tus brechas operativas y tu preparación para IA.",
      "process.s2t": "Mapa de valor",
      "process.s2d": "Calculamos exactamente cuánto tiempo y dinero estás perdiendo.",
      "process.s3t": "Construir y desplegar",
      "process.s3d": "IA personalizada: bots de WhatsApp, automatización, flujos inteligentes.",
      "process.s4t": "Optimizar",
      "process.s4d": "Iteración continua. El sistema aprende. Tu ventaja se multiplica.",

      // ---- HOMEPAGE: SOLUTIONS ----
      "sol.tag": "// Soluciones",
      "sol.title": "Sistemas de IA diseñados para tu operación.",
      "sol.desc": "No vendemos software genérico. Construimos infraestructura personalizada que se integra a cómo realmente funciona tu negocio.",
      "sol.c1t": "Bot de WhatsApp con IA",
      "sol.c1d": "Atención al cliente 24/7. Responde preguntas, agenda citas, procesa pedidos — automáticamente.",
      "sol.c2t": "Sitio Web + Chat IA",
      "sol.c2d": "Presencia digital profesional con un asistente inteligente integrado que convierte visitantes en clientes.",
      "sol.c3t": "Automatización Interna",
      "sol.c3d": "Inventario, agenda, reportes, facturación — sistemas que eliminan el trabajo manual repetitivo.",

      // ---- HOMEPAGE: DIAGNOSTIC CTA ----
      "diag.title": "Descubre lo que realmente te cuestan tus operaciones.",
      "diag.sub": "Once preguntas. Cada una diseñada para revelar lo que más importa — las ineficiencias escondidas a plena vista, los sistemas que deberían trabajar más, y las oportunidades que tu competencia aún no ha encontrado.",
      "diag.c1": "11 preguntas",
      "diag.c2": "10–15 min",
      "diag.c3": "Resultados inmediatos",
      "diag.c4": "Encriptado",
      "diag.btn": "Iniciar Diagnóstico &rarr;",

      // ---- DIAGNOSTIC PAGE ----
      "dx.tag": "// Diagnóstico de Preparación Digital",
      "dx.title": 'Descubre lo que realmente te cuestan tus <em>operaciones.</em>',
      "dx.sub": "Once preguntas. Cada una diseñada para revelar lo que más importa.",
      "dx.chips": "11 preguntas · 10–15 minutos · Resultados inmediatos",
      "dx.encrypt": "Tus respuestas están encriptadas de extremo a extremo. Existen únicamente para construir tu perfil de preparación personalizado.",
      "dx.start": "Comenzar Diagnóstico &rarr;",

      // ---- DIAGNOSTIC: QUESTIONS ----
      "q.next": "Siguiente &rarr;",
      "q.back": "&larr; Anterior",
      "q.submit": "Generar Reporte &rarr;",

      "q1.text": "¿A qué se dedica tu negocio?",
      "q1.hint": "Esto nos ayuda a calibrar los benchmarks de tu industria.",
      "q1.ph": "Ej: Clínica dental, Hotel boutique, Restaurante...",

      "q2.text": "¿Cuántos empleados tiene tu empresa?",
      "q2.hint": "El tamaño del equipo determina el impacto potencial de la automatización.",
      "q2.o1": "1–5", "q2.o2": "6–15", "q2.o3": "16–50", "q2.o4": "50+",

      "q3.text": "¿Cuáles son las 3 tareas que más tiempo consumen a tu equipo cada semana?",
      "q3.hint": "Piensa en las que más frustran o más se repiten.",
      "q3.ph": "Ej: Responder mensajes de WhatsApp, agendar citas, hacer inventario...",

      "q4.text": "¿Cuántas horas por semana dedica tu equipo a responder consultas de clientes?",
      "q4.hint": "Teléfono, WhatsApp, email, redes sociales — todo cuenta.",
      "q4.label.min": "0 hrs",
      "q4.label.max": "80+ hrs",

      "q5.text": "¿Tu negocio tiene sitio web actualmente?",
      "q5.hint": "Evaluamos tu presencia digital actual.",
      "q5.o1": "No tenemos",
      "q5.o2": "Sí, pero no genera clientes",
      "q5.o3": "Sí, y genera algunos clientes",
      "q5.o4": "Sí, es nuestra principal fuente de clientes",

      "q6.text": "¿Cómo manejan actualmente la agenda, inventario o citas?",
      "q6.hint": "Selecciona todas las que apliquen.",
      "q6.o1": "Cuaderno / papel",
      "q6.o2": "Excel o Google Sheets",
      "q6.o3": "Software especializado",
      "q6.o4": "WhatsApp / llamadas",
      "q6.o5": "De memoria",

      "q7.text": "¿Qué herramientas o software usa tu negocio actualmente?",
      "q7.hint": "Selecciona todas las que apliquen.",
      "q7.o1": "Ninguno",
      "q7.o2": "Redes sociales (Instagram, Facebook)",
      "q7.o3": "WhatsApp Business",
      "q7.o4": "Excel / Google Sheets",
      "q7.o5": "Software de contabilidad",
      "q7.o6": "CRM o sistema de ventas",
      "q7.o7": "Sistema POS",
      "q7.o8": "Otro",

      "q8.text": "¿Has usado alguna herramienta de IA (ChatGPT, Gemini, etc.)?",
      "q8.hint": "No hay respuesta incorrecta — esto calibra nuestras recomendaciones.",
      "q8.o1": "Nunca he oído de ellas",
      "q8.o2": "He oído pero nunca las he usado",
      "q8.o3": "Las he probado algunas veces",
      "q8.o4": "Las uso regularmente",

      "q9.text": "¿Cuál es el mayor cuello de botella o frustración en tus operaciones diarias?",
      "q9.hint": "Sé honesto — mientras más específico seas, mejor será tu diagnóstico.",
      "q9.ph": "Sé honesto — mientras más específico seas, mejor será tu diagnóstico.",

      "q10.text": "Si pudieras automatizar UNA cosa en tu negocio mañana, ¿qué sería?",
      "q10.hint": "La respuesta a esta pregunta se convierte en tu primera recomendación.",
      "q10.ph": "Ej: Responder WhatsApp automáticamente, generar facturas, agendar citas...",

      "q11.text": "¿Cuál es el ingreso mensual aproximado de tu negocio?",
      "q11.hint": "Esto calibra nuestras estimaciones de ROI. Es completamente confidencial.",
      "q11.o1": "Menos de $2,000",
      "q11.o2": "$2,000 – $5,000",
      "q11.o3": "$5,000 – $15,000",
      "q11.o4": "$15,000 – $50,000",
      "q11.o5": "Más de $50,000",
      "q11.o6": "Prefiero no decir",

      // ---- DIAGNOSTIC: CONTACT COLLECTION ----
      "qc.title": "¿A dónde enviamos tu reporte?",
      "qc.sub": "Tu información es confidencial. La usamos únicamente para enviarte tu diagnóstico personalizado.",
      "qc.name": "Nombre",
      "qc.name.ph": "Tu nombre completo",
      "qc.email": "Email",
      "qc.email.ph": "tu@correo.com",
      "qc.whatsapp": "WhatsApp (opcional)",
      "qc.whatsapp.ph": "+505 0000 0000",
      "qc.company": "Nombre de empresa",
      "qc.company.ph": "Tu empresa",

      // ---- DIAGNOSTIC: PROCESSING ----
      "dx.processing1": "Procesando tu diagnóstico...",
      "dx.processing2": "Calculando tu puntuación...",
      "dx.processing3": "Generando recomendaciones...",

      // ---- RESULTS PAGE ----
      "res.tag": "// Diagnóstico Completado",
      "res.title": "Tu Puntuación de Preparación Digital",
      "res.of": "/ 100",

      "res.level.critical": "Crítico",
      "res.level.developing": "En Desarrollo",
      "res.level.competent": "Competente",
      "res.level.advanced": "Avanzado",

      "res.level.critical.desc": "Tu negocio tiene un potencial enorme de transformación con IA. Cada proceso manual es una inversión esperando ser hecha.",
      "res.level.developing.desc": "Tu negocio tiene un potencial significativo de transformación con IA. Las bases están, pero hay brechas importantes por cerrar.",
      "res.level.competent.desc": "Buena base digital. Soluciones de IA pueden acelerar significativamente tu competitividad.",
      "res.level.advanced.desc": "Operación madura. Optimizaciones de IA de próximo nivel pueden generar ventajas exponenciales.",

      "res.dim.customerInteraction": "Interacción con Clientes",
      "res.dim.processMaturity": "Madurez de Procesos",
      "res.dim.digitalPresence": "Presencia Digital",
      "res.dim.dataUtilization": "Utilización de Datos",
      "res.dim.aiReadiness": "Preparación para IA",

      "res.recoTag": "// Oportunidades Identificadas",
      "res.recoTitle": "Recomendaciones Prioritarias",

      "res.reco.whatsapp.t": "Bot de WhatsApp con IA",
      "res.reco.whatsapp.d": "Tu equipo recuperaría horas semanales en atención al cliente. Responde preguntas frecuentes, agenda citas y procesa pedidos 24/7.",
      "res.reco.whatsapp.time": "2–3 semanas",
      "res.reco.website.t": "Sitio Web + Chat Inteligente",
      "res.reco.website.d": "Captura clientes las 24 horas sin depender de redes sociales. Presencia digital profesional con asistente IA.",
      "res.reco.website.time": "2–4 semanas",
      "res.reco.automation.t": "Automatización de Agenda/Inventario",
      "res.reco.automation.d": "Elimina el seguimiento manual y los errores humanos. Reportes, facturación e inventario en piloto automático.",
      "res.reco.automation.time": "3–4 semanas",
      "res.reco.analytics.t": "Dashboard de Analytics",
      "res.reco.analytics.d": "Visibilidad en tiempo real de tu operación. Decisiones basadas en datos, no en intuición.",
      "res.reco.analytics.time": "2–3 semanas",
      "res.reco.training.t": "Capacitación en IA para tu Equipo",
      "res.reco.training.d": "Introduce a tu equipo a las herramientas de IA que pueden multiplicar su productividad diaria.",
      "res.reco.training.time": "1–2 semanas",

      "res.roiTag": "// Resumen de Retorno",
      "res.roiSavings": "Ahorro mensual estimado",
      "res.roiInvestment": "Inversión recomendada",
      "res.roiPayback": "Período de recuperación",
      "res.roi12": "ROI a 12 meses",
      "res.roiMonths": "meses",

      "res.ctaTitle": "¿Listo para actuar?",
      "res.ctaCall": "Agendar una llamada &rarr;",
      "res.ctaPdf": "Descargar reporte en PDF",
      "res.ctaEmail": "O escríbenos directamente:",

      // ---- MANIFESTO ----
      "man.tag": "// Manifiesto",
      "man.title": 'Centroamérica construyó puentes entre dos mundos. El próximo puente es <em>digital.</em>',
      "man.p1": "Las empresas que mueven la economía de Nicaragua están rodeadas de océanos de datos que no pueden ver, sistemas que no se comunican entre sí, y departamentos que operan en aislamiento — mientras sus líderes toman decisiones por instinto porque la información que necesitan está atrapada en algún lugar que no pueden alcanzar.",
      "man.p2": "Restaurantes que atienden turistas de todo el mundo siguen coordinando por WhatsApp. Clínicas que manejan cientos de pacientes agendan en cuadernos. Hoteles que compiten con Airbnb no tienen presencia digital más allá de una página de Facebook abandonada.",
      "man.p3": "La inteligencia para cambiar todo esto ya existe. La tecnología está lista. Lo que ha faltado es alguien dispuesto a construir la conexión entre lo que la IA puede hacer y lo que los negocios centroamericanos realmente necesitan.",
      "man.break": "Eso es Onda.",
      "man.p4": "No somos una consultora que vende presentaciones. No somos una agencia que escribe código y desaparece. Nos metemos dentro de tu operación, aprendemos dónde sangra, y construimos los sistemas que detienen el sangrado — permanentemente.",
      "man.p5": "Trabajamos con un número reducido de socios. No porque no podamos escalar, sino porque la transformación exige proximidad, honestidad, y el tipo de atención que desaparece en el momento que intentas atender a todos. Cada empresa que tomamos recibe todo el peso de lo que sabemos. Eso no es una filosofía. Es una promesa.",
      "man.p6": "Nos llamamos Onda porque una onda se propaga. Cada automatización habilita la siguiente. Cada insight agudiza el que sigue. La brecha entre tu negocio y tu competencia se amplía silenciosamente, y luego de golpe.",
      "man.p7": "La próxima generación de líderes empresariales en Centroamérica se definirá por una sola decisión. No qué mercado entraron. No qué producto lanzaron. Si adoptaron IA antes que su competencia o pasaron años viendo cómo la brecha se ampliaba desde el lado equivocado.",
      "man.closing": "No vendemos IA. Construimos infraestructura.",
      "man.ctaTitle": "Descubre tu potencial.",
      "man.ctaBtn": "Iniciar Diagnóstico &rarr;",

      // ---- CONTACT ----
      "ct.tag": "// Contacto",
      "ct.title": '¿Listo para descubrir el potencial de <em>tu negocio?</em>',
      "ct.sub": "No es una llamada de ventas. Es una conversación estratégica sobre las oportunidades específicas en tu operación.",
      "ct.emailLabel": "Email",
      "ct.whatsappLabel": "WhatsApp",
      "ct.locationLabel": "Ubicación",
      "ct.location": "Managua, Nicaragua — operamos en toda Centroamérica",
      "ct.waText": "Escríbenos directo",
      "ct.response": "Respondemos en menos de 24 horas hábiles.",
      "ct.formTag": "// Enviar mensaje",
      "ct.nameLabel": "Nombre",
      "ct.namePh": "Tu nombre",
      "ct.emailFormLabel": "Email",
      "ct.emailPh": "tu@correo.com",
      "ct.companyLabel": "Empresa",
      "ct.companyPh": "Nombre de tu empresa (opcional)",
      "ct.msgLabel": "Mensaje",
      "ct.msgPh": "Cuéntanos sobre tu negocio y qué desafíos enfrentas...",
      "ct.submit": "Enviar Mensaje &rarr;",
      "ct.successTitle": "Mensaje enviado.",
      "ct.successSub": "Te contactaremos dentro de 24 horas.",
      "ct.sending": "Enviando...",
      "ct.errorTitle": "Error al enviar.",
      "ct.errorSub": "Intenta de nuevo.",

      // ---- FOOTER ----
      "footer.tag": "Cerrando la brecha de IA en Centroamérica.",
      "footer.rights": "Todos los derechos reservados.",

      // ---- 404 ----
      "e404.title": "Esta página no existe.",
      "e404.sub": "Pero tu diagnóstico de IA sí.",
      "e404.btn": "Iniciar Diagnóstico &rarr;",

      // ---- OPS DASHBOARD ----
      "ops.logout": "salir",
      "ops.tab.pipeline": "Pipeline",
      "ops.tab.leads": "Leads",
      "ops.tab.calculator": "Calculadora",
      "ops.tab.scraper": "Scraper",

      // Pipeline stages
      "ops.stage.new": "Nuevo",
      "ops.stage.contacted": "Contactado",
      "ops.stage.meeting": "Reunión",
      "ops.stage.proposal": "Propuesta",
      "ops.stage.negotiating": "Negociando",
      "ops.stage.won": "Cerrado ✓",
      "ops.stage.lost": "Perdido ✗",
      "ops.stage.hold": "Pausado",

      // Pipeline stats
      "ops.pipe.totalLeads": "Leads Activos",
      "ops.pipe.totalValue": "Valor del Pipeline",
      "ops.pipe.avgScore": "Puntuación Promedio",
      "ops.pipe.winRate": "Tasa de Cierre",
      "ops.pipe.days": "días",

      // Priority
      "ops.priority.hot": "Urgente",
      "ops.priority.high": "Alto",
      "ops.priority.medium": "Medio",
      "ops.priority.low": "Bajo",

      // Leads table
      "ops.leads.date": "Fecha",
      "ops.leads.company": "Empresa",
      "ops.leads.contact": "Contacto",
      "ops.leads.industry": "Industria",
      "ops.leads.score": "Puntuación",
      "ops.leads.stage": "Etapa",
      "ops.leads.priority": "Prioridad",
      "ops.leads.dealValue": "Valor",
      "ops.leads.actions": "Acciones",
      "ops.leads.search": "Buscar empresa, nombre, email...",
      "ops.leads.allStages": "Todas las etapas",
      "ops.leads.allPriorities": "Todas las prioridades",
      "ops.leads.empty": "No hay leads registrados.",

      // Detail panel
      "ops.detail.contact": "// Contacto",
      "ops.detail.diagnostic": "// Diagnóstico",
      "ops.detail.scraper": "// Datos del Scraper",
      "ops.detail.notes": "// Notas",
      "ops.detail.activity": "// Actividad",
      "ops.detail.noScraper": "Sin datos de scraper.",
      "ops.detail.calcPrice": "Calcular Precio →",
      "ops.detail.runScraper": "Ejecutar Scraper →",
      "ops.detail.markContacted": "Marcar como Contactado",
      "ops.detail.scheduleMeeting": "Agendar Reunión",
      "ops.detail.sendProposal": "Enviar Propuesta",

      // Calculator
      "ops.calc.selectLead": "Seleccionar lead...",
      "ops.calc.industry": "Industria",
      "ops.calc.teamSize": "Tamaño del equipo",
      "ops.calc.hours": "Horas/semana en consultas",
      "ops.calc.methods": "Métodos de gestión",
      "ops.calc.tech": "Stack tecnológico",
      "ops.calc.website": "Estado del sitio web",
      "ops.calc.ai": "Familiaridad con IA",
      "ops.calc.revenue": "Rango de ingresos",
      "ops.calc.capture": "Tasa de captura",
      "ops.calc.savingsTitle": "Desglose de Ahorro",
      "ops.calc.pricingTitle": "Precio y Retorno",
      "ops.calc.recPrice": "Precio recomendado",
      "ops.calc.payback": "Período de recuperación",
      "ops.calc.roi12": "ROI a 12 meses",
      "ops.calc.clientKeeps": "Cliente conserva",
      "ops.calc.save": "Guardar Cálculo",
      "ops.calc.copy": "Copiar Resumen",
      "ops.calc.pdf": "Generar Propuesta PDF",
      "ops.calc.saved": "Guardado ✓",
      "ops.calc.copied": "Copiado ✓",
      "ops.calc.months": "meses",
      "ops.calc.perMonth": "/mes",
      "ops.calc.savingsPerMonth": "en ahorros",
      "ops.calc.formula": "× tasa de captura",

      // Calculator: website options
      "ops.calc.web0": "No tiene sitio web",
      "ops.calc.web1": "Sí, pero no genera clientes",
      "ops.calc.web2": "Sí, genera algunos clientes",
      "ops.calc.web3": "Sí, es fuente principal de clientes",

      // Calculator: AI options
      "ops.calc.ai0": "Nunca ha oído de IA",
      "ops.calc.ai1": "Ha oído pero no usa",
      "ops.calc.ai2": "Ha probado algunas veces",
      "ops.calc.ai3": "Usa regularmente",

      // Calculator: methods
      "ops.calc.paper": "Papel",
      "ops.calc.excel": "Excel",
      "ops.calc.software": "Software",
      "ops.calc.whatsapp": "WhatsApp",
      "ops.calc.memory": "Memoria",

      // Calculator: tech
      "ops.calc.techNone": "Ninguno",
      "ops.calc.techSocial": "Redes sociales",
      "ops.calc.techWA": "WhatsApp Business",
      "ops.calc.techExcel": "Excel / Sheets",
      "ops.calc.techAccounting": "Contabilidad",
      "ops.calc.techCRM": "CRM",
      "ops.calc.techPOS": "POS",

      // Calculator: revenue
      "ops.calc.rev0": "Menos de $2,000",
      "ops.calc.rev1": "$2,000 – $5,000",
      "ops.calc.rev2": "$5,000 – $15,000",
      "ops.calc.rev3": "$15,000 – $50,000",
      "ops.calc.rev4": "Más de $50,000",
      "ops.calc.rev5": "No especificado",

      // Scraper
      "ops.scraper.url": "URL del sitio web",
      "ops.scraper.name": "Nombre de la empresa",
      "ops.scraper.location": "Ubicación",
      "ops.scraper.selectLead": "Seleccionar lead...",
      "ops.scraper.run": "Ejecutar Scraper →",
      "ops.scraper.save": "Guardar Resultados",
      "ops.scraper.analyzing": "Analizando sitio web...",
      "ops.scraper.social": "Buscando redes sociales...",
      "ops.scraper.places": "Consultando Google Maps...",
      "ops.scraper.competitors": "Analizando competidores...",
      "ops.scraper.done": "Análisis completado.",
      "ops.scraper.noApiKey": "API key no configurada — omitiendo Google Places",
      "ops.scraper.noUrl": "No se pudo acceder al sitio web",
      "ops.scraper.opportunities": "Oportunidades",
      "ops.scraper.competitors.title": "Competidores",
      "ops.scraper.saved": "Resultados guardados ✓",

      // Auth
      "ops.auth.denied": "denied",
      "ops.auth.terminated": "connection terminated",

      // Diagnostic extras
      "ops.dx.website": "Sitio web de la empresa (opcional)",
      "ops.dx.websitePh": "https://tusitio.com",
      "ops.dx.linkedin": "LinkedIn de la empresa (opcional)",
      "ops.dx.linkedinPh": "linkedin.com/company/tunegocio",
    },

    en: {
      // ---- NAV ----
      "nav.home": "Home",
      "nav.manifesto": "Manifesto",
      "nav.diagnostic": "Diagnostic",
      "nav.contact": "Contact",

      // ---- HOMEPAGE: HERO ----
      "hero.tag": "// AI infrastructure for Central America",
      "hero.title": 'Your operations run on instinct. We make them run on <em>intelligence.</em>',
      "hero.sub": "We diagnose inefficiencies, quantify the cost, and deploy custom AI systems that eliminate them. Built for businesses ready to lead.",
      "hero.cta1": "Begin Diagnostic &rarr;",
      "hero.cta2": "Read Manifesto",

      // ---- HOMEPAGE: STATS ----
      "stats.s1": "of LatAm SMBs lack AI",
      "stats.s2": "avg return per dollar",
      "stats.s3": "cost reduction",
      "stats.s4": "min to diagnose",

      // ---- HOMEPAGE: PROCESS ----
      "process.tag": "// Process",
      "process.title": "We find where AI creates the most value — then we build it.",
      "process.p1": "Every engagement starts with our diagnostic: 11 questions designed to surface the inefficiencies hiding in your operations. We map your workflows, quantify the waste, and deploy systems that permanently eliminate it.",
      "process.p2": "We work with a select number of partners at a time. Every engagement gets our full attention.",
      "process.s1t": "Diagnostic",
      "process.s1d": "11 questions that map your operational gaps and AI readiness.",
      "process.s2t": "Value map",
      "process.s2d": "We calculate exactly how much time and money you're losing.",
      "process.s3t": "Build & deploy",
      "process.s3d": "Custom AI: WhatsApp bots, automation, intelligent workflows.",
      "process.s4t": "Optimize",
      "process.s4d": "Ongoing iteration. The system learns. Your advantage compounds.",

      // ---- HOMEPAGE: SOLUTIONS ----
      "sol.tag": "// Solutions",
      "sol.title": "AI systems designed for your operation.",
      "sol.desc": "We don't sell generic software. We build custom infrastructure that integrates into how your business actually works.",
      "sol.c1t": "AI WhatsApp Bot",
      "sol.c1d": "24/7 customer service. Answers questions, books appointments, processes orders — automatically.",
      "sol.c2t": "Website + AI Chat",
      "sol.c2d": "Professional digital presence with an integrated intelligent assistant that converts visitors into clients.",
      "sol.c3t": "Internal Automation",
      "sol.c3d": "Inventory, scheduling, reports, invoicing — systems that eliminate repetitive manual work.",

      // ---- HOMEPAGE: DIAGNOSTIC CTA ----
      "diag.title": "Discover what your operations are really costing you.",
      "diag.sub": "Eleven questions. Each one designed to surface what matters most — the inefficiencies hiding in plain sight, the systems that should be working harder, and the opportunities your competitors haven't found yet.",
      "diag.c1": "11 questions",
      "diag.c2": "10–15 min",
      "diag.c3": "Instant results",
      "diag.c4": "Encrypted",
      "diag.btn": "Begin Diagnostic &rarr;",

      // ---- DIAGNOSTIC PAGE ----
      "dx.tag": "// Digital Readiness Diagnostic",
      "dx.title": 'Discover what your operations are really <em>costing you.</em>',
      "dx.sub": "Eleven questions. Each one designed to surface what matters most.",
      "dx.chips": "11 questions · 10–15 minutes · Instant results",
      "dx.encrypt": "Your responses are encrypted end-to-end. They exist solely to build your personalized readiness profile.",
      "dx.start": "Begin Diagnostic &rarr;",

      // ---- DIAGNOSTIC: QUESTIONS ----
      "q.next": "Next &rarr;",
      "q.back": "&larr; Previous",
      "q.submit": "Generate Report &rarr;",

      "q1.text": "What does your business do?",
      "q1.hint": "This helps us calibrate industry benchmarks.",
      "q1.ph": "E.g.: Dental clinic, Boutique hotel, Restaurant...",

      "q2.text": "How many employees does your company have?",
      "q2.hint": "Team size determines the potential impact of automation.",
      "q2.o1": "1–5", "q2.o2": "6–15", "q2.o3": "16–50", "q2.o4": "50+",

      "q3.text": "What are the top 3 tasks that consume the most employee time each week?",
      "q3.hint": "Think about the most frustrating or most repetitive ones.",
      "q3.ph": "E.g.: Answering WhatsApp messages, scheduling appointments, doing inventory...",

      "q4.text": "How many hours per week does your team spend answering customer inquiries?",
      "q4.hint": "Phone, WhatsApp, email, social media — all of it counts.",
      "q4.label.min": "0 hrs",
      "q4.label.max": "80+ hrs",

      "q5.text": "Does your business currently have a website?",
      "q5.hint": "We evaluate your current digital presence.",
      "q5.o1": "We don't have one",
      "q5.o2": "Yes, but it doesn't generate clients",
      "q5.o3": "Yes, and it generates some clients",
      "q5.o4": "Yes, it's our main client source",

      "q6.text": "How do you currently manage scheduling, inventory, or appointments?",
      "q6.hint": "Select all that apply.",
      "q6.o1": "Notebook / paper",
      "q6.o2": "Excel or Google Sheets",
      "q6.o3": "Specialized software",
      "q6.o4": "WhatsApp / phone calls",
      "q6.o5": "From memory",

      "q7.text": "What tools or software does your business currently use?",
      "q7.hint": "Select all that apply.",
      "q7.o1": "None",
      "q7.o2": "Social media (Instagram, Facebook)",
      "q7.o3": "WhatsApp Business",
      "q7.o4": "Excel / Google Sheets",
      "q7.o5": "Accounting software",
      "q7.o6": "CRM or sales system",
      "q7.o7": "POS system",
      "q7.o8": "Other",

      "q8.text": "Have you ever used any AI tool (ChatGPT, Gemini, etc.)?",
      "q8.hint": "No wrong answer — this calibrates our recommendations.",
      "q8.o1": "I've never heard of them",
      "q8.o2": "I've heard of them but never used them",
      "q8.o3": "I've tried them a few times",
      "q8.o4": "I use them regularly",

      "q9.text": "What is the biggest bottleneck or frustration in your daily operations?",
      "q9.hint": "Be honest — the more specific you are, the better your diagnostic will be.",
      "q9.ph": "Be honest — the more specific you are, the better your diagnostic will be.",

      "q10.text": "If you could automate ONE thing in your business tomorrow, what would it be?",
      "q10.hint": "Your answer becomes your first recommendation.",
      "q10.ph": "E.g.: Auto-reply WhatsApp, generate invoices, schedule appointments...",

      "q11.text": "What is your business's approximate monthly revenue?",
      "q11.hint": "This calibrates our ROI estimates. Completely confidential.",
      "q11.o1": "Less than $2,000",
      "q11.o2": "$2,000 – $5,000",
      "q11.o3": "$5,000 – $15,000",
      "q11.o4": "$15,000 – $50,000",
      "q11.o5": "More than $50,000",
      "q11.o6": "Prefer not to say",

      // ---- DIAGNOSTIC: CONTACT COLLECTION ----
      "qc.title": "Where should we send your report?",
      "qc.sub": "Your information is confidential. We use it only to send you your personalized diagnostic.",
      "qc.name": "Name",
      "qc.name.ph": "Your full name",
      "qc.email": "Email",
      "qc.email.ph": "you@email.com",
      "qc.whatsapp": "WhatsApp (optional)",
      "qc.whatsapp.ph": "+505 0000 0000",
      "qc.company": "Company name",
      "qc.company.ph": "Your company",

      // ---- DIAGNOSTIC: PROCESSING ----
      "dx.processing1": "Processing your diagnostic...",
      "dx.processing2": "Calculating your score...",
      "dx.processing3": "Generating recommendations...",

      // ---- RESULTS PAGE ----
      "res.tag": "// Diagnostic Complete",
      "res.title": "Your Digital Readiness Score",
      "res.of": "/ 100",

      "res.level.critical": "Critical",
      "res.level.developing": "Developing",
      "res.level.competent": "Competent",
      "res.level.advanced": "Advanced",

      "res.level.critical.desc": "Your business has enormous potential for AI transformation. Every manual process is an investment waiting to be made.",
      "res.level.developing.desc": "Your business has significant transformation potential with AI. The foundation is there, but important gaps remain.",
      "res.level.competent.desc": "Good digital foundation. AI solutions can significantly accelerate your competitiveness.",
      "res.level.advanced.desc": "Mature operation. Next-level AI optimizations can generate exponential advantages.",

      "res.dim.customerInteraction": "Customer Interaction",
      "res.dim.processMaturity": "Process Maturity",
      "res.dim.digitalPresence": "Digital Presence",
      "res.dim.dataUtilization": "Data Utilization",
      "res.dim.aiReadiness": "AI Readiness",

      "res.recoTag": "// Opportunities Identified",
      "res.recoTitle": "Priority Recommendations",

      "res.reco.whatsapp.t": "AI WhatsApp Bot",
      "res.reco.whatsapp.d": "Your team would recover hours each week in customer service. Answers FAQs, books appointments, and processes orders 24/7.",
      "res.reco.whatsapp.time": "2–3 weeks",
      "res.reco.website.t": "Website + Smart Chat",
      "res.reco.website.d": "Capture clients 24 hours a day without relying on social media. Professional digital presence with AI assistant.",
      "res.reco.website.time": "2–4 weeks",
      "res.reco.automation.t": "Scheduling/Inventory Automation",
      "res.reco.automation.d": "Eliminate manual tracking and human errors. Reports, invoicing, and inventory on autopilot.",
      "res.reco.automation.time": "3–4 weeks",
      "res.reco.analytics.t": "Analytics Dashboard",
      "res.reco.analytics.d": "Real-time visibility into your operation. Decisions based on data, not intuition.",
      "res.reco.analytics.time": "2–3 weeks",
      "res.reco.training.t": "AI Training for Your Team",
      "res.reco.training.d": "Introduce your team to AI tools that can multiply their daily productivity.",
      "res.reco.training.time": "1–2 weeks",

      "res.roiTag": "// Return Summary",
      "res.roiSavings": "Estimated monthly savings",
      "res.roiInvestment": "Recommended investment",
      "res.roiPayback": "Payback period",
      "res.roi12": "12-month ROI",
      "res.roiMonths": "months",

      "res.ctaTitle": "Ready to take action?",
      "res.ctaCall": "Schedule a call &rarr;",
      "res.ctaPdf": "Download PDF report",
      "res.ctaEmail": "Or write to us directly:",

      // ---- MANIFESTO ----
      "man.tag": "// Manifesto",
      "man.title": 'Central America built bridges between two worlds. The next bridge is <em>digital.</em>',
      "man.p1": "The enterprises that power Nicaragua's economy are surrounded by oceans of data they cannot see, systems that don't speak to each other, and departments operating in isolation — while their leaders make decisions on instinct because the information they need is trapped somewhere they cannot reach.",
      "man.p2": "Restaurants serving tourists from around the world still coordinate by WhatsApp. Clinics managing hundreds of patients schedule in notebooks. Hotels competing with Airbnb have no digital presence beyond an abandoned Facebook page.",
      "man.p3": "The intelligence to change all of this already exists. The technology is ready. What's been missing is someone willing to build the connection between what AI can do and what Central American businesses actually need.",
      "man.break": "That is Onda.",
      "man.p4": "We are not a consultancy that sells slide decks. We are not an agency that writes code and disappears. We embed ourselves in your operation, learn where it bleeds, and build the systems that stop the bleeding — permanently.",
      "man.p5": "We work with a small number of partners. Not because we can't scale, but because transformation demands proximity, honesty, and the kind of attention that vanishes the moment you try to serve everyone. Every company we take on gets the full weight of what we know. That is not a philosophy. It is a promise.",
      "man.p6": "We named ourselves Onda because a wave propagates. Every automation enables the next. Every insight sharpens the one that follows. The gap between your business and your competition widens quietly, then all at once.",
      "man.p7": "The next generation of business leaders in Central America will be defined by a single decision. Not which market they entered. Not which product they launched. Whether they embraced AI before their competitors or spent years watching the gap widen from the wrong side.",
      "man.closing": "We don't sell AI. We build infrastructure.",
      "man.ctaTitle": "Discover your potential.",
      "man.ctaBtn": "Begin Diagnostic &rarr;",

      // ---- CONTACT ----
      "ct.tag": "// Contact",
      "ct.title": 'Ready to discover the potential of <em>your business?</em>',
      "ct.sub": "This isn't a sales call. It's a strategic conversation about the specific opportunities in your operation.",
      "ct.emailLabel": "Email",
      "ct.whatsappLabel": "WhatsApp",
      "ct.locationLabel": "Location",
      "ct.location": "Managua, Nicaragua — we operate across Central America",
      "ct.waText": "Message us directly",
      "ct.response": "We respond within 24 business hours.",
      "ct.formTag": "// Send message",
      "ct.nameLabel": "Name",
      "ct.namePh": "Your name",
      "ct.emailFormLabel": "Email",
      "ct.emailPh": "you@email.com",
      "ct.companyLabel": "Company",
      "ct.companyPh": "Your company name (optional)",
      "ct.msgLabel": "Message",
      "ct.msgPh": "Tell us about your business and what challenges you face...",
      "ct.submit": "Send Message &rarr;",
      "ct.successTitle": "Message sent.",
      "ct.successSub": "We'll contact you within 24 hours.",
      "ct.sending": "Sending...",
      "ct.errorTitle": "Failed to send.",
      "ct.errorSub": "Please try again.",

      // ---- FOOTER ----
      "footer.tag": "Bridging the AI gap in Central America.",
      "footer.rights": "All rights reserved.",

      // ---- 404 ----
      "e404.title": "This page doesn't exist.",
      "e404.sub": "But your AI diagnostic does.",
      "e404.btn": "Begin Diagnostic &rarr;",

      // ---- OPS DASHBOARD ----
      "ops.logout": "logout",
      "ops.tab.pipeline": "Pipeline",
      "ops.tab.leads": "Leads",
      "ops.tab.calculator": "Calculator",
      "ops.tab.scraper": "Scraper",

      "ops.stage.new": "New",
      "ops.stage.contacted": "Contacted",
      "ops.stage.meeting": "Meeting",
      "ops.stage.proposal": "Proposal",
      "ops.stage.negotiating": "Negotiating",
      "ops.stage.won": "Closed ✓",
      "ops.stage.lost": "Lost ✗",
      "ops.stage.hold": "On Hold",

      "ops.pipe.totalLeads": "Active Leads",
      "ops.pipe.totalValue": "Pipeline Value",
      "ops.pipe.avgScore": "Average Score",
      "ops.pipe.winRate": "Win Rate",
      "ops.pipe.days": "days",

      "ops.priority.hot": "Hot",
      "ops.priority.high": "High",
      "ops.priority.medium": "Medium",
      "ops.priority.low": "Low",

      "ops.leads.date": "Date",
      "ops.leads.company": "Company",
      "ops.leads.contact": "Contact",
      "ops.leads.industry": "Industry",
      "ops.leads.score": "Score",
      "ops.leads.stage": "Stage",
      "ops.leads.priority": "Priority",
      "ops.leads.dealValue": "Value",
      "ops.leads.actions": "Actions",
      "ops.leads.search": "Search company, name, email...",
      "ops.leads.allStages": "All stages",
      "ops.leads.allPriorities": "All priorities",
      "ops.leads.empty": "No leads registered.",

      "ops.detail.contact": "// Contact",
      "ops.detail.diagnostic": "// Diagnostic",
      "ops.detail.scraper": "// Scraper Data",
      "ops.detail.notes": "// Notes",
      "ops.detail.activity": "// Activity",
      "ops.detail.noScraper": "No scraper data.",
      "ops.detail.calcPrice": "Calculate Price →",
      "ops.detail.runScraper": "Run Scraper →",
      "ops.detail.markContacted": "Mark as Contacted",
      "ops.detail.scheduleMeeting": "Schedule Meeting",
      "ops.detail.sendProposal": "Send Proposal",

      "ops.calc.selectLead": "Select lead...",
      "ops.calc.industry": "Industry",
      "ops.calc.teamSize": "Team size",
      "ops.calc.hours": "Hours/week on inquiries",
      "ops.calc.methods": "Management methods",
      "ops.calc.tech": "Tech stack",
      "ops.calc.website": "Website status",
      "ops.calc.ai": "AI familiarity",
      "ops.calc.revenue": "Revenue range",
      "ops.calc.capture": "Capture rate",
      "ops.calc.savingsTitle": "Savings Breakdown",
      "ops.calc.pricingTitle": "Price & Return",
      "ops.calc.recPrice": "Recommended price",
      "ops.calc.payback": "Payback period",
      "ops.calc.roi12": "12-month ROI",
      "ops.calc.clientKeeps": "Client keeps",
      "ops.calc.save": "Save Calculation",
      "ops.calc.copy": "Copy Summary",
      "ops.calc.pdf": "Generate Proposal PDF",
      "ops.calc.saved": "Saved ✓",
      "ops.calc.copied": "Copied ✓",
      "ops.calc.months": "months",
      "ops.calc.perMonth": "/mo",
      "ops.calc.savingsPerMonth": "in savings",
      "ops.calc.formula": "× capture rate",

      "ops.calc.web0": "No website",
      "ops.calc.web1": "Yes, but no clients",
      "ops.calc.web2": "Yes, some clients",
      "ops.calc.web3": "Yes, main client source",

      "ops.calc.ai0": "Never heard of AI",
      "ops.calc.ai1": "Heard but doesn't use",
      "ops.calc.ai2": "Has tried a few times",
      "ops.calc.ai3": "Uses regularly",

      "ops.calc.paper": "Paper",
      "ops.calc.excel": "Excel",
      "ops.calc.software": "Software",
      "ops.calc.whatsapp": "WhatsApp",
      "ops.calc.memory": "Memory",

      "ops.calc.techNone": "None",
      "ops.calc.techSocial": "Social media",
      "ops.calc.techWA": "WhatsApp Business",
      "ops.calc.techExcel": "Excel / Sheets",
      "ops.calc.techAccounting": "Accounting",
      "ops.calc.techCRM": "CRM",
      "ops.calc.techPOS": "POS",

      "ops.calc.rev0": "Less than $2,000",
      "ops.calc.rev1": "$2,000 – $5,000",
      "ops.calc.rev2": "$5,000 – $15,000",
      "ops.calc.rev3": "$15,000 – $50,000",
      "ops.calc.rev4": "More than $50,000",
      "ops.calc.rev5": "Not specified",

      "ops.scraper.url": "Website URL",
      "ops.scraper.name": "Company name",
      "ops.scraper.location": "Location",
      "ops.scraper.selectLead": "Select lead...",
      "ops.scraper.run": "Run Scraper →",
      "ops.scraper.save": "Save Results",
      "ops.scraper.analyzing": "Analyzing website...",
      "ops.scraper.social": "Searching social media...",
      "ops.scraper.places": "Querying Google Maps...",
      "ops.scraper.competitors": "Analyzing competitors...",
      "ops.scraper.done": "Analysis complete.",
      "ops.scraper.noApiKey": "API key not configured — skipping Google Places",
      "ops.scraper.noUrl": "Could not access website",
      "ops.scraper.opportunities": "Opportunities",
      "ops.scraper.competitors.title": "Competitors",
      "ops.scraper.saved": "Results saved ✓",

      "ops.auth.denied": "denied",
      "ops.auth.terminated": "connection terminated",

      "ops.dx.website": "Company website (optional)",
      "ops.dx.websitePh": "https://yoursite.com",
      "ops.dx.linkedin": "Company LinkedIn (optional)",
      "ops.dx.linkedinPh": "linkedin.com/company/yourbusiness",
    }
  };

  var currentLang = 'es';

  function t(key) {
    return translations[currentLang][key] || translations['es'][key] || key;
  }

  function setLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    var esBtn = document.getElementById('langES');
    var enBtn = document.getElementById('langEN');
    if (esBtn) esBtn.classList.toggle('active', lang === 'es');
    if (enBtn) enBtn.classList.toggle('active', lang === 'en');

    localStorage.setItem('onda_lang', lang);

    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var val = translations[lang][key];
      if (val) el.textContent = val;
    });

    // Update innerHTML
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-html');
      var val = translations[lang][key];
      if (val) el.innerHTML = val;
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = translations[lang][key];
      if (val) el.placeholder = val;
    });

    // Update select options
    document.querySelectorAll('select option[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var val = translations[lang][key];
      if (val) el.textContent = val;
    });

    // Update elements with HTML entities (buttons with arrows)
    document.querySelectorAll('[data-i18n-btn]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-btn');
      var val = translations[lang][key];
      if (val) el.innerHTML = val;
    });

    // Fire custom event for page-specific handlers
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  function init() {
    var saved = localStorage.getItem('onda_lang');
    if (saved && saved !== currentLang) {
      setLang(saved);
    }
  }

  function getLang() {
    return currentLang;
  }

  return {
    t: t,
    setLang: setLang,
    init: init,
    getLang: getLang,
    translations: translations
  };
})();

// Global convenience
function setLang(lang) { OndaI18n.setLang(lang); }

// Init on load
document.addEventListener('DOMContentLoaded', OndaI18n.init);
