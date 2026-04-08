// Weekly performance email template — rendered server-side
// Data comes from get_weekly_performance() RPC

export interface WeeklyPerformanceData {
  shop_name: string;
  owner_name: string;
  total_views: number;
  total_searches: number;
  share_cards_generated: number;
  price_count: number;
  freshness_status: 'fresh' | 'aging' | 'stale';
  avg_rating: number | null;
  week_over_week_views: number;
  top_cut: string | null;
  is_pro: boolean;
}

export function generateWeeklyEmailSubject(data: WeeklyPerformanceData, lang: 'en' | 'es'): string {
  if (lang === 'es') {
    return `📊 ${data.shop_name} — Tu resumen semanal`;
  }
  return `📊 ${data.shop_name} — Your weekly summary`;
}

export function generateWeeklyEmailBody(data: WeeklyPerformanceData, lang: 'en' | 'es'): string {
  const trend = data.week_over_week_views > 0 ? '📈' : data.week_over_week_views < 0 ? '📉' : '➡️';
  const freshColor = data.freshness_status === 'fresh' ? '🟢' : data.freshness_status === 'aging' ? '🟡' : '🔴';

  if (lang === 'es') {
    return `
Hola ${data.owner_name},

Aquí está el resumen de ${data.shop_name} esta semana:

${trend} Vistas: ${data.total_views} (${data.week_over_week_views >= 0 ? '+' : ''}${data.week_over_week_views} vs semana pasada)
🔍 Apariciones en búsqueda: ${data.total_searches}
📤 Tarjetas compartidas: ${data.share_cards_generated}
${freshColor} Frescura de precios: ${data.freshness_status === 'fresh' ? 'Frescos' : data.freshness_status === 'aging' ? 'Envejeciendo' : 'Desactualizados'}
💰 Precios activos: ${data.price_count}
${data.avg_rating ? `⭐ Calificación promedio: ${data.avg_rating.toFixed(1)}` : ''}
${data.top_cut ? `🥩 Corte más buscado: ${data.top_cut}` : ''}

${data.freshness_status === 'stale' ? '⚠️ Tus precios están desactualizados. Actualiza tus precios para mejorar tu ranking.' : ''}
${!data.is_pro ? '\n💎 Actualiza a Pro ($19/mes) para obtener analytics completos y prioridad en búsquedas.' : ''}

— Carnicería Ranker
    `.trim();
  }

  return `
Hi ${data.owner_name},

Here's how ${data.shop_name} did this week:

${trend} Views: ${data.total_views} (${data.week_over_week_views >= 0 ? '+' : ''}${data.week_over_week_views} vs last week)
🔍 Search appearances: ${data.total_searches}
📤 Share cards created: ${data.share_cards_generated}
${freshColor} Price freshness: ${data.freshness_status === 'fresh' ? 'Fresh' : data.freshness_status === 'aging' ? 'Aging' : 'Stale'}
💰 Active prices: ${data.price_count}
${data.avg_rating ? `⭐ Average rating: ${data.avg_rating.toFixed(1)}` : ''}
${data.top_cut ? `🥩 Most searched cut: ${data.top_cut}` : ''}

${data.freshness_status === 'stale' ? '⚠️ Your prices are stale. Update your prices to improve your ranking.' : ''}
${!data.is_pro ? '\n💎 Upgrade to Pro ($19/mo) for full analytics and priority search placement.' : ''}

— Carnicería Ranker
  `.trim();
}
