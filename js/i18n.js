/* ============================================================
   IGNEA LABS — i18n System
   All translations for all pages. Spanish is primary.
   Usage: data-i18n="key" for textContent
          data-i18n-html="key" for innerHTML
          data-i18n-placeholder="key" for placeholder
   ============================================================ */

var IgneaI18n = (function() {

  var translations = {
    es: {
      // ---- NAV ----
      "nav.home": "Inicio",
      "nav.manifesto": "Manifiesto",
      "nav.diagnostic": "Diagnóstico",
      "nav.contact": "Contacto",
      "nav.cta": "Iniciar Diagnóstico &rarr;",

      // ---- HOMEPAGE: HERO ----
      "hero.tag": "// Infraestructura de IA para Centroamérica",
      "hero.title": 'Tus operaciones funcionan por instinto. Nosotros las hacemos funcionar con <em>inteligencia.</em>',
      "hero.sub": "Encontramos el potencial dormido bajo la superficie de tu operación — las ineficiencias ocultas, los procesos manuales, los datos que nadie está usando — y lo transformamos en nuevo terreno competitivo.",
      "hero.cta1": "Iniciar Diagnóstico &rarr;",
      "hero.cta2": "Leer Manifiesto",

      // ---- HOMEPAGE: STATS ----
      "stats.s1": "de PYMEs en LatAm sin IA",
      "stats.s2": "retorno promedio por dólar",
      "stats.s3": "reducción de costos",
      "stats.s4": "min para diagnosticar",

      // ---- HOMEPAGE: WHAT WE DO ----
      "whatwedo.tag": "// Qué hacemos",
      "whatwedo.p1": "Vamos bajo la superficie de tu organización para encontrar lo que ha estado dormido.",
      "whatwedo.p2": "Nuestro proceso comienza con un diagnóstico profundo. Mapeamos tus flujos de trabajo, identificamos cuellos de botella y señalamos dónde la inteligencia artificial genera impacto medible. Luego diseñamos y desplegamos sistemas de IA personalizados — adaptados a tu operación, tus datos, tus objetivos.",
      "whatwedo.p3": "Trabajamos con un número reducido de socios. Esto no es un negocio de volumen. Cada empresa que tomamos recibe toda nuestra atención. El resultado no es optimización — es nuevo terreno.",


      // ---- HOMEPAGE: CTA ----
      "cta.tag": "// ¿Listo?",
      "cta.headline": "Descubre el potencial dormido en tu operación.",
      "cta.btn": "Iniciar Diagnóstico &rarr;",
      "cta.note": "Completamente encriptado. Resultados instantáneos.",

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
      "process.s3d": "Sistemas de IA personalizados, integrados a tu operación.",
      "process.s4t": "Optimizar",
      "process.s4d": "Iteración continua. El sistema aprende. Tu ventaja se multiplica.",

      // ---- HOMEPAGE: SOLUTIONS ---- (removed)

      // ---- HOMEPAGE: DIAGNOSTIC CTA ----
      "diag.title": "Descubre lo que realmente te cuestan tus operaciones.",
      "diag.sub": "Once preguntas. Cada una diseñada para revelar lo que más importa — las ineficiencias escondidas a plena vista, los sistemas que deberían trabajar más, y las oportunidades que tu competencia aún no ha encontrado.",
      "diag.c1": "10 preguntas",
      "diag.c2": "10–15 min",
      "diag.c3": "Resultados inmediatos",
      "diag.btn": "Iniciar Diagnóstico &rarr;",

      // ---- DIAGNOSTIC PAGE ----
      "dx.tag": "// Diagnóstico de Preparación Digital",
      "dx.title": 'Descubre lo que realmente te cuestan tus <em>operaciones.</em>',
      "dx.sub": "Once preguntas. Cada una diseñada para revelar lo que más importa.",
      "dx.encrypt": "Tus respuestas están encriptadas de extremo a extremo. Existen únicamente para construir tu perfil de preparación personalizado.",
      "dx.start": "Comenzar Diagnóstico &rarr;",

      // ---- DIAGNOSTIC: LANDING & BEFORE ----
      "dx.landing.headline": "Descubre cuánto potencial tiene tu negocio bajo la superficie.",
      "dx.landing.sub": "Once preguntas. Cada una diseñada para revelar lo que importa — las ineficiencias ocultas a simple vista, los sistemas que deberían funcionar mejor, y las oportunidades que tu competencia aún no ha encontrado.",
      "dx.landing.note": "Tus respuestas quedan entre nosotros. Mientras más honesto seas, más preciso será tu diagnóstico.",
      "dx.landing.cta": "Comenzar Diagnóstico &rarr;",
      "dx.encrypted": "Diagnóstico Encriptado",

      "dx.before.title": "Antes de comenzar",
      "dx.before.sub": "Esta información se utiliza exclusivamente para personalizar tus resultados. Tus datos están encriptados de extremo a extremo.",
      "dx.before.continue": "Continuar &rarr;",
      "dx.before.confidential": "Tus respuestas son confidenciales.",

      // ---- DIAGNOSTIC: FORM FIELDS ----
      "dx.field.firstName": "Nombre",
      "dx.field.lastName": "Apellido",
      "dx.field.email": "Email",
      "dx.field.phone": "Teléfono",
      "dx.field.company": "Empresa",
      "dx.field.position": "Cargo",
      "dx.field.industry": "Industria",
      "dx.field.size": "Tamaño",
      "dx.field.website": "Sitio web",
      "dx.field.revenue": "Ingresos mensuales",
      "dx.field.linkedin": "LinkedIn",

      // ---- DIAGNOSTIC: INDUSTRY OPTIONS ----
      "dx.industry.hotel": "Hotelería y turismo",
      "dx.industry.restaurant": "Restaurantes y alimentación",
      "dx.industry.medical": "Clínica médica",
      "dx.industry.dental": "Clínica dental",
      "dx.industry.legal": "Servicios legales",
      "dx.industry.accounting": "Contabilidad y finanzas",
      "dx.industry.realestate": "Bienes raíces",
      "dx.industry.retail": "Comercio minorista",
      "dx.industry.agriculture": "Agricultura y exportación",
      "dx.industry.education": "Educación",
      "dx.industry.construction": "Construcción",
      "dx.industry.logistics": "Logística y transporte",
      "dx.industry.other": "Otro",

      // ---- DIAGNOSTIC: NAV BUTTONS ----
      "q.next": "Continuar &rarr;",
      "q.back": "&larr; Anterior",
      "q.submit": "Completar Diagnóstico &rarr;",

      // ---- DIAGNOSTIC: REVENUE OPTIONS (info screen) ----
      "dx.rev.o1": "Menos de $2,000",
      "dx.rev.o2": "$2,000 – $5,000",
      "dx.rev.o3": "$5,000 – $15,000",
      "dx.rev.o4": "$15,000 – $50,000",
      "dx.rev.o5": "Más de $50,000",
      "dx.rev.o6": "Prefiero no decir",

      // ---- DIAGNOSTIC v2: QUESTIONS ----
      "dx.encourage": "✦ Cuéntanos más — mientras más nos compartas, más preciso será tu diagnóstico.",
      "dx.counter": "// PREGUNTA {n} / 10",
      "dx.counter1": "// PREGUNTA 1 / 10",
      "dx.counter2": "// PREGUNTA 2 / 10",
      "dx.counter3": "// PREGUNTA 3 / 10",
      "dx.counter4": "// PREGUNTA 4 / 10",
      "dx.counter5": "// PREGUNTA 5 / 10",
      "dx.counter6": "// PREGUNTA 6 / 10",
      "dx.counter7": "// PREGUNTA 7 / 10",
      "dx.counter8": "// PREGUNTA 8 / 10",
      "dx.counter9": "// PREGUNTA 9 / 10",
      "dx.counter10": "// PREGUNTA 10 / 10",
      "dx.validate": "Selecciona al menos una opción o escribe tu respuesta",
      "dx.validate.q10": "Por favor escribe al menos una oración",

      "dx.q1.title": "¿Por qué canales te contactan o encuentran tus clientes actualmente?",
      "dx.q1.o1": "WhatsApp",
      "dx.q1.o2": "Teléfono / llamadas",
      "dx.q1.o3": "Visita directa / mostrador",
      "dx.q1.o4": "Mensajes directos en redes sociales",
      "dx.q1.o5": "Formulario de sitio web",
      "dx.q1.o6": "Email",
      "dx.q1.o7": "Google / búsqueda en línea",
      "dx.q1.o8": "Referidos de clientes actuales",
      "dx.q1.ph": "¿Hay algún canal que no esté en la lista o que sea especialmente importante para ti?",

      "dx.q2.title": "¿Cuánto tiempo tarda normalmente tu equipo en responder a un cliente nuevo?",
      "dx.q2.o1": "Menos de 5 minutos",
      "dx.q2.o2": "Menos de 1 hora",
      "dx.q2.o3": "Varias horas",
      "dx.q2.o4": "Al día siguiente",
      "dx.q2.o5": "Muchos mensajes se nos van sin responder",
      "dx.q2.ph": "¿Por qué crees que ocurre eso? ¿Qué lo dificulta?",

      "dx.q3.title": "¿Cuáles de estas tareas consume tiempo de tu equipo cada semana?",
      "dx.q3.o1": "Responder WhatsApp / mensajes repetitivos",
      "dx.q3.o2": "Confirmar o agendar citas manualmente",
      "dx.q3.o3": "Hacer seguimiento a clientes que no respondieron",
      "dx.q3.o4": "Controlar inventario o existencias",
      "dx.q3.o5": "Hacer o registrar facturas",
      "dx.q3.o6": "Copiar datos de un sistema a otro",
      "dx.q3.o7": "Preparar reportes o resúmenes",
      "dx.q3.o8": "Coordinar entregas o logística",
      "dx.q3.ph": "¿Hay otra tarea repetitiva que consuma mucho tiempo y no esté en la lista?",

      "dx.q4.title": "¿Cómo manejas actualmente la información de tus clientes o pedidos?",
      "dx.q4.o1": "En la memoria o de palabra — sin registro formal",
      "dx.q4.o2": "Cuaderno o papel",
      "dx.q4.o3": "Excel o Google Sheets",
      "dx.q4.o4": "Un sistema o software especializado",
      "dx.q4.ph": "¿Qué problemas o fricciones te genera la forma actual de manejar esta información?",

      "dx.q5.title": "¿Qué partes de tu operación ya están automatizadas o sistematizadas?",
      "dx.q5.o1": "Facturación o pagos",
      "dx.q5.o2": "Confirmaciones o recordatorios de citas",
      "dx.q5.o3": "Respuestas automáticas a consultas frecuentes",
      "dx.q5.o4": "Seguimiento postventa o fidelización",
      "dx.q5.o5": "Reportes o análisis de datos",
      "dx.q5.o6": "Prácticamente todo está automatizado",
      "dx.q5.ph": "¿Qué herramientas usas para eso? ¿Qué funciona bien y qué no?",

      "dx.q6.title": "¿Qué herramientas o software usa tu negocio actualmente?",
      "dx.q6.o1": "Ninguno / solo papel o memoria",
      "dx.q6.o2": "Redes sociales (Instagram, Facebook)",
      "dx.q6.o3": "WhatsApp Business",
      "dx.q6.o4": "Excel / Google Sheets",
      "dx.q6.o5": "Software de contabilidad",
      "dx.q6.o6": "CRM o sistema de ventas",
      "dx.q6.o7": "Sistema POS",
      "dx.q6.o8": "Otro software especializado",
      "dx.q6.ph": "¿Cómo se integran estas herramientas entre sí? ¿Hay fricción entre sistemas?",

      "dx.q7.title": "¿Cuál describe mejor la presencia digital de tu negocio?",
      "dx.q7.o1": "No tenemos sitio web ni presencia estructurada en línea",
      "dx.q7.o2": "Solo redes sociales o página de Facebook",
      "dx.q7.o3": "Tenemos sitio web, pero no genera clientes",
      "dx.q7.o4": "Sitio web que genera algunos leads",
      "dx.q7.o5": "Sitio web optimizado, es nuestra principal fuente de clientes",
      "dx.q7.ph": "¿Qué funciona y qué no en tu presencia digital actual?",

      "dx.q8.title": "¿Has usado alguna herramienta de IA (ChatGPT, Gemini, etc.) en tu negocio?",
      "dx.q8.o1": "Nunca he oído de ellas",
      "dx.q8.o2": "He oído pero nunca las he usado",
      "dx.q8.o3": "Las he probado algunas veces",
      "dx.q8.o4": "Las uso regularmente en mi negocio",
      "dx.q8.o5": "Tenemos IA integrada en procesos clave",
      "dx.q8.ph": "¿Para qué la has usado o te gustaría usarla?",

      "dx.q9.title": "¿Cuál es el mayor freno al crecimiento de tu negocio en este momento?",
      "dx.q9.o1": "Falta de tiempo — el equipo está saturado",
      "dx.q9.o2": "Falta de visibilidad — no sé qué está pasando en el negocio",
      "dx.q9.o3": "Procesos inconsistentes — cada quién hace las cosas diferente",
      "dx.q9.o4": "Clientes que se van sin comprar — se nos escapan oportunidades",
      "dx.q9.ph": "Descríbenos ese freno con más detalle — ¿cómo se manifiesta en el día a día?",

      "dx.q10.title": "Si pudieras cambiar o automatizar UNA cosa en tu negocio mañana, ¿qué sería?",
      "dx.q10.ph": "Sé tan específico como puedas — esta respuesta se convierte en tu primera recomendación personalizada.",

      // ---- RESULTS v2: VALUE STREAMS ----
      "res.stream.customerFlow": "Flujo de Clientes",
      "res.stream.operationsFlow": "Flujo de Operaciones",
      "res.stream.informationFlow": "Flujo de Información",
      "res.stream.growthFlow": "Flujo de Crecimiento",

      // ---- RESULTS v2: RECOMMENDATIONS ----
      "res.reco.whatsapp_bot.t": "Bot de WhatsApp con IA",
      "res.reco.whatsapp_bot.d": "Responde consultas 24/7, agenda citas, y da seguimiento automático.",
      "res.reco.website_ai_chat.t": "Sitio Web + Chat Inteligente",
      "res.reco.website_ai_chat.d": "Presencia digital profesional con asistente que convierte visitantes en clientes.",
      "res.reco.internal_automation.t": "Automatización de Operaciones",
      "res.reco.internal_automation.d": "Elimina tareas manuales repetitivas: agenda, inventario, reportes, seguimiento.",
      "res.reco.data_integration.t": "Integración de Datos y Reportes",
      "res.reco.data_integration.d": "Conecta tus sistemas, centraliza información, y toma decisiones con datos reales.",
      "res.reco.full_transformation.t": "Transformación Digital Completa",
      "res.reco.full_transformation.d": "Infraestructura completa para escalar sin aumentar personal proporcionalmente.",

      // ---- DIAGNOSTIC: PHASE TRANSITION ----
      "dx.phase2.tag": "// Fase 2",
      "dx.phase2.text": "Perfecto. Ahora unas preguntas específicas para calcular tu puntuación de preparación digital.",
      "dx.phase2.continue": "Continuar &rarr;",

      // ---- DIAGNOSTIC: PROCESSING ----
      "dx.processing1": "Procesando tu diagnóstico...",
      "dx.processing2": "Calculando tu puntuación...",
      "dx.processing3": "Generando recomendaciones...",

      // ---- RESULTS PAGE ----
      "res.tag": "// Diagnóstico Completado",
      "res.of": "/ 100",
      "res.defaultName": "Tu Diagnóstico",

      "res.level.critical": "Crítico",
      "res.level.developing": "En Desarrollo",
      "res.level.competent": "Competente",
      "res.level.advanced": "Avanzado",

      "res.level.critical.desc": "Tu negocio tiene potencial dormido enorme. Cada semana sin actuar, ese potencial se queda bajo la superficie mientras tu competencia avanza.",
      "res.level.developing.desc": "Las bases están, pero hay brechas importantes por cerrar. La buena noticia: el potencial está ahí, listo para ser activado.",
      "res.level.competent.desc": "Tu negocio tiene buena base digital. El siguiente paso es IA para transformar lo que ya funciona en nuevo terreno competitivo.",
      "res.level.advanced.desc": "Tu operación ya está digitalizada. Estás listo para soluciones avanzadas de IA que te pongan en terreno que tu competencia ni sabe que existe.",

      "res.dimTag": "// Desglose por Dimensión",
      "res.dim.customerInteraction": "Interacción con Clientes",
      "res.dim.processMaturity": "Madurez de Procesos",
      "res.dim.digitalPresence": "Presencia Digital",
      "res.dim.dataUtilization": "Utilización de Datos",
      "res.dim.aiReadiness": "Preparación para IA",
      "res.dim.customerInteraction.low": "Tu equipo dedica demasiado tiempo a consultas repetitivas que un bot podría resolver.",
      "res.dim.customerInteraction.high": "Buen manejo de interacción con clientes.",
      "res.dim.processMaturity.low": "Procesos manuales están consumiendo horas que podrían automatizarse.",
      "res.dim.processMaturity.high": "Procesos bien estructurados.",
      "res.dim.digitalPresence.low": "Sin presencia digital, estás invisible para clientes que buscan en línea.",
      "res.dim.digitalPresence.high": "Buena presencia digital.",
      "res.dim.dataUtilization.low": "Decisiones basadas en instinto en vez de datos — oportunidad de mejora.",
      "res.dim.dataUtilization.high": "Buen uso de datos.",
      "res.dim.aiReadiness.low": "Hay una brecha de conocimiento en IA que podemos cerrar rápidamente.",
      "res.dim.aiReadiness.high": "Buena familiaridad con IA.",

      "res.costTag": "// El Costo de No Actuar",
      "res.costHeadline": "Lo que tus ineficiencias te cuestan cada mes",
      "res.cost.timeLabel": "Tiempo perdido",
      "res.cost.timeSub": "en tareas que podrían automatizarse",
      "res.cost.monthLabel": "Costo mensual",
      "res.cost.monthSub": "en productividad desperdiciada",
      "res.cost.yearLabel": "Costo anual",
      "res.cost.yearSub": "si nada cambia en los próximos 12 meses",

      "res.recoTag": "// Oportunidades Identificadas",
      "res.recoTitle": "Recomendaciones Prioritarias",
      "res.reco.timeRecLabel": "Tiempo recuperado",
      "res.reco.implLabel": "Implementación",

      "res.reco.whatsapp.t": "Bot de WhatsApp con IA",
      "res.reco.whatsapp.d2": "Tu equipo recuperaría horas semanales en atención al cliente. Responde preguntas frecuentes, agenda citas y procesa pedidos 24/7 — sin intervención humana.",
      "res.reco.whatsapp.time": "2–3 semanas",
      "res.reco.website.t": "Sitio Web + Chat Inteligente",
      "res.reco.website.d2": "Captura clientes las 24 horas sin depender de redes sociales. Presencia digital profesional con asistente IA integrado que convierte visitantes en contactos.",
      "res.reco.website.time": "2–4 semanas",
      "res.reco.automation.t": "Automatización de Procesos",
      "res.reco.automation.d2": "Inventario, agenda, reportes — elimina el trabajo manual repetitivo que consume las horas más valiosas de tu equipo. Todo en piloto automático.",
      "res.reco.automation.time": "3–5 semanas",
      "res.reco.analytics.t": "Dashboard de Analytics",
      "res.reco.analytics.d2": "Visibilidad en tiempo real de tu operación. Decisiones basadas en datos, no en intuición. Ve exactamente qué funciona y qué no.",
      "res.reco.analytics.time": "2–3 semanas",
      "res.reco.training.t": "Capacitación en IA",
      "res.reco.training.d2": "Introduce a tu equipo a las herramientas de IA que pueden multiplicar su productividad diaria. El conocimiento se convierte en ventaja competitiva.",
      "res.reco.training.time": "1–2 semanas",

      "res.roiTag2": "// Retorno Estimado",
      "res.roi.timeLabel": "Tiempo que recuperas",
      "res.roi.valueLabel": "Valor de ese tiempo",
      "res.roi.footnote": "Estas cifras son conservadoras. El impacto real suele ser 2-3x mayor cuando se considera el crecimiento de ingresos por mejor atención al cliente.",

      "res.cta.headline": "¿Listo para recuperar ese tiempo?",
      "res.cta.sub": "Agenda una llamada de 15 minutos. Te mostramos exactamente cómo implementar estas soluciones en tu negocio.",
      "res.cta.call": "Agendar llamada &rarr;",
      "res.cta.pdf": "Descargar reporte PDF",
      "res.cta.email": "O escríbenos directamente:",

      // ---- MANIFESTO ----
      "man.tag": "// Manifiesto",
      "man.title": 'Centroamérica se construyó sobre fuego. El próximo terreno es <em>digital.</em>',
      "man.p1": "Nicaragua es tierra de volcanes. Masaya, Momotombo, Cerro Negro — cada uno formó nuevo terreno a través del mismo proceso: presión desde abajo, calor aplicado a materia prima, nueva tierra emergiendo donde antes no había nada.",
      "man.p2": "Ignea Labs toma su nombre de ese proceso. Ígnea — nacida del fuego. La roca ígnea se forma cuando el magma atrapado bajo la superficie encuentra su camino hacia arriba y se transforma en terreno sólido. Eso es exactamente lo que hacemos.",
      "man.p3": "Las empresas que mueven la economía de Nicaragua están rodeadas de potencial dormido — océanos de datos que no pueden ver, sistemas que no se comunican entre sí, departamentos operando en aislamiento. Sus líderes toman decisiones por instinto porque la información que necesitan está atrapada en algún lugar que no pueden alcanzar.",
      "man.p3b": "Restaurantes que atienden turistas de todo el mundo siguen coordinando por WhatsApp. Clínicas que manejan cientos de pacientes agendan en cuadernos. Hoteles que compiten con Airbnb no tienen presencia digital más allá de una página de Facebook abandonada.",
      "man.p3c": "El potencial para cambiar todo esto ya existe. La tecnología está lista. Lo que ha faltado es alguien dispuesto a ir bajo la superficie y aplicar el calor necesario para transformar ese potencial en nuevo terreno operativo.",
      "man.break": "Eso es Ignea Labs.",
      "man.p4": "No somos una consultora que vende presentaciones. No somos una agencia que escribe código y desaparece. Nos metemos dentro de tu operación, encontramos dónde está el potencial dormido, y construimos la infraestructura que lo activa — permanentemente.",
      "man.p5": "Trabajamos con un número reducido de socios. No porque no podamos escalar, sino porque la transformación exige proximidad, honestidad, y el tipo de atención que desaparece en el momento que intentas atender a todos. Cada empresa que tomamos recibe todo el peso de lo que sabemos. Eso no es una filosofía. Es una promesa.",
      "man.p6": "Nos llamamos Ignea porque la transformación, como el fuego volcánico, se propaga. Cada automatización enciende la siguiente. Cada insight agudiza el que sigue. La brecha entre tu negocio y tu competencia se amplía silenciosamente, y luego de golpe.",
      "man.p7": "La próxima generación de líderes empresariales en Centroamérica se definirá por una sola decisión. No qué mercado entraron. No qué producto lanzaron. Si activaron el potencial dormido en su operación antes que su competencia — o pasaron años viendo cómo la brecha se ampliaba desde el lado equivocado.",
      "man.closing": "No vendemos IA. Construimos nuevo terreno.",
      "man.ctaTitle": "Descubre tu potencial.",
      "man.ctaBtn": "Iniciar Diagnóstico &rarr;",

      // ---- CONTACT ----
      "ct.tag": "// Contacto",
      "ct.headline": "Hablemos.",
      "ct.newSub": "Trabajamos con un número selecto de organizaciones. Si estás listo para descubrir el potencial dormido en tu negocio, contáctanos.",
      "ct.emailDirect": "O escríbenos directamente a",
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
      "ct.websiteLabel": "Sitio web",
      "ct.websitePh": "https://tuempresa.com (opcional)",
      "ct.msgLabel": "Mensaje",
      "ct.msgPh": "Cuéntanos sobre tu negocio y qué desafíos enfrentas...",
      "ct.submit": "Enviar Mensaje &rarr;",
      "ct.successTitle": "Mensaje enviado.",
      "ct.successSub": "Te contactaremos dentro de 24 horas.",
      "ct.sending": "Enviando...",
      "ct.errorTitle": "Error al enviar.",
      "ct.errorSub": "Intenta de nuevo.",

      // ---- FOOTER ----
      "footer.tag": "Bajo la superficie, el potencial.",
      "footer.rights": "Todos los derechos reservados.",

      // ---- 404 ----
      "e404.title": "Esta página no existe.",
      "e404.sub": "Pero tu diagnóstico de IA sí.",
      "e404.btn": "Iniciar Diagnóstico &rarr;",
      "e404.home": "&larr; Volver al inicio",

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
      "nav.cta": "Start Diagnostic &rarr;",

      // ---- HOMEPAGE: HERO ----
      "hero.tag": "// AI infrastructure for Central America",
      "hero.title": 'Your operations run on instinct. We make them run on <em>intelligence.</em>',
      "hero.sub": "We find the dormant potential beneath the surface of your operations — the hidden inefficiencies, the manual processes, the data no one is using — and transform it into competitive new ground.",
      "hero.cta1": "Begin Diagnostic &rarr;",
      "hero.cta2": "Read Manifesto",

      // ---- HOMEPAGE: STATS ----
      "stats.s1": "of LatAm SMBs lack AI",
      "stats.s2": "avg return per dollar",
      "stats.s3": "cost reduction",
      "stats.s4": "min to diagnose",

      // ---- HOMEPAGE: WHAT WE DO ----
      "whatwedo.tag": "// What We Do",
      "whatwedo.p1": "We go beneath the surface of your organization to find what's been dormant.",
      "whatwedo.p2": "Our process begins with a deep diagnostic. We map your workflows, identify bottlenecks, and pinpoint where artificial intelligence delivers measurable impact. Then we design and deploy custom AI systems — tailored to your operations, your data, your objectives.",
      "whatwedo.p3": "We work with a small number of partners. This is not a volume business. Every engagement gets our full attention. The result isn't optimization — it's new ground.",

      // ---- HOMEPAGE: CTA ----
      "cta.tag": "// Ready?",
      "cta.headline": "Discover the dormant potential in your operation.",
      "cta.btn": "Begin Diagnostic &rarr;",
      "cta.note": "Fully encrypted. Instant results.",

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
      "process.s3d": "Custom AI systems, integrated into your operation.",
      "process.s4t": "Optimize",
      "process.s4d": "Ongoing iteration. The system learns. Your advantage compounds.",

      // ---- HOMEPAGE: SOLUTIONS ---- (removed)

      // ---- HOMEPAGE: DIAGNOSTIC CTA ----
      "diag.title": "Discover what your operations are really costing you.",
      "diag.sub": "Eleven questions. Each one designed to surface what matters most — the inefficiencies hiding in plain sight, the systems that should be working harder, and the opportunities your competitors haven't found yet.",
      "diag.c1": "10 questions",
      "diag.c2": "10–15 min",
      "diag.c3": "Instant results",
      "diag.btn": "Begin Diagnostic &rarr;",

      // ---- DIAGNOSTIC PAGE ----
      "dx.tag": "// Digital Readiness Diagnostic",
      "dx.title": 'Discover what your operations are really <em>costing you.</em>',
      "dx.sub": "Eleven questions. Each one designed to surface what matters most.",
      "dx.encrypt": "Your responses are encrypted end-to-end. They exist solely to build your personalized readiness profile.",
      "dx.start": "Begin Diagnostic &rarr;",

      // ---- DIAGNOSTIC: LANDING & BEFORE ----
      "dx.landing.headline": "Discover how much potential lies beneath the surface of your business.",
      "dx.landing.sub": "Eleven questions. Each one designed to surface what matters most — the inefficiencies hiding in plain sight, the systems that should be working harder, and the opportunities your competitors haven't found yet.",
      "dx.landing.note": "Your answers stay between us. The more honest you are, the sharper your results.",
      "dx.landing.cta": "Begin Diagnostic &rarr;",
      "dx.encrypted": "Encrypted Diagnostic",

      "dx.before.title": "Before we begin",
      "dx.before.sub": "This information is used exclusively to personalize your results. Your data is encrypted end-to-end.",
      "dx.before.continue": "Continue &rarr;",
      "dx.before.confidential": "Your responses are confidential.",

      // ---- DIAGNOSTIC: FORM FIELDS ----
      "dx.field.firstName": "First name",
      "dx.field.lastName": "Last name",
      "dx.field.email": "Email",
      "dx.field.phone": "Phone",
      "dx.field.company": "Company",
      "dx.field.position": "Position",
      "dx.field.industry": "Industry",
      "dx.field.size": "Company size",
      "dx.field.website": "Website",
      "dx.field.revenue": "Monthly revenue",
      "dx.field.linkedin": "LinkedIn",

      // ---- DIAGNOSTIC: INDUSTRY OPTIONS ----
      "dx.industry.hotel": "Hospitality & tourism",
      "dx.industry.restaurant": "Restaurants & food",
      "dx.industry.medical": "Medical clinic",
      "dx.industry.dental": "Dental clinic",
      "dx.industry.legal": "Legal services",
      "dx.industry.accounting": "Accounting & finance",
      "dx.industry.realestate": "Real estate",
      "dx.industry.retail": "Retail",
      "dx.industry.agriculture": "Agriculture & export",
      "dx.industry.education": "Education",
      "dx.industry.construction": "Construction",
      "dx.industry.logistics": "Logistics & transport",
      "dx.industry.other": "Other",

      // ---- DIAGNOSTIC: NAV BUTTONS ----
      "q.next": "Continue &rarr;",
      "q.back": "&larr; Previous",
      "q.submit": "Complete Diagnostic &rarr;",

      // ---- DIAGNOSTIC: REVENUE OPTIONS (info screen) ----
      "dx.rev.o1": "Less than $2,000",
      "dx.rev.o2": "$2,000 – $5,000",
      "dx.rev.o3": "$5,000 – $15,000",
      "dx.rev.o4": "$15,000 – $50,000",
      "dx.rev.o5": "More than $50,000",
      "dx.rev.o6": "Prefer not to say",

      // ---- DIAGNOSTIC v2: QUESTIONS ----
      "dx.encourage": "✦ Tell us more — the more you share, the more precise your diagnostic.",
      "dx.counter": "// QUESTION {n} / 10",
      "dx.counter1": "// QUESTION 1 / 10",
      "dx.counter2": "// QUESTION 2 / 10",
      "dx.counter3": "// QUESTION 3 / 10",
      "dx.counter4": "// QUESTION 4 / 10",
      "dx.counter5": "// QUESTION 5 / 10",
      "dx.counter6": "// QUESTION 6 / 10",
      "dx.counter7": "// QUESTION 7 / 10",
      "dx.counter8": "// QUESTION 8 / 10",
      "dx.counter9": "// QUESTION 9 / 10",
      "dx.counter10": "// QUESTION 10 / 10",
      "dx.validate": "Select at least one option or type your answer",
      "dx.validate.q10": "Please write at least one sentence",

      "dx.q1.title": "Which channels do clients use to find or contact you currently?",
      "dx.q1.o1": "WhatsApp",
      "dx.q1.o2": "Phone / calls",
      "dx.q1.o3": "Walk-in / front desk",
      "dx.q1.o4": "Social media direct messages",
      "dx.q1.o5": "Website form",
      "dx.q1.o6": "Email",
      "dx.q1.o7": "Google / online search",
      "dx.q1.o8": "Referrals from current clients",
      "dx.q1.ph": "Is there a channel not on the list that's especially important to your business?",

      "dx.q2.title": "How long does it typically take your team to respond to a new customer?",
      "dx.q2.o1": "Under 5 minutes",
      "dx.q2.o2": "Under 1 hour",
      "dx.q2.o3": "A few hours",
      "dx.q2.o4": "Next day",
      "dx.q2.o5": "Many messages go unanswered",
      "dx.q2.ph": "Why does that happen? What makes it difficult?",

      "dx.q3.title": "Which of these tasks consumes your team's time every week?",
      "dx.q3.o1": "Responding to WhatsApp / repetitive messages",
      "dx.q3.o2": "Manually confirming or scheduling appointments",
      "dx.q3.o3": "Following up with clients who didn't respond",
      "dx.q3.o4": "Managing inventory or stock",
      "dx.q3.o5": "Creating or recording invoices",
      "dx.q3.o6": "Copying data from one system to another",
      "dx.q3.o7": "Preparing reports or summaries",
      "dx.q3.o8": "Coordinating deliveries or logistics",
      "dx.q3.ph": "Is there another repetitive task that takes up a lot of time but isn't on the list?",

      "dx.q4.title": "How do you currently manage your client information or orders?",
      "dx.q4.o1": "From memory or verbally — no formal record",
      "dx.q4.o2": "Notebook or paper",
      "dx.q4.o3": "Excel or Google Sheets",
      "dx.q4.o4": "A specialized system or software",
      "dx.q4.ph": "What problems or friction does your current approach create?",

      "dx.q5.title": "Which parts of your operation are already automated or systematized?",
      "dx.q5.o1": "Billing or payments",
      "dx.q5.o2": "Appointment confirmations or reminders",
      "dx.q5.o3": "Automatic replies to frequent inquiries",
      "dx.q5.o4": "Post-sale follow-up or loyalty",
      "dx.q5.o5": "Reports or data analysis",
      "dx.q5.o6": "Virtually everything is automated",
      "dx.q5.ph": "What tools do you use for that? What works well and what doesn't?",

      "dx.q6.title": "What tools or software does your business currently use?",
      "dx.q6.o1": "None / just paper or memory",
      "dx.q6.o2": "Social media (Instagram, Facebook)",
      "dx.q6.o3": "WhatsApp Business",
      "dx.q6.o4": "Excel / Google Sheets",
      "dx.q6.o5": "Accounting software",
      "dx.q6.o6": "CRM or sales system",
      "dx.q6.o7": "POS system",
      "dx.q6.o8": "Other specialized software",
      "dx.q6.ph": "How do these tools integrate with each other? Is there friction between systems?",

      "dx.q7.title": "Which best describes your business's digital presence?",
      "dx.q7.o1": "No website or structured online presence",
      "dx.q7.o2": "Only social media or a Facebook page",
      "dx.q7.o3": "We have a website but it doesn't generate clients",
      "dx.q7.o4": "Website that generates some leads",
      "dx.q7.o5": "Optimized website — our main source of clients",
      "dx.q7.ph": "What works and what doesn't in your current digital presence?",

      "dx.q8.title": "Have you used any AI tool (ChatGPT, Gemini, etc.) in your business?",
      "dx.q8.o1": "I've never heard of them",
      "dx.q8.o2": "I've heard of them but never used them",
      "dx.q8.o3": "I've tried them a few times",
      "dx.q8.o4": "I use them regularly in my business",
      "dx.q8.o5": "We have AI integrated into key processes",
      "dx.q8.ph": "What have you used it for or would like to use it for?",

      "dx.q9.title": "What is the biggest obstacle to your business growth right now?",
      "dx.q9.o1": "Lack of time — the team is overwhelmed",
      "dx.q9.o2": "Lack of visibility — I don't know what's happening in the business",
      "dx.q9.o3": "Inconsistent processes — everyone does things differently",
      "dx.q9.o4": "Clients leaving without buying — we're losing opportunities",
      "dx.q9.ph": "Describe that obstacle in more detail — how does it show up day-to-day?",

      "dx.q10.title": "If you could change or automate ONE thing in your business tomorrow, what would it be?",
      "dx.q10.ph": "Be as specific as possible — this answer becomes your first personalized recommendation.",

      // ---- RESULTS v2: VALUE STREAMS ----
      "res.stream.customerFlow": "Customer Flow",
      "res.stream.operationsFlow": "Operations Flow",
      "res.stream.informationFlow": "Information Flow",
      "res.stream.growthFlow": "Growth Flow",

      // ---- RESULTS v2: RECOMMENDATIONS ----
      "res.reco.whatsapp_bot.t": "AI WhatsApp Bot",
      "res.reco.whatsapp_bot.d": "Answers inquiries 24/7, schedules appointments, and follows up automatically.",
      "res.reco.website_ai_chat.t": "Website + AI Chat",
      "res.reco.website_ai_chat.d": "Professional digital presence with an assistant that converts visitors into clients.",
      "res.reco.internal_automation.t": "Operations Automation",
      "res.reco.internal_automation.d": "Eliminates repetitive manual tasks: scheduling, inventory, reports, follow-ups.",
      "res.reco.data_integration.t": "Data Integration & Reporting",
      "res.reco.data_integration.d": "Connect your systems, centralize information, and make decisions with real data.",
      "res.reco.full_transformation.t": "Full Digital Transformation",
      "res.reco.full_transformation.d": "Complete infrastructure to scale without proportionally increasing headcount.",

      // ---- DIAGNOSTIC: PHASE TRANSITION ----
      "dx.phase2.tag": "// Phase 2",
      "dx.phase2.text": "Perfect. Now some specific questions to calculate your digital readiness score.",
      "dx.phase2.continue": "Continue &rarr;",

      // ---- DIAGNOSTIC: PROCESSING ----
      "dx.processing1": "Processing your diagnostic...",
      "dx.processing2": "Calculating your score...",
      "dx.processing3": "Generating recommendations...",

      // ---- RESULTS PAGE ----
      "res.tag": "// Diagnostic Complete",
      "res.of": "/ 100",
      "res.defaultName": "Your Diagnostic",

      "res.level.critical": "Critical",
      "res.level.developing": "Developing",
      "res.level.competent": "Competent",
      "res.level.advanced": "Advanced",

      "res.level.critical.desc": "Your business has enormous dormant potential. Every week without action, that potential stays beneath the surface while your competition advances.",
      "res.level.developing.desc": "The foundation is there, but there are significant gaps to close. The good news: the potential is there, ready to be activated.",
      "res.level.competent.desc": "Your business has a solid digital foundation. The next step is AI to transform what already works into competitive new ground.",
      "res.level.advanced.desc": "Your operation is already digitized. You're ready for advanced AI solutions that put you on ground your competition doesn't even know exists.",

      "res.dimTag": "// Dimension Breakdown",
      "res.dim.customerInteraction": "Customer Interaction",
      "res.dim.processMaturity": "Process Maturity",
      "res.dim.digitalPresence": "Digital Presence",
      "res.dim.dataUtilization": "Data Utilization",
      "res.dim.aiReadiness": "AI Readiness",
      "res.dim.customerInteraction.low": "Your team spends too much time on repetitive inquiries that a bot could handle.",
      "res.dim.customerInteraction.high": "Good customer interaction management.",
      "res.dim.processMaturity.low": "Manual processes are consuming hours that could be automated.",
      "res.dim.processMaturity.high": "Well-structured processes.",
      "res.dim.digitalPresence.low": "Without digital presence, you're invisible to clients searching online.",
      "res.dim.digitalPresence.high": "Good digital presence.",
      "res.dim.dataUtilization.low": "Decisions based on gut feeling instead of data — room for improvement.",
      "res.dim.dataUtilization.high": "Good use of data.",
      "res.dim.aiReadiness.low": "There's an AI knowledge gap we can close quickly.",
      "res.dim.aiReadiness.high": "Good AI familiarity.",

      "res.costTag": "// The Cost of Inaction",
      "res.costHeadline": "What your inefficiencies cost you every month",
      "res.cost.timeLabel": "Time wasted",
      "res.cost.timeSub": "on tasks that could be automated",
      "res.cost.monthLabel": "Monthly cost",
      "res.cost.monthSub": "in wasted productivity",
      "res.cost.yearLabel": "Annual cost",
      "res.cost.yearSub": "if nothing changes in the next 12 months",

      "res.recoTag": "// Opportunities Identified",
      "res.recoTitle": "Priority Recommendations",
      "res.reco.timeRecLabel": "Time recovered",
      "res.reco.implLabel": "Implementation",

      "res.reco.whatsapp.t": "AI WhatsApp Bot",
      "res.reco.whatsapp.d2": "Your team would recover hours each week in customer service. Answers FAQs, books appointments, and processes orders 24/7 — without human intervention.",
      "res.reco.whatsapp.time": "2–3 weeks",
      "res.reco.website.t": "Website + Smart Chat",
      "res.reco.website.d2": "Capture clients 24 hours a day without relying on social media. Professional digital presence with an integrated AI assistant that converts visitors into contacts.",
      "res.reco.website.time": "2–4 weeks",
      "res.reco.automation.t": "Process Automation",
      "res.reco.automation.d2": "Inventory, scheduling, reports — eliminate the repetitive manual work that consumes your team's most valuable hours. Everything on autopilot.",
      "res.reco.automation.time": "3–5 weeks",
      "res.reco.analytics.t": "Analytics Dashboard",
      "res.reco.analytics.d2": "Real-time visibility into your operation. Decisions based on data, not intuition. See exactly what works and what doesn't.",
      "res.reco.analytics.time": "2–3 weeks",
      "res.reco.training.t": "AI Training",
      "res.reco.training.d2": "Introduce your team to AI tools that can multiply their daily productivity. Knowledge becomes competitive advantage.",
      "res.reco.training.time": "1–2 weeks",

      "res.roiTag2": "// Estimated Return",
      "res.roi.timeLabel": "Time you recover",
      "res.roi.valueLabel": "Value of that time",
      "res.roi.footnote": "These figures are conservative. Real impact is typically 2-3x higher when you factor in revenue growth from better customer service.",

      "res.cta.headline": "Ready to reclaim that time?",
      "res.cta.sub": "Schedule a 15-minute call. We'll show you exactly how to implement these solutions in your business.",
      "res.cta.call": "Schedule a call &rarr;",
      "res.cta.pdf": "Download PDF report",
      "res.cta.email": "Or write to us directly:",

      // ---- MANIFESTO ----
      "man.tag": "// Manifesto",
      "man.title": 'Central America was built on fire. The next ground is <em>digital.</em>',
      "man.p1": "Nicaragua is a land of volcanoes. Masaya, Momotombo, Cerro Negro — each one formed new ground through the same process: pressure from below, heat applied to raw material, new terrain emerging where none existed before.",
      "man.p2": "Ignea Labs takes its name from that process. Ignea — born of fire. Igneous rock forms when trapped magma beneath the surface finds its way up and transforms into solid ground. That is exactly what we do.",
      "man.p3": "The enterprises that power Nicaragua's economy are surrounded by dormant potential — oceans of data they cannot see, systems that don't speak to each other, departments operating in isolation. Their leaders make decisions on instinct because the information they need is trapped somewhere they cannot reach.",
      "man.p3b": "Restaurants serving tourists from around the world still coordinate by WhatsApp. Clinics managing hundreds of patients schedule in notebooks. Hotels competing with Airbnb have no digital presence beyond an abandoned Facebook page.",
      "man.p3c": "The potential to change all of this already exists. The technology is ready. What's been missing is someone willing to go beneath the surface and apply the heat needed to transform that potential into new operational ground.",
      "man.break": "That is Ignea Labs.",
      "man.p4": "We are not a consultancy that sells slide decks. We are not an agency that writes code and disappears. We embed ourselves in your operation, find where the dormant potential lies, and build the infrastructure that activates it — permanently.",
      "man.p5": "We work with a small number of partners. Not because we can't scale, but because transformation demands proximity, honesty, and the kind of attention that vanishes the moment you try to serve everyone. Every company we take on gets the full weight of what we know. That is not a philosophy. It is a promise.",
      "man.p6": "We named ourselves Ignea because transformation, like volcanic fire, spreads. Every automation ignites the next. Every insight sharpens the one that follows. The gap between your business and your competition widens quietly, then all at once.",
      "man.p7": "The next generation of business leaders in Central America will be defined by a single decision. Not which market they entered. Not which product they launched. Whether they activated the dormant potential in their operations before their competitors — or spent years watching the gap widen from the wrong side.",
      "man.closing": "We don't sell AI. We build new ground.",
      "man.ctaTitle": "Discover your potential.",
      "man.ctaBtn": "Begin Diagnostic &rarr;",

      // ---- CONTACT ----
      "ct.tag": "// Contact",
      "ct.headline": "Let's talk.",
      "ct.newSub": "We work with a select number of organizations. If you're ready to discover the dormant potential in your business, reach out.",
      "ct.emailDirect": "Or write to us directly at",
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
      "ct.websiteLabel": "Website",
      "ct.websitePh": "https://yourcompany.com (optional)",
      "ct.msgLabel": "Message",
      "ct.msgPh": "Tell us about your business and what challenges you face...",
      "ct.submit": "Send Message &rarr;",
      "ct.successTitle": "Message sent.",
      "ct.successSub": "We'll contact you within 24 hours.",
      "ct.sending": "Sending...",
      "ct.errorTitle": "Failed to send.",
      "ct.errorSub": "Please try again.",

      // ---- FOOTER ----
      "footer.tag": "Beneath the surface, the potential.",
      "footer.rights": "All rights reserved.",

      // ---- 404 ----
      "e404.title": "This page doesn't exist.",
      "e404.sub": "But your AI diagnostic does.",
      "e404.btn": "Begin Diagnostic &rarr;",
      "e404.home": "&larr; Back to home",

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

    localStorage.setItem('ignea_lang', lang);

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
    var saved = localStorage.getItem('ignea_lang');
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
function setLang(lang) { IgneaI18n.setLang(lang); }

// Init on load
document.addEventListener('DOMContentLoaded', IgneaI18n.init);
