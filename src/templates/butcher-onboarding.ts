// Butcher onboarding email + SMS sequence
// GTM Strategist deliverable — Week 5
// These templates are used by Supabase Edge Functions or an external email service.

export const BUTCHER_SMS_SEQUENCE = {
  // Sent after butcher creates an account
  welcome: {
    en: `Welcome to Carnicería Ranker! Shoppers in your area are looking for the best meat prices. Claim your shop to start posting prices for free. Get started: {{claim_link}}`,
    es: `¡Bienvenido a Carnicería Ranker! Compradores en tu área buscan los mejores precios de carne. Reclama tu tienda para empezar a publicar precios gratis. Comienza: {{claim_link}}`,
  },

  // Sent 24h after signup if shop not yet claimed
  reminder_claim: {
    en: `Hey {{name}}! You signed up for Carnicería Ranker but haven't claimed your shop yet. It takes 2 minutes and it's free for 3 months. Claim now: {{claim_link}}`,
    es: `¡Hola {{name}}! Te registraste en Carnicería Ranker pero no has reclamado tu tienda. Toma 2 minutos y es gratis por 3 meses. Reclama ahora: {{claim_link}}`,
  },

  // Sent after shop is claimed + verified
  verified: {
    en: `Your shop "{{shop_name}}" is now verified on Carnicería Ranker! Upload your prices so shoppers can find you. Upload here: {{upload_link}}`,
    es: `¡Tu tienda "{{shop_name}}" está verificada en Carnicería Ranker! Sube tus precios para que los compradores te encuentren. Sube aquí: {{upload_link}}`,
  },

  // Sent 3 days after verification if no prices uploaded
  reminder_prices: {
    en: `{{name}}, shoppers near {{shop_name}} are searching for meat prices right now. You haven't uploaded any yet — it takes 1 minute. {{upload_link}}`,
    es: `{{name}}, compradores cerca de {{shop_name}} están buscando precios de carne ahora mismo. No has subido ninguno — toma 1 minuto. {{upload_link}}`,
  },

  // Sent weekly if prices are stale (>7 days)
  stale_prices: {
    en: `Your prices on Carnicería Ranker are {{days}} days old. Update them so shoppers know your latest deals. Quick update: {{upload_link}}`,
    es: `Tus precios en Carnicería Ranker tienen {{days}} días. Actualízalos para que los compradores vean tus ofertas recientes. Actualizar: {{upload_link}}`,
  },
};

export const BUTCHER_EMAIL_SEQUENCE = {
  // Day 0: Welcome email after signup
  welcome: {
    subject: {
      en: 'Welcome to Carnicería Ranker — claim your free shop listing',
      es: 'Bienvenido a Carnicería Ranker — reclama tu listado gratis',
    },
    body: {
      en: `Hi {{name}},

Thanks for joining Carnicería Ranker — the app that helps shoppers find the best meat prices near them.

Here's how it works for you as a shop owner:

1. **Claim your shop** — verify you're the owner with a quick phone check
2. **Upload your prices** — takes about 1 minute, no tech skills needed
3. **Get new customers** — shoppers searching for meat cuts within 5 miles will see your shop

It's completely free for the first 3 months. No credit card needed.

→ Claim your shop now: {{claim_link}}

Questions? Reply to this email — a real person reads every message.

— The Carnicería Ranker Team`,
      es: `Hola {{name}},

Gracias por unirte a Carnicería Ranker — la app que ayuda a compradores a encontrar los mejores precios de carne cerca de ellos.

Así funciona para ti como dueño de tienda:

1. **Reclama tu tienda** — verifica que eres el dueño con una llamada rápida
2. **Sube tus precios** — toma como 1 minuto, no necesitas saber de tecnología
3. **Consigue nuevos clientes** — compradores buscando cortes de carne dentro de 5 millas verán tu tienda

Es completamente gratis por los primeros 3 meses. No necesitas tarjeta.

→ Reclama tu tienda ahora: {{claim_link}}

¿Preguntas? Responde a este correo — una persona real lee cada mensaje.

— El Equipo de Carnicería Ranker`,
    },
  },

  // Day 7: Weekly performance report
  weekly_report: {
    subject: {
      en: '{{shop_name}} — your weekly stats on Carnicería Ranker',
      es: '{{shop_name}} — tus estadísticas semanales en Carnicería Ranker',
    },
    body: {
      en: `Hi {{name}},

Here's how {{shop_name}} did this week on Carnicería Ranker:

• **{{views}} shoppers** viewed your prices
• **{{searches}} searches** included your shop in results
• Your top cut: **{{top_cut}}** at ${{top_price}}/lb
• Your score: **{{score_grade}}** (Price: {{price_score}} | Quality: {{quality_score}} | Consistency: {{consistency_score}})

{{#if stale_prices}}
⚠️ Some of your prices are {{stale_days}} days old. Update them to stay competitive.
→ Update prices: {{upload_link}}
{{/if}}

Keep your prices fresh and your score goes up. Simple.

— Carnicería Ranker`,
      es: `Hola {{name}},

Así le fue a {{shop_name}} esta semana en Carnicería Ranker:

• **{{views}} compradores** vieron tus precios
• **{{searches}} búsquedas** incluyeron tu tienda
• Tu corte más buscado: **{{top_cut}}** a ${{top_price}}/lb
• Tu puntuación: **{{score_grade}}** (Precio: {{price_score}} | Calidad: {{quality_score}} | Consistencia: {{consistency_score}})

{{#if stale_prices}}
⚠️ Algunos de tus precios tienen {{stale_days}} días. Actualízalos para mantenerte competitivo.
→ Actualizar precios: {{upload_link}}
{{/if}}

Mantén tus precios al día y tu puntuación sube. Así de simple.

— Carnicería Ranker`,
    },
  },

  // Day 75: Paid tier conversion email (free trial ends at 90 days)
  paid_tier_preview: {
    subject: {
      en: 'Your free trial ends in 15 days — here\'s what you keep',
      es: 'Tu prueba gratis termina en 15 días — esto es lo que conservas',
    },
    body: {
      en: `Hi {{name}},

Your free 3-month trial on Carnicería Ranker ends on {{end_date}}.

Here's what happens:

**Free (after trial):**
• Your shop stays listed
• Shoppers can still see your last uploaded prices
• You keep your reviews and score

**Pro ($19/month):**
• Upload prices anytime (free tier: read-only after trial)
• Priority placement in search results
• Weekly performance reports with shopper trends
• "Verified Pro" badge on your listing
• Early access to price alerts (notify shoppers of deals)

→ Upgrade to Pro: {{upgrade_link}}

You've had {{total_views}} shoppers view your prices in the last 3 months. That's {{total_views}} people who might have walked into your shop because of this app.

— Carnicería Ranker`,
      es: `Hola {{name}},

Tu prueba gratis de 3 meses en Carnicería Ranker termina el {{end_date}}.

Esto es lo que pasa:

**Gratis (después de la prueba):**
• Tu tienda sigue listada
• Los compradores pueden ver tus últimos precios
• Conservas tus reseñas y puntuación

**Pro ($19/mes):**
• Sube precios cuando quieras (gratis: solo lectura después de la prueba)
• Posición prioritaria en resultados de búsqueda
• Reportes semanales con tendencias de compradores
• Insignia "Pro Verificado" en tu listado
• Acceso anticipado a alertas de precio (notifica compradores de ofertas)

→ Actualizar a Pro: {{upgrade_link}}

{{total_views}} compradores vieron tus precios en los últimos 3 meses. Son {{total_views}} personas que pudieron haber entrado a tu tienda gracias a esta app.

— Carnicería Ranker`,
    },
  },
};

// Sequence timing
export const ONBOARDING_TIMELINE = [
  { trigger: 'signup', delay: '0',   channel: 'sms', template: 'welcome' },
  { trigger: 'signup', delay: '0',   channel: 'email', template: 'welcome' },
  { trigger: 'signup', delay: '24h', channel: 'sms', template: 'reminder_claim', condition: 'shop_not_claimed' },
  { trigger: 'shop_verified', delay: '0', channel: 'sms', template: 'verified' },
  { trigger: 'shop_verified', delay: '72h', channel: 'sms', template: 'reminder_prices', condition: 'no_prices_uploaded' },
  { trigger: 'weekly', delay: '7d', channel: 'email', template: 'weekly_report', condition: 'has_claimed_shop' },
  { trigger: 'prices_stale', delay: '7d', channel: 'sms', template: 'stale_prices' },
  { trigger: 'trial_day_75', delay: '0', channel: 'email', template: 'paid_tier_preview' },
];
