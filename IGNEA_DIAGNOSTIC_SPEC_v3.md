# IGNEA LABS — DIAGNOSTIC v3 SPECIFICATION (RECONSTRUCTED)

**⚠️ RECONSTRUCTED DOCUMENT.** This spec does not exist as an original artifact anywhere on this machine, in this repo's git history (84 commits checked), or in `~/Downloads`/`~/Documents`/`~/Desktop`. It has been rebuilt from the only surviving evidence of the v3 design: 342 lines of orphaned `dx.q*`/`dx.ind.*` keys in `js/i18n.js`, defined in both Spanish and English but referenced by zero live code paths (the shipped funnel uses a separate, unrelated `intake.*` key namespace with 4 questions).

**A source this doc was originally expected to use turned out not to apply.** `~/Desktop/encuesta-diagnostico.jsx` was assumed (per the repo audit) to be the v3 prototype. It is not — it's an unrelated internal employee technology-needs survey for a different business (Grupo Baltodano / Semillas Mejoradas Nicaragua / INA Coffee Holdings), with no industry branching, no client-facing framing, and no structural overlap with the `dx.*` keys. That assumption is retracted here rather than quietly dropped. This document is built from the i18n keys alone.

**What's verbatim vs. inferred, stated plainly:** every question, sub-question, placeholder prompt, and answer-choice option below is **copied directly** from the orphaned i18n strings — nothing paraphrased or invented. What's **inferred** — because the source material doesn't specify it — is: the mapping of each question to a value-stream category, and the industry-branch insertion points (i.e., *that* three industry-specific questions likely followed the base 11, based on their content and the fact each industry's `q1`/`q2`/`q3` numbering restarts, but not their exact position *within* the 11-question sequence). Every inferred section is marked `**[INFERRED]**` inline. Nothing else has been smoothed over to make this read as more complete than the evidence supports.

---

## 1. Overview

- **11 base questions**, asked to every respondent regardless of industry, plus **industry-specific branching** (3 additional questions) for 6 of the 22 industries offered in the current intake dropdown.
- Fully bilingual (ES/EN), same key structure in both languages, 1:1 parity — no missing translations found in either direction.
- Mix of question types inferred from the key suffixes present: `.text` (question prompt), `.ph` (open-text placeholder — implies a free-text field, not exclusively multiple-choice), `.c1`–`.c12` (multiple-choice options), `.sliderLabel` (implies a range/slider input for that question instead of, or alongside, choices). **[INFERRED: exact UI widget per question]** — the key suffixes tell us a text field, choice set, or slider was involved, not which widget rendered which, since no markup for this flow survives.

---

## 2. The 11 base questions

### Q1 — Customer acquisition & first contact
**ES:** ¿Cómo te encuentran tus clientes y cómo te contactan por primera vez?
**EN:** How do your customers find you and how do they contact you for the first time?

*Placeholder (ES):* Por ejemplo: nos buscan en Instagram, nos escriben por WhatsApp, llegan de boca en boca, nos llaman por teléfono... cuéntanos el camino típico desde que alguien se entera de tu negocio hasta que te habla por primera vez.

**Options:** WhatsApp · Llamada telefónica / Phone call · Visita en persona / Walk-in visit · Redes sociales (Instagram, Facebook) / Social media · Sitio web / Website · Google / búsqueda en internet / Google search · Referido / boca en boca / Referral · Email

**[INFERRED] Value stream: Customer Flow.**

### Q2 — Weekly time sinks
**ES:** ¿Qué tareas le quitan más tiempo a tu equipo cada semana — el trabajo repetitivo que nunca se siente terminado?
**EN:** What tasks take up the most time for your team every week — the repetitive work that never feels done?

**Options:** Responder las mismas preguntas por WhatsApp · Agendar o confirmar citas · Dar seguimiento a clientes que no respondieron · Actualizar inventario o stock · Crear facturas o cotizaciones · Pasar datos de un lugar a otro · Hacer reportes · Coordinar entregas o logística

Has an additional `sliderLabel`: "Estimación: ¿cuántas horas por semana pierde tu equipo en estas tareas?" — implies a follow-up numeric estimate after the choice selection.

**[INFERRED] Value stream: Operations Flow.**

### Q3 — Response speed
**ES:** Cuando un cliente te escribe o te llama — ¿quién le responde, por dónde, y cuánto se tarda?

**Options:** Respondemos en menos de 5 minutos · en menos de 1 hora · A veces tardamos unas horas · Usualmente al día siguiente · Honestamente, a veces se nos pasan mensajes

**[INFERRED] Value stream: Customer Flow.**

### Q4 — Order/service fulfillment process
**ES:** Desde que un cliente hace un pedido o solicita un servicio hasta que se completa — ¿cómo funciona ese proceso paso a paso?

**Options:** Una persona hace todo, de memoria o en papel · Varias personas, coordinadas por WhatsApp o llamadas · Varias personas, con Excel o hojas compartidas · Tenemos un sistema o software que organiza el flujo

**[INFERRED] Value stream: Operations Flow.**

### Q5 — Manual money processes
**ES:** En tu negocio, ¿cuáles de estos procesos de dinero todavía se hacen a mano?

**Options:** Cotizaciones en Word/papel/WhatsApp · Facturas a mano · Cobros en cuaderno o Excel · Pagos a proveedores por WhatsApp · No hay forma fácil de saber quién nos debe dinero · Ya todo está automatizado

**[INFERRED] Value stream: Operations Flow / Information Flow (crosses both — money-tracking is also an information-visibility problem).**

### Q6 — Current tools inventory
**ES:** ¿Qué sistemas, software o herramientas ya tiene tu negocio — aunque no los uses bien o estén desactualizados?

**Options (12):** Cuadernos/papel · WhatsApp · Excel/Sheets · Redes sociales para vender · Software de contabilidad · POS · CRM · Sistema de inventario · Software de reservas · Sitio web con formulario · Sistema que pagamos pero no usamos · Varios sistemas que sí se conectan

**[INFERRED] Value stream: diagnostic context question, feeds all four streams rather than belonging to one — this is the widest option set of the 11, consistent with an inventory/baseline question.**

### Q7 — Decision-making information sources
**ES:** Cuando necesitas tomar una decisión importante sobre tu negocio, ¿de dónde sacas la información?

**Options:** Intuición y experiencia · Le pregunto a mi equipo o contador · Reviso hojas de cálculo · Tengo reportes que consulto regularmente · Tengo dashboards en tiempo real

**[INFERRED] Value stream: Information Flow.**

### Q8 — Lost-sales frequency
**ES:** ¿Con qué frecuencia pierdes clientes o ventas por no responder a tiempo, no dar seguimiento, o no tener la información lista?

**Options:** Casi nunca · Rara vez · A veces · Con frecuencia · No sé — no tenemos forma de medirlo

**[INFERRED] Value stream: Customer Flow (outcome measure).**

### Q9 — Growth readiness
**ES:** Si mañana tuvieras el doble de clientes, ¿qué pasaría con tu operación?

**Options:** Colapsaríamos · Tendríamos que contratar mucha gente rápido · Lo podríamos manejar con esfuerzo extra · Estamos preparados para crecer

**[INFERRED] Value stream: Growth Flow.**

### Q10 — Automatable tasks
**ES:** De todo lo que hace tu equipo, ¿qué podría hacer un sistema confiable y rápido sin necesitar el criterio de una persona?

**Options (7):** Responder preguntas frecuentes · Agendar citas · Enviar recordatorios · Generar cotizaciones estándar · Actualizar inventario automáticamente · Organizar/asignar tareas · Nada — todo requiere una persona

**[INFERRED] Value stream: feeds recommendation generation directly rather than a scored stream — this reads as the question the hook-screen opportunity cards are meant to be generated from.**

### Q11 — Single biggest problem (open-ended)
**ES:** ¿Cuál es el problema más grande que afecta la rentabilidad de tu negocio hoy — y si ese problema desapareciera mañana, qué haría posible?

No choice options — placeholder-only, free text. **[INFERRED] Qualitative capstone question, not stream-scored.**

---

## 3. Industry branching (6 of 22 industries)

Confirmed industries with a branch, verbatim from the keys: **restaurant, medical, legal, logistics, construction, retail.**

**Correction to the repo audit:** the audit's finding (§9) listed the branching industries as "construction, legal, medical, restaurant, hotel." There is no `dx.ind.hotel.*` key anywhere in the file — the real sixth branch is **logistics**, not hotel. Verified by extracting every unique `dx.ind.<industry>.` prefix from the file rather than trusting the prior summary.

Each branch follows the same 3-question shape: a tooling-maturity question (single-choice, 4 options from "no system" to "fully integrated"), a multi-select "which of these is still manual" question (6 options), and a slider-based outcome metric specific to that vertical.

| Industry | Q1 (tooling maturity) | Q2 (manual processes, 6 options) | Q3 (slider metric) |
|---|---|---|---|
| Restaurant | Reservation/table system | Kitchen/service processes | % revenue from delivery |
| Medical | Patient booking method | Clinical/admin processes | Patient no-shows/week |
| Legal | Billable-hours tracking | Legal admin processes | Consultation→client conversion % |
| Logistics | Shipment tracking method | Logistics processes | Delivery failures/returns per week |
| Construction | Project timeline management | Field processes | % projects on time & on budget |
| Retail | Inventory management method | Retail processes | % sales digital vs. in-store |

Full option text for all 6 branches is in `js/i18n.js` under `dx.ind.<industry>.q1`–`q3` (both languages) — not duplicated here in full since the table above captures the pattern and the source is one grep away; happy to inline all option text if useful.

**[INFERRED]** Which point in the 11-question sequence the industry branch was inserted at. The audit's driven-flow evidence for the *shipped* 4-question funnel shows industry selection happens during contact/info collection, before the scored questions begin — if v3 followed the same pattern, the branch likely appeared after industry selection and before or interleaved with the 11 base questions. No surviving key or comment specifies this.

---

## 4. Scoring model — inferred mapping onto the live 4-stream system

**No scoring rubric, point values, or stream-tagging survives in the orphaned keys.** The only scoring model that exists anywhere in this codebase is the shipped 4-question flow's model (`js/scoring.js`, mirrored in `js/ops-dashboard.js:calculateScores()`): four 0–25 streams — **Customer Flow, Operations Flow, Information Flow, Growth Flow** — summing to a 0–100 total, with level bands critical (≤25) / developing (≤50) / competent (≤75) / advanced (>75).

The stream assignments in §2 above are **my inference** that v3's designers used this same terminology, since it's the only named scoring vocabulary anywhere in the system and the question content maps onto it plausibly. There is no evidence of what point deductions or additions each answer choice would have carried — unlike the shipped model's `scoring.js`, which has explicit point math, nothing like that survives for the 11-question version. Treat the stream labels above as a content-categorization aid for anyone designing new scoring, not a recovered rubric.

---

## 5. Ferretería fit — proposal only, per your sprint scope (build nothing)

Confirmed via the shipped intake dropdown and the v3 branch list: **no ferretería/hardware-retail option exists in either the current 4-question flow or the v3 11-question design.** The closest fits — "retail" (Comercio / retail) and "construction" — both exist as branches, but neither's question set touches the three things that are a ferretería's actual daily pain, per the original audit's own finding: **inventario** (stock accuracy), **cotizaciones** (quoting), and **crédito/fiado** (customer credit accounts). `diagnostic.js:335` currently only surfaces an inventory-management opportunity card as generic filler when fewer than 3 real opportunities were derived — never because a prospect actually said so.

What a `dx.ind.ferreteria` cluster would need, modeled on the existing 6-branch pattern (tooling-maturity Q1, manual-processes Q2, slider-metric Q3):

- **Q1 (tooling maturity):** how inventory/stock is currently tracked — spans "no system, just memory" → "POS with basic stock counts" → "full inventory management system with reorder alerts." This is the single highest-value question for the vertical; retail's existing Q1 ("¿Cómo manejan el inventario?") is close but framed for general retail, not hardware-specific SKUs/bulk materials.
- **Q2 (manual processes, 6 options):** should include price-list/cotización creation, supplier purchase-order coordination, credit-account (fiado) tracking, delivery coordination for bulky materials, price-checking for commodity items (cement, rebar) that fluctuate, and counter-staff product-lookup time — none of which the existing retail or construction branches cover directly.
- **Q3 (slider metric):** candidates include % of sales on credit/fiado (directly ties to cash-flow risk, a real business-health signal), or weekly hours spent on manual price-checking/quoting.

This is a proposal only, matching your sprint scope — no code changes, no new i18n keys added, no changes to `diagnostic.js`'s industry dropdown or scoring. The orphaned `dx.ind.*`/`dx.q*` lines remain in `i18n.js`, untouched, per the sprint instruction to leave them until this spec is confirmed accurate.
