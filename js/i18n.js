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
      "diag.c1": "11 preguntas",
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

      // ---- DIAGNOSTIC v3: QUESTIONS ----
      "dx.encourage": "✦ Mientras más nos cuentes, más preciso será tu diagnóstico.",
      "dx.fastpath": "O selecciona rápidamente:",
      "dx.depthpath": "¿Quieres agregar más detalle?",

      "dx.q1.text": "¿Cómo te encuentran tus clientes y cómo te contactan por primera vez?",
      "dx.q1.ph": "Por ejemplo: nos buscan en Instagram, nos escriben por WhatsApp, llegan de boca en boca, nos llaman por teléfono... cuéntanos el camino típico desde que alguien se entera de tu negocio hasta que te habla por primera vez.",
      "dx.q1.c1": "WhatsApp",
      "dx.q1.c2": "Llamada telefónica",
      "dx.q1.c3": "Visita en persona",
      "dx.q1.c4": "Redes sociales (Instagram, Facebook)",
      "dx.q1.c5": "Sitio web",
      "dx.q1.c6": "Google / búsqueda en internet",
      "dx.q1.c7": "Referido / boca en boca",
      "dx.q1.c8": "Email",

      "dx.q2.text": "¿Qué tareas le quitan más tiempo a tu equipo cada semana — el trabajo repetitivo que nunca se siente terminado?",
      "dx.q2.ph": "Por ejemplo: responder las mismas preguntas por WhatsApp, confirmar citas, actualizar inventario, hacer cotizaciones, pasar datos de un lugar a otro... Si puedes, estima cuántas horas por semana se van en cada cosa.",
      "dx.q2.c1": "Responder las mismas preguntas por WhatsApp",
      "dx.q2.c2": "Agendar o confirmar citas",
      "dx.q2.c3": "Dar seguimiento a clientes que no respondieron",
      "dx.q2.c4": "Actualizar inventario o stock",
      "dx.q2.c5": "Crear facturas o cotizaciones",
      "dx.q2.c6": "Pasar datos de un lugar a otro",
      "dx.q2.c7": "Hacer reportes",
      "dx.q2.c8": "Coordinar entregas o logística",
      "dx.q2.sliderLabel": "Estimación: ¿cuántas horas por semana pierde tu equipo en estas tareas?",

      "dx.q3.text": "Cuando un cliente te escribe o te llama — ¿quién le responde, por dónde, y cuánto se tarda?",
      "dx.q3.ph": "Cuéntanos quién se encarga de responder, si es siempre la misma persona, qué pasa cuando nadie está disponible, si se pierden mensajes, y si alguien atiende de noche o en fin de semana.",
      "dx.q3.c1": "Respondemos en menos de 5 minutos",
      "dx.q3.c2": "Respondemos en menos de 1 hora",
      "dx.q3.c3": "A veces tardamos unas horas",
      "dx.q3.c4": "Usualmente respondemos al día siguiente",
      "dx.q3.c5": "Honestamente, a veces se nos pasan mensajes",

      "dx.q4.text": "Desde que un cliente hace un pedido o solicita un servicio hasta que se completa — ¿cómo funciona ese proceso paso a paso?",
      "dx.q4.ph": "Describe el recorrido: quién recibe el pedido, cómo se pasa al siguiente paso, qué sistemas o herramientas usan, dónde se atasca o se retrasa, y cuánto tarda todo el ciclo normalmente.",
      "dx.q4.c1": "Una persona hace todo, de memoria o en papel",
      "dx.q4.c2": "Varias personas, coordinadas por WhatsApp o llamadas",
      "dx.q4.c3": "Varias personas, con Excel o hojas compartidas",
      "dx.q4.c4": "Tenemos un sistema o software que organiza el flujo",

      "dx.transition.text": "Gracias — ahora unas preguntas específicas para calcular tu puntuación.",
      "dx.transition.continue": "Continuar &rarr;",

      "dx.q5.text": "En tu negocio, ¿cuáles de estos procesos de dinero todavía se hacen a mano?",
      "dx.q5.c1": "Cotizaciones se hacen en Word, papel o WhatsApp",
      "dx.q5.c2": "Facturas se crean a mano",
      "dx.q5.c3": "Cobros se rastrean en cuaderno o Excel",
      "dx.q5.c4": "Pagos a proveedores se coordinan por WhatsApp",
      "dx.q5.c5": "No hay forma fácil de saber quién nos debe dinero",
      "dx.q5.c6": "Ya todo está en un sistema automatizado",
      "dx.q5.ph": "Cada punto donde se escribe un número, se negocia un precio, o se procesa un pago — y cuánto de eso es manual vs. automático...",

      "dx.q6.text": "¿Qué sistemas, software o herramientas ya tiene tu negocio — aunque no los uses bien o estén desactualizados?",
      "dx.q6.c1": "Cuadernos o papel",
      "dx.q6.c2": "WhatsApp para coordinar trabajo",
      "dx.q6.c3": "Excel o Google Sheets",
      "dx.q6.c4": "Redes sociales para vender",
      "dx.q6.c5": "Software de contabilidad",
      "dx.q6.c6": "Sistema de punto de venta / POS",
      "dx.q6.c7": "CRM o sistema de ventas",
      "dx.q6.c8": "Sistema de inventario",
      "dx.q6.c9": "Software de reservas o citas",
      "dx.q6.c10": "Sitio web con formulario de contacto",
      "dx.q6.c11": "Sistema que pagamos pero no usamos",
      "dx.q6.c12": "Varios sistemas que sí se conectan entre sí",
      "dx.q6.ph": "Tu tecnología actual, honestamente — qué usas, qué quisieras usar, qué pagas sin aprovechar, y qué tan bien se conecta todo. Incluye nombres específicos si los recuerdas...",

      "dx.q7.text": "Cuando necesitas tomar una decisión importante sobre tu negocio, ¿de dónde sacas la información?",
      "dx.q7.c1": "Intuición y experiencia",
      "dx.q7.c2": "Le pregunto a mi equipo o mi contador",
      "dx.q7.c3": "Reviso hojas de cálculo o registros",
      "dx.q7.c4": "Tengo reportes que consulto regularmente",
      "dx.q7.c5": "Tengo dashboards con datos en tiempo real",
      "dx.q7.ph": "Los momentos donde tu equipo trabaja con información diferente — o sin información. Las decisiones que tomas a ciegas...",

      "dx.q8.text": "¿Con qué frecuencia pierdes clientes o ventas por no responder a tiempo, no dar seguimiento, o no tener la información lista?",
      "dx.q8.c1": "Casi nunca — lo tenemos bajo control",
      "dx.q8.c2": "Rara vez",
      "dx.q8.c3": "A veces",
      "dx.q8.c4": "Con frecuencia",
      "dx.q8.c5": "No sé — no tenemos forma de medirlo",
      "dx.q8.ph": "Piensa en las ventas que se cayeron, los clientes que dejaron de escribir, las oportunidades que no pudiste aprovechar — y por qué...",

      "dx.q9.text": "Si mañana tuvieras el doble de clientes, ¿qué pasaría con tu operación?",
      "dx.q9.c1": "Colapsaríamos — no hay forma",
      "dx.q9.c2": "Tendríamos que contratar mucha gente rápido",
      "dx.q9.c3": "Lo podríamos manejar con algo de esfuerzo extra",
      "dx.q9.c4": "Estamos preparados para crecer",
      "dx.q9.ph": "¿Qué se rompería primero — la atención al cliente, la logística, la capacidad de tu equipo? ¿Y qué tendrías que hacer para no colapsar?",

      "dx.q10.text": "De todo lo que hace tu equipo, ¿qué podría hacer un sistema confiable y rápido sin necesitar el criterio de una persona?",
      "dx.q10.c1": "Responder preguntas frecuentes de clientes",
      "dx.q10.c2": "Agendar citas o reservaciones",
      "dx.q10.c3": "Enviar recordatorios y seguimientos",
      "dx.q10.c4": "Generar cotizaciones estándar",
      "dx.q10.c5": "Actualizar inventario automáticamente",
      "dx.q10.c6": "Organizar y asignar tareas al equipo",
      "dx.q10.c7": "Nada — todo requiere a una persona",
      "dx.q10.ph": "Piensa en las tareas que son puramente mecánicas vs. las que necesitan experiencia, intuición o habilidad para relacionarse con personas...",

      "dx.q11.text": "¿Cuál es el problema más grande que afecta la rentabilidad de tu negocio hoy — y si ese problema desapareciera mañana, qué haría posible?",
      "dx.q11.ph": "Lo que más te frena — en tiempo, dinero, o oportunidades perdidas. Y lo que harías con esa libertad si el problema dejara de existir...",

      // ---- RESULTS: VALUE STREAMS ----
      "res.stream.customerFlow": "Flujo de Clientes",
      "res.stream.operationsFlow": "Flujo de Operaciones",
      "res.stream.informationFlow": "Flujo de Información",
      "res.stream.growthFlow": "Flujo de Crecimiento",
      "res.stream.customerFlow.low": "Tu equipo dedica demasiado tiempo a consultas repetitivas que un sistema podría resolver.",
      "res.stream.customerFlow.high": "Buen manejo de la interacción con clientes.",
      "res.stream.operationsFlow.low": "Procesos manuales están consumiendo horas que podrían automatizarse.",
      "res.stream.operationsFlow.high": "Operaciones bien estructuradas.",
      "res.stream.informationFlow.low": "Decisiones basadas en instinto en vez de datos — oportunidad de mejora.",
      "res.stream.informationFlow.high": "Buen flujo de información para la toma de decisiones.",
      "res.stream.growthFlow.low": "La operación actual limita tu capacidad de crecer sin colapsar.",
      "res.stream.growthFlow.high": "Buena preparación para escalar.",

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
      "ops.calc.save": "Guardar cálculo",
      "ops.calc.copy": "Copiar Resumen",
      "ops.calc.copyWA": "Copiar resumen para WhatsApp",
      "ops.calc.pdf": "Generar Propuesta PDF",
      "ops.calc.pdfSoon": "Generar PDF (próximamente)",
      "ops.calc.saved": "Guardado ✓",
      "ops.calc.copied": "Copiado ✓",
      "ops.calc.months": "meses",
      "ops.calc.perMonth": "/mes",
      "ops.calc.savingsPerMonth": "en ahorros",
      "ops.calc.formula": "× tasa de captura",

      // Calculator: section dividers
      "ops.calc.sec.client": "DATOS DEL CLIENTE",
      "ops.calc.sec.operations": "OPERACIONES ACTUALES",
      "ops.calc.sec.tech": "HERRAMIENTAS Y TECNOLOGÍA",
      "ops.calc.sec.pricing": "PARÁMETROS DE PRECIO",
      "ops.calc.leadHint": "Selecciona un lead para auto-rellenar los campos",

      // Calculator: result card headers
      "ops.calc.card.score": "PUNTUACIÓN DEL PROSPECTO",
      "ops.calc.card.savings": "AHORRO PARA EL CLIENTE",
      "ops.calc.card.pricing": "PRECIO RECOMENDADO",
      "ops.calc.card.compare": "COMPARACIÓN",

      // Calculator: dimension labels
      "ops.calc.dim.customerInteraction": "Interacción con clientes",
      "ops.calc.dim.processMaturity": "Madurez de procesos",
      "ops.calc.dim.digitalPresence": "Presencia digital",
      "ops.calc.dim.dataUtilization": "Uso de datos",
      "ops.calc.dim.aiReadiness": "Preparación IA",

      // Calculator: level labels
      "ops.calc.level.critical": "Crítico",
      "ops.calc.level.developing": "En Desarrollo",
      "ops.calc.level.competent": "Competente",
      "ops.calc.level.advanced": "Avanzado",

      // Calculator: solution names
      "ops.calc.sol.bot": "Bot WhatsApp",
      "ops.calc.sol.botDesc": "hrs/sem automatizadas",
      "ops.calc.sol.web": "Website + Chat",
      "ops.calc.sol.webDesc": "Presencia digital 24/7",
      "ops.calc.sol.auto": "Automatización",
      "ops.calc.sol.autoDesc": "hrs de trabajo manual eliminado",
      "ops.calc.sol.total": "AHORRO MENSUAL TOTAL",

      // Calculator: pricing stats
      "ops.calc.stat.recovery": "Recuperación",
      "ops.calc.stat.roi12": "ROI 12 meses",
      "ops.calc.stat.clientKeeps": "Cliente conserva",

      // Calculator: comparison
      "ops.calc.comp.invest": "Inversión",
      "ops.calc.comp.value12": "Valor a 12 meses",
      "ops.calc.comp.ratio": "Por cada $1 invertido, el cliente recibe",

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

      // Lead detail panel
      "ops.detail.tab.summary": "Resumen",
      "ops.detail.tab.answers": "Respuestas",
      "ops.detail.tab.actions": "Acciones",

      "ops.detail.sec.contact": "// Información de contacto",
      "ops.detail.sec.score": "// Puntuación",
      "ops.detail.sec.pipeline": "// Pipeline",
      "ops.detail.sec.notes": "// Notas",
      "ops.detail.sec.activity": "// Actividad",
      "ops.detail.sec.stages": "// Cambiar etapa",

      "ops.detail.field.firstName": "Nombre",
      "ops.detail.field.lastName": "Apellido",
      "ops.detail.field.email": "Email",
      "ops.detail.field.phone": "Teléfono",
      "ops.detail.field.company": "Empresa",
      "ops.detail.field.position": "Cargo",
      "ops.detail.field.industry": "Industria",
      "ops.detail.field.companySize": "Tamaño empresa",
      "ops.detail.field.website": "Sitio web",
      "ops.detail.field.linkedin": "LinkedIn",
      "ops.detail.field.revenue": "Ingresos",
      "ops.detail.field.priority": "Prioridad",
      "ops.detail.field.dealValue": "Valor del deal",
      "ops.detail.field.daysInStage": "Días en etapa",

      "ops.detail.btn.calcPrice": "Calcular precio →",
      "ops.detail.btn.aiProposal": "Generar propuesta IA →",
      "ops.detail.btn.scraper": "Ejecutar scraper →",
      "ops.detail.btn.downloadPdf": "Descargar PDF del diagnóstico",
      "ops.detail.btn.copyAnswers": "Copiar respuestas",

      "ops.detail.noAnswers": "Sin respuestas del diagnóstico.",
      "ops.detail.noActivity": "Sin actividad registrada.",
      "ops.detail.notesSaved": "Notas guardadas ✓",

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
      "diag.c1": "11 questions",
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

      // ---- DIAGNOSTIC v3: QUESTIONS ----
      "dx.encourage": "✦ The more you share, the more precise your diagnostic.",
      "dx.fastpath": "Or quickly select:",
      "dx.depthpath": "Want to add more detail?",

      "dx.q1.text": "How do your customers find you and how do they contact you for the first time?",
      "dx.q1.ph": "For example: they find us on Instagram, message us on WhatsApp, come through word of mouth, call us on the phone... tell us the typical path from someone learning about your business to reaching out for the first time.",
      "dx.q1.c1": "WhatsApp",
      "dx.q1.c2": "Phone call",
      "dx.q1.c3": "Walk-in visit",
      "dx.q1.c4": "Social media (Instagram, Facebook)",
      "dx.q1.c5": "Website",
      "dx.q1.c6": "Google / internet search",
      "dx.q1.c7": "Referral / word of mouth",
      "dx.q1.c8": "Email",

      "dx.q2.text": "What tasks take up the most time for your team every week — the repetitive work that never feels done?",
      "dx.q2.ph": "For example: answering the same questions on WhatsApp, confirming appointments, updating inventory, creating quotes, moving data from one place to another... If you can, estimate how many hours per week go into each one.",
      "dx.q2.c1": "Answering the same questions on WhatsApp",
      "dx.q2.c2": "Scheduling or confirming appointments",
      "dx.q2.c3": "Following up with clients who didn't reply",
      "dx.q2.c4": "Updating inventory or stock",
      "dx.q2.c5": "Creating invoices or quotes",
      "dx.q2.c6": "Moving data between systems",
      "dx.q2.c7": "Creating reports",
      "dx.q2.c8": "Coordinating deliveries or logistics",
      "dx.q2.sliderLabel": "Estimate: how many hours per week does your team lose to these tasks?",

      "dx.q3.text": "When a customer messages or calls you — who responds, through what channel, and how long does it take?",
      "dx.q3.ph": "Tell us who handles responding, if it's always the same person, what happens when no one's available, if messages get lost, and if anyone covers nights or weekends.",
      "dx.q3.c1": "We respond in under 5 minutes",
      "dx.q3.c2": "We respond in under 1 hour",
      "dx.q3.c3": "Sometimes it takes a few hours",
      "dx.q3.c4": "We usually respond the next day",
      "dx.q3.c5": "Honestly, sometimes messages slip through",

      "dx.q4.text": "From the moment a customer places an order or requests a service until it's completed — how does that process work step by step?",
      "dx.q4.ph": "Describe the journey: who receives the order, how it moves to the next step, what systems or tools are used, where it gets stuck or delayed, and how long the full cycle normally takes.",
      "dx.q4.c1": "One person does everything, from memory or on paper",
      "dx.q4.c2": "Multiple people, coordinated via WhatsApp or calls",
      "dx.q4.c3": "Multiple people, with Excel or shared sheets",
      "dx.q4.c4": "We have a system or software that organizes the flow",

      "dx.transition.text": "Thanks — now some specific questions to calculate your score.",
      "dx.transition.continue": "Continue &rarr;",

      "dx.q5.text": "In your business, which of these money processes are still done by hand?",
      "dx.q5.c1": "Quotes done in Word, paper, or WhatsApp",
      "dx.q5.c2": "Invoices created manually",
      "dx.q5.c3": "Collections tracked in notebook or Excel",
      "dx.q5.c4": "Supplier payments coordinated via WhatsApp",
      "dx.q5.c5": "No easy way to know who owes us money",
      "dx.q5.c6": "Everything is already in an automated system",
      "dx.q5.ph": "Every point where a number gets typed, a price gets negotiated, or a payment gets processed — and how much is manual vs. automatic...",

      "dx.q6.text": "What systems, software, or tools does your business already have — even if you don't use them well or they're outdated?",
      "dx.q6.c1": "Notebooks or paper",
      "dx.q6.c2": "WhatsApp for work coordination",
      "dx.q6.c3": "Excel or Google Sheets",
      "dx.q6.c4": "Social media for selling",
      "dx.q6.c5": "Accounting software",
      "dx.q6.c6": "Point of sale / POS",
      "dx.q6.c7": "CRM or sales system",
      "dx.q6.c8": "Inventory system",
      "dx.q6.c9": "Booking or appointment software",
      "dx.q6.c10": "Website with contact form",
      "dx.q6.c11": "System we pay for but don't use",
      "dx.q6.c12": "Multiple systems that connect to each other",
      "dx.q6.ph": "Your current tech, honestly — what you use, what you wish you used, what you pay for without using, and how well it all connects. Include specific names if you remember them...",

      "dx.q7.text": "When you need to make an important business decision, where do you get the information?",
      "dx.q7.c1": "Gut feeling and experience",
      "dx.q7.c2": "I ask my team or my accountant",
      "dx.q7.c3": "I check spreadsheets or records",
      "dx.q7.c4": "I have reports I check regularly",
      "dx.q7.c5": "I have dashboards with real-time data",
      "dx.q7.ph": "The moments where your team works with different information — or no information. The decisions you make blind...",

      "dx.q8.text": "How often do you lose customers or sales because of slow responses, missed follow-ups, or not having information ready?",
      "dx.q8.c1": "Almost never — we have it under control",
      "dx.q8.c2": "Rarely",
      "dx.q8.c3": "Sometimes",
      "dx.q8.c4": "Often",
      "dx.q8.c5": "I don't know — we have no way to measure it",
      "dx.q8.ph": "Think about the sales that fell through, the clients who stopped responding, the opportunities you couldn't take advantage of — and why...",

      "dx.q9.text": "If you had twice as many customers tomorrow, what would happen to your operation?",
      "dx.q9.c1": "We'd collapse — no way",
      "dx.q9.c2": "We'd have to hire a lot of people fast",
      "dx.q9.c3": "We could handle it with some extra effort",
      "dx.q9.c4": "We're prepared to grow",
      "dx.q9.ph": "What would break first — customer service, logistics, your team's capacity? And what would you have to do to keep from collapsing?",

      "dx.q10.text": "Of everything your team does, what could a reliable, fast system handle without needing human judgment?",
      "dx.q10.c1": "Answering common customer questions",
      "dx.q10.c2": "Scheduling appointments or reservations",
      "dx.q10.c3": "Sending reminders and follow-ups",
      "dx.q10.c4": "Generating standard quotes",
      "dx.q10.c5": "Updating inventory automatically",
      "dx.q10.c6": "Organizing and assigning tasks to the team",
      "dx.q10.c7": "Nothing — everything requires a person",
      "dx.q10.ph": "Think about the tasks that are purely mechanical vs. the ones that need experience, intuition, or people skills...",

      "dx.q11.text": "What is the single biggest problem affecting your business's profitability today — and if that problem disappeared tomorrow, what would it make possible?",
      "dx.q11.ph": "What holds you back the most — in time, money, or missed opportunities. And what you'd do with that freedom if the problem stopped existing...",

      // ---- RESULTS: VALUE STREAMS ----
      "res.stream.customerFlow": "Customer Flow",
      "res.stream.operationsFlow": "Operations Flow",
      "res.stream.informationFlow": "Information Flow",
      "res.stream.growthFlow": "Growth Flow",
      "res.stream.customerFlow.low": "Your team spends too much time on repetitive inquiries that a system could handle.",
      "res.stream.customerFlow.high": "Good customer interaction management.",
      "res.stream.operationsFlow.low": "Manual processes are consuming hours that could be automated.",
      "res.stream.operationsFlow.high": "Well-structured operations.",
      "res.stream.informationFlow.low": "Decisions based on gut feeling instead of data — room for improvement.",
      "res.stream.informationFlow.high": "Good information flow for decision-making.",
      "res.stream.growthFlow.low": "The current operation limits your ability to grow without collapsing.",
      "res.stream.growthFlow.high": "Good preparation for scaling.",

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
      "ops.calc.save": "Save calculation",
      "ops.calc.copy": "Copy Summary",
      "ops.calc.copyWA": "Copy summary for WhatsApp",
      "ops.calc.pdf": "Generate Proposal PDF",
      "ops.calc.pdfSoon": "Generate PDF (coming soon)",
      "ops.calc.saved": "Saved ✓",
      "ops.calc.copied": "Copied ✓",
      "ops.calc.months": "months",
      "ops.calc.perMonth": "/mo",
      "ops.calc.savingsPerMonth": "in savings",
      "ops.calc.formula": "× capture rate",

      "ops.calc.sec.client": "CLIENT DATA",
      "ops.calc.sec.operations": "CURRENT OPERATIONS",
      "ops.calc.sec.tech": "TOOLS & TECHNOLOGY",
      "ops.calc.sec.pricing": "PRICING PARAMETERS",
      "ops.calc.leadHint": "Select a lead to auto-fill fields",

      "ops.calc.card.score": "PROSPECT SCORE",
      "ops.calc.card.savings": "CLIENT SAVINGS",
      "ops.calc.card.pricing": "RECOMMENDED PRICE",
      "ops.calc.card.compare": "COMPARISON",

      "ops.calc.dim.customerInteraction": "Customer interaction",
      "ops.calc.dim.processMaturity": "Process maturity",
      "ops.calc.dim.digitalPresence": "Digital presence",
      "ops.calc.dim.dataUtilization": "Data utilization",
      "ops.calc.dim.aiReadiness": "AI readiness",

      "ops.calc.level.critical": "Critical",
      "ops.calc.level.developing": "Developing",
      "ops.calc.level.competent": "Competent",
      "ops.calc.level.advanced": "Advanced",

      "ops.calc.sol.bot": "WhatsApp Bot",
      "ops.calc.sol.botDesc": "hrs/wk automated",
      "ops.calc.sol.web": "Website + Chat",
      "ops.calc.sol.webDesc": "24/7 digital presence",
      "ops.calc.sol.auto": "Automation",
      "ops.calc.sol.autoDesc": "hrs of manual work eliminated",
      "ops.calc.sol.total": "TOTAL MONTHLY SAVINGS",

      "ops.calc.stat.recovery": "Recovery",
      "ops.calc.stat.roi12": "12-month ROI",
      "ops.calc.stat.clientKeeps": "Client keeps",

      "ops.calc.comp.invest": "Investment",
      "ops.calc.comp.value12": "12-month value",
      "ops.calc.comp.ratio": "For every $1 invested, the client receives",

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

      // Lead detail panel
      "ops.detail.tab.summary": "Summary",
      "ops.detail.tab.answers": "Answers",
      "ops.detail.tab.actions": "Actions",

      "ops.detail.sec.contact": "// Contact info",
      "ops.detail.sec.score": "// Score",
      "ops.detail.sec.pipeline": "// Pipeline",
      "ops.detail.sec.notes": "// Notes",
      "ops.detail.sec.activity": "// Activity",
      "ops.detail.sec.stages": "// Change stage",

      "ops.detail.field.firstName": "First name",
      "ops.detail.field.lastName": "Last name",
      "ops.detail.field.email": "Email",
      "ops.detail.field.phone": "Phone",
      "ops.detail.field.company": "Company",
      "ops.detail.field.position": "Position",
      "ops.detail.field.industry": "Industry",
      "ops.detail.field.companySize": "Company size",
      "ops.detail.field.website": "Website",
      "ops.detail.field.linkedin": "LinkedIn",
      "ops.detail.field.revenue": "Revenue",
      "ops.detail.field.priority": "Priority",
      "ops.detail.field.dealValue": "Deal value",
      "ops.detail.field.daysInStage": "Days in stage",

      "ops.detail.btn.calcPrice": "Calculate price →",
      "ops.detail.btn.aiProposal": "Generate AI proposal →",
      "ops.detail.btn.scraper": "Run scraper →",
      "ops.detail.btn.downloadPdf": "Download diagnostic PDF",
      "ops.detail.btn.copyAnswers": "Copy answers",

      "ops.detail.noAnswers": "No diagnostic answers.",
      "ops.detail.noActivity": "No activity recorded.",
      "ops.detail.notesSaved": "Notes saved ✓",

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
