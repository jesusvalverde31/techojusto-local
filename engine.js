'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TechoEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const moneyKeys = ['alquilerMensualCent', 'comunidadMensualCent', 'suministrosMensualesCent', 'internetMensualCent', 'seguroMensualCent', 'transporteMensualCent', 'otrosMensualesCent'];
  const round = value => Math.floor(value + 0.5);
  const clamp = value => Math.max(0, Math.min(100, value));
  function totalMensual(vivienda) { return moneyKeys.reduce((sum, key) => sum + vivienda[key], 0); }
  function tasaEsfuerzo(hogar, vivienda) { if (!hogar.ingresosMensualesDeclaradosCent) throw new Error('Los ingresos declarados deben ser mayores que cero.'); return round(totalMensual(vivienda) * 10000 / hogar.ingresosMensualesDeclaradosCent); }
  function calcular(hogar, vivienda) {
    const total = totalMensual(vivienda), esfuerzo = tasaEsfuerzo(hogar, vivienda);
    const coste = esfuerzo <= hogar.maxEsfuerzoBp ? 100 : clamp(round(hogar.maxEsfuerzoBp * 100 / esfuerzo));
    const superficie = clamp(round(vivienda.superficieM2 * 100 / hogar.minSuperficieM2));
    const dormitorios = hogar.minDormitorios === 0 ? 100 : clamp(round(vivienda.dormitorios * 100 / hogar.minDormitorios));
    const espacio = round((superficie + dormitorios) / 2);
    const movilidad = vivienda.desplazamientoDiaMin <= hogar.maxDesplazamientoDiaMin ? 100 : hogar.maxDesplazamientoDiaMin === 0 ? 0 : clamp(round(hogar.maxDesplazamientoDiaMin * 100 / vivienda.desplazamientoDiaMin));
    const dimensiones = { coste, espacio, movilidad, accesibilidad: vivienda.accesibilidad * 20, estabilidad: vivienda.estabilidadPercibida * 20 };
    const scoreTotal = clamp(round(Object.entries(dimensiones).reduce((sum, [key, value]) => sum + value * hogar.prioridades[key], 0) / 100));
    const penalizaciones = [];
    if (coste < 100) penalizaciones.push('El coste supera el esfuerzo máximo elegido.');
    if (espacio < 100) penalizaciones.push('El espacio no alcanza todos los mínimos elegidos.');
    if (movilidad < 100) penalizaciones.push('El desplazamiento supera el máximo elegido.');
    return { costeMensualTotalCent: total, tasaEsfuerzoBp: esfuerzo, limiteMensualCent: round(hogar.ingresosMensualesDeclaradosCent * hogar.maxEsfuerzoBp / 10000), dimensiones, scoreTotal, penalizaciones };
  }
  function alertas(state, now = new Date()) {
    const rank = { critica: 0, alta: 1, media: 2, informativa: 3 }, out = [];
    const add = (codigo, nivel, entidadId, titulo, detalle, accionSugerida = 'Revisa el dato.') => out.push({ codigo, nivel, entidadId, titulo, detalle, accionSugerida });
    for (const vivienda of state.viviendas) {
      const hogar = state.hogares.find(item => item.id === vivienda.hogarId); if (!hogar) continue;
      const calc = calcular(hogar, vivienda);
      if (calc.costeMensualTotalCent >= hogar.ingresosMensualesDeclaradosCent) add('coste_iguala_ingreso', 'critica', vivienda.id, 'El coste alcanza el ingreso', 'El total mensual estimado iguala o supera el ingreso declarado.');
      if (vivienda.costeInicialInformadoCent > hogar.ahorroDisponibleDeclaradoCent) add('inicial_supera_ahorro', 'critica', vivienda.id, 'Coste inicial sobre el ahorro', 'El coste inicial informado supera el ahorro declarado.');
      if (calc.costeMensualTotalCent < hogar.ingresosMensualesDeclaradosCent) {
        if (calc.tasaEsfuerzoBp >= hogar.maxEsfuerzoBp + 1000) add('esfuerzo_alto', 'alta', vivienda.id, 'Esfuerzo muy por encima del límite', 'Supera el límite elegido en al menos 10 puntos porcentuales.');
        else if (calc.tasaEsfuerzoBp > hogar.maxEsfuerzoBp) add('esfuerzo_superado', 'media', vivienda.id, 'Esfuerzo por encima del límite', 'El total mensual supera el porcentaje máximo elegido.');
      }
      if (hogar.maxDesplazamientoDiaMin === 0 ? vivienda.desplazamientoDiaMin > 0 : vivienda.desplazamientoDiaMin > hogar.maxDesplazamientoDiaMin * 2) add('desplazamiento_doble', 'alta', vivienda.id, 'Desplazamiento muy largo', 'Supera el doble del máximo diario elegido.');
      else if (vivienda.desplazamientoDiaMin > hogar.maxDesplazamientoDiaMin) add('desplazamiento_superado', 'media', vivienda.id, 'Desplazamiento por encima del límite', 'Supera el máximo diario elegido.');
      if (hogar.ahorroDisponibleDeclaradoCent > 0 && vivienda.costeInicialInformadoCent <= hogar.ahorroDisponibleDeclaradoCent && vivienda.costeInicialInformadoCent > hogar.ahorroDisponibleDeclaradoCent * .75) add('inicial_75', 'media', vivienda.id, 'Coste inicial elevado', 'Supera el 75 % del ahorro declarado.');
      if (vivienda.estadoShortlist === 'finalista' && !state.visitas.some(v => v.viviendaId === vivienda.id && v.estado === 'realizada')) add('finalista_sin_visita', 'informativa', vivienda.id, 'Finalista sin visita realizada', 'Aún no hay una visita realizada registrada.');
      if (moneyKeys.some(key => vivienda[key] === 0)) add('componente_cero', 'informativa', vivienda.id, 'Hay costes a cero', 'Confirma si esos componentes mensuales son realmente cero.');
      if (Date.parse(vivienda.updatedAt) < now.getTime() - 14 * 86400000 && !['descartada', 'no_disponible'].includes(vivienda.estadoShortlist)) add('sin_actualizar_14d', 'informativa', vivienda.id, 'Dato sin actualizar', 'Confirma si la vivienda sigue disponible.', 'Confirma si sigue disponible.');
    }
    for (const visita of state.visitas) {
      const at = Date.parse(visita.fecha), delta = at - now.getTime();
      if (visita.estado === 'programada' && delta < 0) add('visita_vencida', 'alta', visita.id, 'Visita pendiente con fecha pasada', 'Actualiza la visita como realizada o cancelada.');
      else if (visita.estado === 'programada' && delta <= 48 * 3600000) add('visita_48h', 'media', visita.id, 'Visita próxima', 'La visita está prevista dentro de 48 horas.');
      if (visita.estado === 'realizada' && !visita.nota) add('visita_sin_nota', 'informativa', visita.id, 'Visita sin nota', 'Añade una observación para conservar el contexto.');
    }
    return out.sort((a, b) => rank[a.nivel] - rank[b.nivel] || a.titulo.localeCompare(b.titulo));
  }
  function analytics(state, filters = {}, now = new Date()) {
    const calculations = state.viviendas.map(vivienda => ({ viviendaId: vivienda.id, ...calcular(state.hogares.find(h => h.id === vivienda.hogarId), vivienda) }));
    const alerts = alertas(state, now), q = String(filters.q || '').trim().toLowerCase();
    let items = state.viviendas.filter(v => (!q || `${v.titulo} ${v.zona}`.toLowerCase().includes(q)) && (!filters.modalidad || v.modalidad === filters.modalidad) && (!filters.estado || v.estadoShortlist === filters.estado) && (!filters.alerta || alerts.some(a => a.entidadId === v.id && a.nivel === filters.alerta)));
    const byCalc = id => calculations.find(c => c.viviendaId === id);
    if (filters.maxCosteCent) items = items.filter(v => byCalc(v.id).costeMensualTotalCent <= Number(filters.maxCosteCent));
    if (filters.maxEsfuerzoBp) items = items.filter(v => byCalc(v.id).tasaEsfuerzoBp <= Number(filters.maxEsfuerzoBp));
    if (filters.minDormitorios) items = items.filter(v => v.dormitorios >= Number(filters.minDormitorios));
    const order = filters.orden || 'score'; items.sort((a, b) => order === 'coste' ? byCalc(a.id).costeMensualTotalCent - byCalc(b.id).costeMensualTotalCent : order === 'esfuerzo' ? byCalc(a.id).tasaEsfuerzoBp - byCalc(b.id).tasaEsfuerzoBp : order === 'desplazamiento' ? a.desplazamientoDiaMin - b.desplazamientoDiaMin : order === 'actualizacion' ? b.updatedAt.localeCompare(a.updatedAt) : byCalc(b.id).scoreTotal - byCalc(a.id).scoreTotal);
    const active = state.viviendas.filter(v => !['descartada', 'no_disponible'].includes(v.estadoShortlist)), activeCalcs = active.map(v => byCalc(v.id));
    const upcoming = state.visitas.filter(v => v.estado === 'programada' && Date.parse(v.fecha) >= now.getTime());
    return { calculations, alerts, filteredIds: items.map(v => v.id), kpis: { viviendasActivas: active.length, finalistas: active.filter(v => v.estadoShortlist === 'finalista').length, costeMedioCent: activeCalcs.length ? round(activeCalcs.reduce((sum, c) => sum + c.costeMensualTotalCent, 0) / activeCalcs.length) : 0, visitasProximas: upcoming.length, esfuerzoMinimoBp: activeCalcs.length ? Math.min(...activeCalcs.map(c => c.tasaEsfuerzoBp)) : 0, alertasPrioritarias: new Set(alerts.filter(a => ['critica', 'alta'].includes(a.nivel)).map(a => a.entidadId)).size } };
  }
  function canShortlist(from, to) { return ({ guardada: ['comparando', 'descartada', 'no_disponible'], comparando: ['finalista', 'descartada', 'no_disponible'], finalista: ['comparando', 'descartada', 'no_disponible'] }[from] || []).includes(to); }
  function canVisit(from, to) { return from === 'programada' && ['realizada', 'cancelada'].includes(to); }
  function mismaUnidad(viviendas) { return viviendas.length > 0 && viviendas.every(v => v.hogarId === viviendas[0].hogarId); }
  return { moneyKeys, totalMensual, tasaEsfuerzo, calcular, alertas, analytics, canShortlist, canVisit, mismaUnidad };
});
