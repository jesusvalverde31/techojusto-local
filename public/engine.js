'use strict';
(function (root, factory) { root.TechoEngine = factory(); })(globalThis, function () {
  const moneyKeys = ['alquilerMensualCent','comunidadMensualCent','suministrosMensualesCent','internetMensualCent','seguroMensualCent','transporteMensualCent','otrosMensualesCent'];
  const round = value => Math.floor(value + .5), clamp = value => Math.max(0, Math.min(100, value));
  function totalMensual(v){ return moneyKeys.reduce((sum,key)=>sum+v[key],0); }
  function calcular(h,v){ const total=totalMensual(v), esfuerzo=round(total*10000/h.ingresosMensualesDeclaradosCent), coste=esfuerzo<=h.maxEsfuerzoBp?100:clamp(round(h.maxEsfuerzoBp*100/esfuerzo)), superficie=clamp(round(v.superficieM2*100/h.minSuperficieM2)), dormitorios=h.minDormitorios===0?100:clamp(round(v.dormitorios*100/h.minDormitorios)), espacio=round((superficie+dormitorios)/2), movilidad=v.desplazamientoDiaMin<=h.maxDesplazamientoDiaMin?100:h.maxDesplazamientoDiaMin===0?0:clamp(round(h.maxDesplazamientoDiaMin*100/v.desplazamientoDiaMin)), dimensiones={coste,espacio,movilidad,accesibilidad:v.accesibilidad*20,estabilidad:v.estabilidadPercibida*20}, scoreTotal=clamp(round(Object.entries(dimensiones).reduce((s,[k,x])=>s+x*h.prioridades[k],0)/100)); return {costeMensualTotalCent:total,tasaEsfuerzoBp:esfuerzo,limiteMensualCent:round(h.ingresosMensualesDeclaradosCent*h.maxEsfuerzoBp/10000),dimensiones,scoreTotal}; }
  function mismaUnidad(viviendas){return viviendas.length>0&&viviendas.every(v=>v.hogarId===viviendas[0].hogarId);}
  return {moneyKeys,totalMensual,calcular,mismaUnidad};
});
