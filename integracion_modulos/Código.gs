/**
 * PROGUIDE SYSTEMS — Backend Unificado Final + Firebase Automático
 */

const SHEETS = {
  usuarios:          { id: "1G2M5l0JgXvyiBNOEO2ITooU5nzDhNpyR_XIbv0rQKfY", pestaña: "Registro", permisos: "Permisos" },
  pedidos:           { id: "1EbD-YjP9x58nwNwHyt3Wr-Yu_seCoKpAva3dwecQHq0", pestaña: "Pedidos logistica" },
  ordenes_produccion:{ id: "1OzgUlNdvPVwv2vZHnTSzjAwktO7etKnK4mNvL11aMgI", pestaña: "Registro OP" },
  inventario_pt:     { id: "1WX8r-tet8VX99UIfE2aljxtLzdwRrmO73MAd7H8ONPg", pestaña: "Inventario en piso" },
  asignaciones_pt:   { id: "1WX8r-tet8VX99UIfE2aljxtLzdwRrmO73MAd7H8ONPg", pestaña: "Asignaciones PT" },
  novedades:         { id: "1fddddvQG8PAaoO8zMuzp5M5l9YHz9HD-Ri7wAf9gkew", pestaña: "Novedades pedidos" },
  sku:               { id: "1rOU2yfKxE-zAxGgWWfKlT5OPLToYc39Thik2CE87ur0", pestaña: "SKU" },
  empresas:          { id: "1g4j8EbwOC349MFsb9SnscjsWIYpThTGpbNpHRNRM640", pestaña: "Clasificacion empresas" },
  destinatarios:     { id: "1DoSDkBWAD1MAkkGzfliHDPyHQY83MOyKMRn6vd7kzM8", pestaña: "Destinatarios" },
  lineas:            { id: "1I-hJB2IVAIEML4320EKev0UTW6HwfJIyxDYIaWMYL9w", pestaña: "Lineas y maquinas" }
};

const CAMPOS = {
  usuarios: ["Cedula","Nombre","Perfil","Sede","Area","Correo","Contraseña","Estado","Ultimo_ingreso","Empresa"],
  pedidos: ["ID Pedido consecutivo","Pedido","Num Pedido","Empresa","Destinatario","SKU","Descripción SKU","Cantidad Solicitada","Fecha Preferida Entrega","Hora Entrega","Urgencia","Fecha Entrega Planta","Estado Pedido","Prioridad","Programador","Fecha Creación","Observaciones","Ultima edicion","Estado Producción"],
  ordenes_produccion: ["Numero OP","Empresa","Descripción SKU","SKU Referencia","Lote","Cantidad Total Planeada","Cantidad Total Real","Presentación","Unidades Planeadas","Unidad Medida","Fecha Entrega Despacho","Hora Entrega","Fecha Producción","Hora Producción","Código Pedido","Destinatario Cliente","Estado","Línea","Usuario Creador OP","Observaciones de Negociacion planificador"],
  inventario_pt: ["SKU","Lote","Empresa","Descripción SKU","Cantidad Total","Cantidad Disponible","Unidad Medida","Fecha Producción","Ubicación","Estado Lote","OP Origen","Pedido Asignado"],
  asignaciones_pt: ["ID Asignación","Empresa","Pedido","ID Línea","SKU","Lote","Cantidad Asignada","Fecha Asignación","Asignado Por","Estado","Observaciones"],
  novedades: ["ID Novedad","Empresa","Tipo Novedad","Descripción","Pedido","OP","SKU","Línea","Fecha Reporte","Reportado Por","Estado Novedad","Impacto","Responsable Gestión","Fecha Gestión","Fecha Cierre","Cerrado Por","Observaciones"],
  sku: ["Codigo SKU","Descripcion SKU","Cod destinatario","UN medida","Presentacion","Caracteristicas","Modelo manufactura","Tiempo estandar po","Linea de produc","Stock minimo si MTO","Estado SKU","Empresa"],
  empresas: ["Codigo empresa","Razon social","NIT","Direccion","Contacto tel","correo","Departamento","Ciudad","Estado empresa"],
  destinatarios: ["Cod destinatario","Nombre destinatario","Correo","Telefono","Codigo empresa","Estado Destinatario"],
  lineas: ["Linea","Maquina","Capacidad","UM","Estado","Empresa","Procesos","ID"]
};

const TURNOS = [
  { codigo: "T1", nombre: "Turno 1", horaInicio: 6, horaFin: 14 },
  { codigo: "T2", nombre: "Turno 2", horaInicio: 14, horaFin: 22 },
  { codigo: "T3", nombre: "Turno 3", horaInicio: 22, horaFin: 6 }
];
const JORNADA_MINUTOS = 1440;
const DIAS_LABORABLES = [1, 2, 3, 4, 5, 6];

function doGet(e) {
  // MAGIA PARA EL LOGIN/LOGOUT SIN PANTALLA BLANCA
  if (e && e.parameter && e.parameter.app === "true") {
    return HtmlService.createTemplateFromFile('Index').evaluate()
      .setTitle('ProGuide Systems')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createTemplateFromFile('Login').evaluate()
    .setTitle('ProGuide Systems - Acceso')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nombre) { return HtmlService.createHtmlOutputFromFile(nombre).getContent(); }
function obtenerAppHTML() { return HtmlService.createTemplateFromFile('Index').evaluate().getContent(); }
function obtenerLoginHTML() { return HtmlService.createTemplateFromFile('Login').evaluate().getContent(); }

function cerrarSesionServidor() {
  // Hook de seguridad para cerrar sesión del lado del servidor
  return { ok: true };
}

function abrirHoja(modulo) {
  const config = SHEETS[modulo];
  if (!config) throw new Error("Módulo desconocido: " + modulo);
  const ss = SpreadsheetApp.openById(config.id);
  const sheet = ss.getSheetByName(config.pestaña);
  if (!sheet) throw new Error("No se encontró la pestaña '" + config.pestaña + "' en módulo " + modulo);
  return sheet;
}

function normalizarKey(campo) {
  return String(campo).toLowerCase().replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n").replace(/ü/g, "u").replace(/\s+/g, "_").replace(/[^\w]/g, "");
}

function obtenerUsuarioPorCedula(cedula) { return leerTodos("usuarios").find(u => String(u.cedula).trim() === String(cedula).trim()) || null; }
function formatNum(n) { return n == null || isNaN(n) ? '0' : Number(n).toLocaleString('es-CO'); }

function formatearFechaHora(iso) {
  try { const d = new Date(iso); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } catch (e) { return iso; }
}
function formatearFechaVisual(fechaValor) {
  if (!fechaValor) return "";
  try {
    const str = String(fechaValor).trim(); if (str === "") return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) { const p = str.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; }
    const d = new Date(str); if (!isNaN(d.getTime())) return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    return str;
  } catch (e) { return ""; }
}
function formatearHoraVisual(horaValor) {
  if (!horaValor) return "";
  try {
    const str = String(horaValor).trim(); if (str === "") return "";
    if (/^\d{1,2}:\d{2}$/.test(str)) { const p = str.split(":"); return String(p[0]).padStart(2, "0") + ":" + p[1]; }
    const d = new Date(str); if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return str;
  } catch (e) { return ""; }
}
function formatearFecha(fechaValor) {
  if (!fechaValor) return "";
  try {
    const str = String(fechaValor).trim(); if (str === "") return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
        const p = str.split("/");
        return `${p[2]}-${String(p[1]).padStart(2, "0")}-${String(p[0]).padStart(2, "0")}`;
    }
    
    const d = new Date(str); if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return str;
  } catch (e) { return ""; }
}
function formatearHora(horaValor) {
  if (!horaValor) return "";
  try {
    const str = String(horaValor).trim();
    if (/^\d{1,2}:\d{2}$/.test(str)) { const p = str.split(":"); return String(parseInt(p[0], 10)).padStart(2, "0") + ":" + p[1]; }
    const match = str.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
    if (match) { let h = parseInt(match[1], 10); if (match[3].toUpperCase() === "PM" && h < 12) h += 12; if (match[3].toUpperCase() === "AM" && h === 12) h = 0; return String(h).padStart(2, "0") + ":" + match[2]; }
    const d = new Date(str); if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return str;
  } catch (e) { return String(horaValor); }
}
function formatearFechaInput(fecha) { return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`; }

function obtenerTurnoPorHora(horaStr) {
  if (!horaStr) return null; try { const h = parseInt(String(horaStr).split(":")[0]); if (isNaN(h)) return null; if (h >= 6 && h < 14) return TURNOS[0]; if (h >= 14 && h < 22) return TURNOS[1]; return TURNOS[2]; } catch (e) { return null; }
}
function calcularTiempoOP(op, skuInfo) { if (!skuInfo) return 0; const pres = parseFloat(skuInfo.presentacion) || 1; return ((parseFloat(op.cantidad_total_planeada) || 0) / pres) * (parseFloat(skuInfo.tiempo_estandar_po) || 0); }
function calcularTiempoPedido(p, skuInfo) { if (!skuInfo) return 0; const pres = parseFloat(skuInfo.presentacion) || 1; return ((parseFloat(p.cantidad_solicitada) || 0) / pres) * (parseFloat(skuInfo.tiempo_estandar_po) || 0); }

function extraerUltimoProceso(texto) {
  if (!texto) return "";
  const matches = String(texto).match(/PROCESO:\s*([^.\n]+)/g);
  if (matches && matches.length > 0) {
    return matches[matches.length - 1].replace("PROCESO:", "").trim();
  }
  return "";
}

function obtenerRegistros(modulo, empresaFiltro) {
  const campos = CAMPOS[modulo]; 
  if (!campos) throw new Error("Módulo no configurado: " + modulo);
  
  const data = abrirHoja(modulo).getDataRange().getValues(); 
  if (data.length <= 1) return [];
  
  const registros = []; 
  
  let colEmpresa = campos.indexOf("Empresa");
  if (colEmpresa === -1) {
    colEmpresa = campos.indexOf("Codigo empresa");
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i]; 
    if (!row[0] || String(row[0]).trim() === "") continue;
    
    if (empresaFiltro && colEmpresa !== -1) { 
      const e = String(row[colEmpresa] || "").trim(); 
      if (e && e !== empresaFiltro) continue; 
    }
    
    const obj = {};
    campos.forEach((campo, idx) => {
      const raw = row[idx]; 
      const key = normalizarKey(campo);
      if (key === "hora_entrega" || key === "hora_produccion") obj[key] = formatearHoraVisual(raw);
      else if (raw instanceof Date || (typeof raw === "string" && (raw.includes("GMT") || /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())))) obj[key] = formatearFechaVisual(raw);
      else obj[key] = String(raw == null ? "" : raw).trim();
    });
    registros.push(obj);
  }
  return registros;
}
function leerTodos(modulo) { return obtenerRegistros(modulo, null); }

function leerMatrizPermisos() {
  const sheet = SpreadsheetApp.openById(SHEETS.usuarios.id).getSheetByName(SHEETS.usuarios.permisos);
  if (!sheet) return {}; const data = sheet.getDataRange().getValues(); if (data.length < 2) return {};
  const headers = data[0]; const matriz = {};
  for (let i = 1; i < data.length; i++) {
    const fila = data[i]; const perfil = String(fila[0] || "").trim(); if (!perfil) continue;
    const permisos = {};
    for (let j = 1; j < headers.length; j++) { const mod = String(headers[j] || "").trim().toLowerCase(); const val = String(fila[j] || "").trim().toUpperCase(); if (mod) permisos[mod] = val; }
    matriz[perfil] = permisos;
  }
  return matriz;
}
function obtenerPermisosDePerfil(perfil) { return leerMatrizPermisos()[perfil] || {}; }

function loginUsuario(cedula, password) {
  const user = obtenerUsuarioPorCedula(cedula);
  if (!user) return { ok: false, error: "Usuario no encontrado" };
  if (String(user.estado || "").toLowerCase().trim() !== "activo") return { ok: false, error: "Usuario inactivo" };
  if (String(user.contrasena).trim() !== String(password).trim()) return { ok: false, error: "Contraseña incorrecta" };
  try {
    const sheet = abrirHoja("usuarios"); const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) { if (String(data[i][0]).trim() === String(user.cedula).trim()) { sheet.getRange(i + 1, 9).setValue(new Date().toISOString()); break; } }
  } catch (e) {}
  return { ok: true, usuario: { cedula: user.cedula, nombre: user.nombre, perfil: user.perfil, correo: user.correo, empresa: user.empresa, esAdmin: user.perfil === "Administrador", permisos: obtenerPermisosDePerfil(user.perfil), expira: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() } };
}

function generarNumPedido() {
  const data = abrirHoja("pedidos").getDataRange().getValues(); const añoActual = new Date().getFullYear(); let ultimo = 0;
  for (let i = 1; i < data.length; i++) { const match = String(data[i][2] || "").trim().match(/^(\d{4})(\d{5})$/); if (match && parseInt(match[1], 10) === añoActual) { const c = parseInt(match[2], 10); if (c > ultimo) ultimo = c; } }
  return `${añoActual}${String(ultimo + 1).padStart(5, "0")}`;
}
function generarPedidoDesdeNumPedido(num) { const str = String(num).trim(); if (!/^\d{9}$/.test(str)) return ""; return `PED-${str.substring(0, 4)}-${str.substring(4, 9)}`; }
function obtenerUltimoIdLinea() {
  const data = abrirHoja("pedidos").getDataRange().getValues(); let ultimo = 0;
  for (let i = 1; i < data.length; i++) { const match = String(data[i][0] || "").trim().match(/^PL-(\d{4})-(\d+)$/); if (match) { const n = parseInt(match[2], 10); if (n > ultimo) ultimo = n; } }
  return ultimo;
}
function generarIdLinea(num) { return `PL-${new Date().getFullYear()}-${String(num).padStart(5, "0")}`; }

function crearPedidoCompleto(datos, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  if (user.perfil !== "KAM Logístico" && user.perfil !== "Administrador") return { ok: false, error: "Sin permiso" };
  if (user.perfil !== "Administrador") datos.empresa = user.empresa;
  if (!datos.empresa || !datos.destinatario || !datos.lineas || datos.lineas.length === 0) return { ok: false, error: "Faltan datos" };
  const skusSet = new Set();
  for (let i = 0; i < datos.lineas.length; i++) { if (skusSet.has(datos.lineas[i].sku)) return { ok: false, error: "SKU duplicado: " + datos.lineas[i].sku }; skusSet.add(datos.lineas[i].sku); }
  const numPedido = generarNumPedido(); const pedido = generarPedidoDesdeNumPedido(numPedido); const fecha = new Date().toISOString();
  let sigLinea = obtenerUltimoIdLinea() + 1; const sheet = abrirHoja("pedidos"); const filas = [];
  datos.lineas.forEach(l => {
    filas.push([generarIdLinea(sigLinea++), pedido, numPedido, datos.empresa, datos.destinatario, l.sku, l.descripcion_sku || "", l.cantidad, datos.fecha_preferida_entrega, datos.hora_entrega || "", datos.urgencia, "", "Pendiente", datos.prioridad || "1", user.nombre, fecha, l.observacion || datos.observaciones || "", "", ""]);
  });
  filas.forEach(f => { sheet.appendRow(f); syncRowToFirestore("pedidos", f); });
  return { ok: true, pedido: pedido, numPedido: numPedido, numLineas: filas.length };
}

function editarPedidoCompleto(pedidoCod, datos, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  if (user.perfil !== "KAM Logístico" && user.perfil !== "Administrador") return { ok: false, error: "Sin permiso" };
  const sheet = abrirHoja("pedidos"); const data = sheet.getDataRange().getValues(); const ahora = new Date().toISOString(); let act = 0; let block = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === pedidoCod) {
      if (String(data[i][12] || "").trim() !== "Pendiente") { block = true; continue; }
      if (datos.destinatario) sheet.getRange(i + 1, 5).setValue(datos.destinatario);
      if (datos.fecha_preferida_entrega) sheet.getRange(i + 1, 9).setValue(datos.fecha_preferida_entrega);
      if (datos.hora_entrega !== undefined) sheet.getRange(i + 1, 10).setValue(datos.hora_entrega);
      if (datos.urgencia) sheet.getRange(i + 1, 11).setValue(datos.urgencia);
      if (datos.prioridad) sheet.getRange(i + 1, 14).setValue(datos.prioridad);
      if (datos.observaciones !== undefined) sheet.getRange(i + 1, 17).setValue(datos.observaciones);
      sheet.getRange(i + 1, 18).setValue(ahora); act++;
      const row = sheet.getRange(i + 1, 1, 1, CAMPOS.pedidos.length).getValues()[0]; syncRowToFirestore("pedidos", row);
    }
  }
  if (block) return { ok: false, error: "Pedido ya aprobado" }; if (act === 0) return { ok: false, error: "Pedido no encontrado" };
  return { ok: true, mensaje: "Pedido actualizado" };
}

function despacharPedido(pedidoCod, cedula) {
  const sheet = abrirHoja("pedidos"); const data = sheet.getDataRange().getValues(); let act = 0;
  for (let i = 1; i < data.length; i++) { if (String(data[i][1]).trim() === pedidoCod) { sheet.getRange(i + 1, 13).setValue("Despachado"); sheet.getRange(i + 1, 18).setValue(new Date().toISOString()); act++; const row = sheet.getRange(i + 1, 1, 1, CAMPOS.pedidos.length).getValues()[0]; syncRowToFirestore("pedidos", row); } }
  return act > 0 ? { ok: true, mensaje: "Pedido despachado" } : { ok: false, error: "No encontrado" };
}
function finalizarPedido(pedidoCod, cedula) {
  const sheet = abrirHoja("pedidos"); const data = sheet.getDataRange().getValues(); let act = 0;
  for (let i = 1; i < data.length; i++) { if (String(data[i][1]).trim() === pedidoCod) { sheet.getRange(i + 1, 13).setValue("Finalizado"); sheet.getRange(i + 1, 18).setValue(new Date().toISOString()); act++; const row = sheet.getRange(i + 1, 1, 1, CAMPOS.pedidos.length).getValues()[0]; syncRowToFirestore("pedidos", row); } }
  return act > 0 ? { ok: true, mensaje: "Pedido finalizado" } : { ok: false, error: "No encontrado" };
}
function cancelarPedido(pedidoCod, motivo, cedula) {
  if (!motivo || motivo.trim() === "") return { ok: false, error: "Motivo obligatorio" };
  const sheet = abrirHoja("pedidos"); const data = sheet.getDataRange().getValues(); let act = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === pedidoCod) {
      sheet.getRange(i + 1, 13).setValue("Cancelado"); const obs = String(data[i][16] || "").trim();
      sheet.getRange(i + 1, 17).setValue(obs ? obs + " | CANCELADO: " + motivo : "CANCELADO: " + motivo);
      sheet.getRange(i + 1, 18).setValue(new Date().toISOString()); act++;
      const row = sheet.getRange(i + 1, 1, 1, CAMPOS.pedidos.length).getValues()[0]; syncRowToFirestore("pedidos", row);
    }
  }
  return act > 0 ? { ok: true, mensaje: "Pedido cancelado" } : { ok: false, error: "No encontrado" };
}
function eliminarPedidoEnSheets(clave, cedula) {
  const sheet = abrirHoja("pedidos"); const data = sheet.getDataRange().getValues(); const buscar = String(clave).trim().toLowerCase(); let elim = 0;
  for (let i = data.length - 1; i >= 1; i--) { if (String(data[i][1]).trim().toLowerCase() === buscar) { eliminarDocFirestore("pedidos", data[i][0]); sheet.deleteRow(i + 1); elim++; } }
  return { ok: true, mensaje: elim > 0 ? "Eliminado" : "No encontrado" };
}

function obtenerDatosDashboardKAM(cedula, filtros) {
  const user = obtenerUsuarioPorCedula(cedula); 
  if (!user) return { ok: false, error: "Usuario no encontrado" };

  // 1. Si es Administrador o GLOBAL, no filtra por empresa para ver todos los pedidos
  const empresaFiltro = (user.perfil === "Administrador" || user.empresa === "GLOBAL") ? null : user.empresa;
  let pedidos = obtenerRegistros("pedidos", empresaFiltro); 
  const ops = leerTodos("ordenes_produccion");
  let novedades = []; 
  try { novedades = leerTodos("novedades"); } catch(e) {}

  // 2. Filtros seguros
  if (filtros) {
    if (filtros.estado && filtros.estado.trim() !== "") {
      pedidos = pedidos.filter(p => String(p.estado_pedido).trim() === filtros.estado.trim());
    }
    if (filtros.fechaInicio && filtros.fechaInicio.trim() !== "") {
      pedidos = pedidos.filter(p => {
        const f = formatearFecha(p.fecha_preferida_entrega);
        return f && f >= filtros.fechaInicio;
      });
    }
    if (filtros.fechaFin && filtros.fechaFin.trim() !== "") {
      pedidos = pedidos.filter(p => {
        const f = formatearFecha(p.fecha_preferida_entrega);
        return f && f <= filtros.fechaFin;
      });
    }
  }

  const grupos = {};
  pedidos.forEach(p => {
    if (["Cancelado", "Finalizado"].includes(String(p.estado_pedido).trim())) return;
    const key = p.pedido + "|" + p.sku;
    if (!grupos[key]) {
      let estadoProd = "Sin programar";
      if (p.estado_pedido === "Despachado") estadoProd = "Despachado";
      else if (p.estado_pedido === "En inventario PT") estadoProd = "Listo";
      else if (p.estado_pedido === "En producción") estadoProd = "En producción";
      else if (p.estado_pedido === "Aprobado") estadoProd = "Programado";
      
      const opAsociada = ops.find(op => String(op.codigo_pedido).trim() === p.pedido && String(op.sku_referencia).trim() === p.sku && ["Pendiente", "En proceso"].includes(String(op.estado).trim()));
      let ultimoProceso = ""; 
      if (opAsociada && opAsociada.observaciones_de_negociacion_planificador) {
        ultimoProceso = extraerUltimoProceso(opAsociada.observaciones_de_negociacion_planificador);
      }
      
      const novedadNoConforme = novedades.find(n => String(n.pedido).trim() === p.pedido && String(n.estado_novedad).trim() === "Abierta" && String(n.tipo_novedad).includes("No Conforme"));
      
      grupos[key] = { 
        pedido: p.pedido, 
        sku: p.sku, 
        descripcion_sku: p.descripcion_sku, 
        destinatario: p.destinatario, 
        fecha_preferida_entrega: p.fecha_preferida_entrega, 
        estado_pedido: p.estado_pedido, 
        estado_produccion: estadoProd, 
        ultimo_proceso: ultimoProceso, 
        alerta_no_conforme: novedadNoConforme ? novedadNoConforme.descripcion : "",
        cantidad: parseFloat(p.cantidad_solicitada) || 0
      };
    }
  });
  
  const lista = Object.values(grupos);
  
  const kpis = {
    total: lista.length,
    pendientes: lista.filter(d => d.estado_pedido === "Pendiente").length,
    enPlanta: lista.filter(d => d.estado_pedido === "Aprobado" || d.estado_pedido === "En producción").length,
    listos: lista.filter(d => d.estado_pedido === "Despachado" || d.estado_produccion === "Listo").length
  };
  
  const estadosChart = {};
  lista.forEach(d => { 
    const est = d.estado_pedido || "Sin Estado";
    estadosChart[est] = (estadosChart[est] || 0) + 1; 
  });
  
  const skusChart = {};
  lista.forEach(d => { 
    skusChart[d.sku] = (skusChart[d.sku] || 0) + d.cantidad; 
  });
  const topSkus = Object.entries(skusChart).sort((a,b) => b[1] - a[1]).slice(0, 5).map(x => ({ sku: x[0], cantidad: x[1] }));
  
  const tendenciaChart = {};
  lista.forEach(d => {
    const fNorm = formatearFecha(d.fecha_preferida_entrega);
    if (fNorm) tendenciaChart[fNorm] = (tendenciaChart[fNorm] || 0) + 1;
  });
  const tendencia = Object.entries(tendenciaChart)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(x => ({ fecha: formatearFechaVisual(x[0]), cantidad: x[1] }));

  return { ok: true, kpis, datos: lista, charts: { estados: estadosChart, topSkus, tendencia } };
}

function obtenerDatosDashboardPlanificador(cedula, filtros) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const esAdmin = user.perfil === "Administrador"; 
  const empresaFiltro = esAdmin ? null : user.empresa;

  let ops = leerTodos("ordenes_produccion");
  const lineas = leerTodos("lineas").filter(l => String(l.estado).trim() === "Activo" && (empresaFiltro ? String(l.empresa).trim() === empresaFiltro : true));

  if (filtros) {
    if (filtros.linea) ops = ops.filter(o => o.linea === filtros.linea);
    if (filtros.estado) ops = ops.filter(o => o.estado === filtros.estado);
    if (filtros.fechaInicio || filtros.fechaFin) {
      ops = ops.filter(o => {
        const f = formatearFecha(o.fecha_produccion);
        if (filtros.fechaInicio && f < filtros.fechaInicio) return false;
        if (filtros.fechaFin && f > filtros.fechaFin) return false;
        return true;
      });
    }
  }

  const pedidosSinProgramar = ops.filter(o => o.estado === "Pendiente").length; 
  const opsPendientes = ops.filter(o => o.estado === "Pendiente").length;
  const opsProceso = ops.filter(o => o.estado === "En proceso").length;

  const cargaLineas = obtenerIndicadoresPlanta(cedula).ocupacionPorLinea || [];
  const topLineas = cargaLineas.slice(0, 5).map(l => ({ linea: l.linea, porcentaje: l.porcentaje }));

  const estadosChart = {};
  ops.forEach(o => { estadosChart[o.estado] = (estadosChart[o.estado] || 0) + 1; });

  const tendenciaChart = {};
  ops.forEach(o => {
    const f = formatearFecha(o.fecha_produccion);
    if (f) tendenciaChart[f] = (tendenciaChart[f] || 0) + 1;
  });
  const tendencia = Object.entries(tendenciaChart).sort((a,b) => new Date(a[0]) - new Date(b[0])).map(x => ({ fecha: x[0], cantidad: x[1] }));

  return { 
    ok: true, 
    kpis: { pedidosSinProgramar, opsPendientes, opsProceso, totalLineasActivas: lineas.length },
    charts: { cargaLineas: topLineas, estados: estadosChart, tendencia }
  };
}

function obtenerDatosDashboardPlanta(cedula, filtros) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const esAdmin = user.perfil === "Administrador"; 
  const empresaFiltro = esAdmin ? null : user.empresa;

  let ops = leerTodos("ordenes_produccion").filter(op => empresaFiltro ? String(op.empresa).trim() === empresaFiltro : true);
  let novedades = []; try { novedades = leerTodos("novedades").filter(n => empresaFiltro ? String(n.empresa).trim() === empresaFiltro : true); } catch(e) {}

  if (filtros) {
    if (filtros.linea) ops = ops.filter(o => o.linea === filtros.linea);
    if (filtros.fechaInicio || filtros.fechaFin) {
      ops = ops.filter(o => {
        const f = formatearFecha(o.fecha_produccion);
        if (filtros.fechaInicio && f < filtros.fechaInicio) return false;
        if (filtros.fechaFin && f > filtros.fechaFin) return false;
        return true;
      });
    }
  }

  const opsEnProceso = ops.filter(o => String(o.estado).trim() === "En proceso");
  const novedadesAbiertas = novedades.filter(n => String(n.estado_novedad).trim() === "Abierta" && String(n.tipo_novedad).includes("No Conforme"));

  let totalPlaneado = 0;
  let totalReal = 0;
  ops.filter(o => String(o.estado).trim() === "Completada").forEach(o => {
    totalPlaneado += parseFloat(o.cantidad_total_planeada) || 0;
    totalReal += parseFloat(o.cantidad_total_real) || 0;
  });
  const eficiencia = totalPlaneado > 0 ? Math.round((totalReal / totalPlaneado) * 100) : 100;

  const ncChart = {};
  novedadesAbiertas.forEach(n => {
    const tipo = n.tipo_novedad || "Otro";
    ncChart[tipo] = (ncChart[tipo] || 0) + 1;
  });

  const prodDiaria = {};
  ops.filter(o => String(o.estado).trim() === "Completada").forEach(o => {
    const f = formatearFecha(o.fecha_produccion);
    if (f) prodDiaria[f] = (prodDiaria[f] || 0) + (parseFloat(o.cantidad_total_real) || 0);
  });
  const prodTendencia = Object.entries(prodDiaria).sort((a,b) => new Date(a[0]) - new Date(b[0])).map(x => ({ fecha: x[0], cantidad: x[1] }));

  return {
    ok: true,
    kpis: { opsEnProceso: opsEnProceso.length, novedadesAbiertas: novedadesAbiertas.length, eficiencia, totalProducidoReal: totalReal },
    opsDetalle: opsEnProceso.slice(0, 5),
    ultimasNovedades: novedadesAbiertas.slice(0, 3),
    charts: { ncChart, prodTendencia }
  };
}

function obtenerDatosConsolidados(cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return [];
  const empresaFiltro = user.perfil === "Administrador" ? null : user.empresa;
  const pedidos = obtenerRegistros("pedidos", empresaFiltro);
  let inventario = [], ops = [], novedades = [];
  try { inventario = leerTodos("inventario_pt"); } catch (e) {}
  try { ops = leerTodos("ordenes_produccion"); } catch (e) {}
  try { novedades = leerTodos("novedades"); } catch (e) {}
  const skus = leerTodos("sku"); const grupos = {};
  pedidos.forEach(p => {
    if (["Cancelado", "Finalizado"].includes(String(p.estado_pedido).trim())) return;
    const key = p.pedido + "|" + p.sku;
    if (!grupos[key]) {
      const skuInfo = skus.find(s => String(s.codigo_sku).trim() === p.sku);
      grupos[key] = { pedido: p.pedido, num_pedido: p.num_pedido, empresa: p.empresa, destinatario: p.destinatario, sku: p.sku, descripcion_sku: p.descripcion_sku, cantidad_solicitada: parseFloat(p.cantidad_solicitada) || 0, presentacion: skuInfo ? (parseFloat(skuInfo.presentacion) || 1) : 1, unidad_medida: skuInfo ? String(skuInfo.un_medida || "").trim() : "", unidades_fisicas: 0, fecha_preferida_entrega: formatearFecha(p.fecha_preferida_entrega), hora_entrega: formatearHora(p.hora_entrega), fecha_entrega_planta: formatearFecha(p.fecha_entrega_planta), urgencia: p.urgencia, prioridad: p.prioridad, estado_pedido: String(p.estado_pedido).trim(), ops: [], novedades: [], inventario_disponible: 0, ops_pendientes: 0, ops_en_proceso: 0, ops_completadas: 0 };
      grupos[key].unidades_fisicas = grupos[key].presentacion > 0 ? grupos[key].cantidad_solicitada / grupos[key].presentacion : 0;
    }
  });
  Object.keys(grupos).forEach(key => {
    const g = grupos[key];
    g.inventario_disponible = inventario.filter(i => 
        String(i.sku).trim() === g.sku && 
        String(i.estado_lote).trim() === "Disponible" && 
        String(i.pedido_asignado).trim() === g.pedido
    ).reduce((s, i) => s + (parseFloat(i.cantidad_disponible) || 0), 0);

    const opsDelPedido = ops.filter(op => String(op.codigo_pedido).trim() === g.pedido && String(op.sku_referencia).trim() === g.sku);
    g.ops = opsDelPedido.map(op => ({ numero_op: op.numero_op, cantidad_planeada: parseFloat(op.cantidad_total_planeada) || 0, estado: op.estado, linea: op.linea, lote: op.lote, observaciones_negociacion: op.observaciones_de_negociacion_planificador || "", ultimo_proceso: extraerUltimoProceso(op.observaciones_de_negociacion_planificador) }));
    g.ops_pendientes = opsDelPedido.filter(op => String(op.estado).trim() === "Pendiente").reduce((s, op) => s + (parseFloat(op.cantidad_total_planeada) || 0), 0);
    g.ops_en_proceso = opsDelPedido.filter(op => String(op.estado).trim() === "En proceso").reduce((s, op) => s + (parseFloat(op.cantidad_total_planeada) || 0), 0);
    g.falta_producir = Math.max(0, g.cantidad_solicitada - g.inventario_disponible - (g.ops_pendientes + g.ops_en_proceso));
    g.exceso = Math.max(0, g.inventario_disponible + (g.ops_pendientes + g.ops_en_proceso) - g.cantidad_solicitada);
    
    if (g.estado_pedido === "Despachado") g.estado_produccion = "Despachado";
    else if (g.falta_producir <= 0) {
        if (g.ops_en_proceso > 0) g.estado_produccion = "En producción";
        else if (g.ops_pendientes > 0) g.estado_produccion = "Programado";
        else g.estado_produccion = "Listo";
    }
    else g.estado_produccion = (g.ops_pendientes > 0 || g.ops_en_proceso > 0 || g.inventario_disponible > 0) ? "Programado parcial" : "Sin programar";
    
    g.novedades = novedades.filter(n => String(n.pedido).trim() === g.pedido && (String(n.sku).trim() === g.sku || !n.sku) && String(n.estado_novedad).trim() !== "Cerrada").map(n => ({ tipo_novedad: n.tipo_novedad, descripcion: n.descripcion }));
  });
  return Object.values(grupos);
}

function aprobarPedidoDesdeProgramacion(pedidoCod, fechaPlanta, prioridad, motivo, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user || !["Planificador", "Administrador"].includes(user.perfil)) return { ok: false, error: "Sin permiso" };
  if (!fechaPlanta) return { ok: false, error: "Fecha obligatoria" };
  const sheet = abrirHoja("pedidos"); const data = sheet.getDataRange().getValues(); const ahora = new Date().toISOString(); let act = 0; let fechaCambiada = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === pedidoCod && String(data[i][12] || "").trim() === "Pendiente") {
      const fechaActual = formatearFecha(data[i][8]); const obs = String(data[i][16] || "").trim(); let nota = "";
      if (fechaActual && fechaActual !== fechaPlanta) { fechaCambiada = true; nota = `[${formatearFechaHora(ahora)} - ${user.nombre}]\nNegociación: ${fechaActual} → ${fechaPlanta}\nMotivo: ${motivo || 'No especificado'}`; }
      sheet.getRange(i + 1, 12).setValue(fechaPlanta); sheet.getRange(i + 1, 13).setValue("Aprobado"); sheet.getRange(i + 1, 14).setValue(prioridad || "1"); sheet.getRange(i + 1, 18).setValue(ahora);
      if (nota) sheet.getRange(i + 1, 17).setValue(obs ? obs + "\n---\n" + nota : nota);
      act++;
      const row = sheet.getRange(i + 1, 1, 1, CAMPOS.pedidos.length).getValues()[0]; syncRowToFirestore("pedidos", row);
    }
  }
  return act > 0 ? { ok: true, mensaje: fechaCambiada ? "Aprobado con cambio de fecha" : "Aprobado correctamente" } : { ok: false, error: "Pedido no pendiente o no encontrado" };
}

function crearOPsDesdePedido(opsData, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user || !["Planificador", "Administrador"].includes(user.perfil)) return { ok: false, error: "Sin permiso" };
  if (!opsData || opsData.length === 0) return { ok: false, error: "No hay OPs" };
  const sheetOP = abrirHoja("ordenes_produccion"); const sheetInv = abrirHoja("inventario_pt");
  let numOP = obtenerUltimoNumeroOP(); let numLote = obtenerUltimoNumeroLote();
  const opsCreadas = [];
  opsData.forEach(op => {
    numOP++; const numeroOP = `OP-${new Date().getFullYear()}-${String(numOP).padStart(5, "0")}`;
    numLote++; const numeroLote = `L-${new Date().getFullYear()}-${String(numLote).padStart(5, "0")}`;
    const filaOP = [numeroOP, user.empresa, op.descripcion_sku || "", op.sku, numeroLote, op.cantidad, "", op.presentacion || 1, op.cantidad / (op.presentacion || 1), op.unidad_medida || "", op.fecha_entrega_despacho || "", formatearHora(op.hora_entrega) || "", op.fecha_produccion || "", op.hora_produccion || "", op.pedido, op.destinatario_cliente || "", "Pendiente", op.linea, user.nombre, ""];
    sheetOP.appendRow(filaOP); syncRowToFirestore("ordenes_produccion", filaOP);
    const filaInv = [op.sku, numeroLote, user.empresa, op.descripcion_sku || "", 0, 0, op.unidad_medida || "", "", "", "Pendiente", numeroOP, op.pedido];
    sheetInv.appendRow(filaInv); syncRowToFirestore("inventario_pt", filaInv);
    opsCreadas.push({ numeroOP, numeroLote });
  });
  return { ok: true, mensaje: opsCreadas.length + " OPs creadas exitosamente", ops: opsCreadas };
}
function obtenerUltimoNumeroOP() { const d = abrirHoja("ordenes_produccion").getDataRange().getValues(); let u = 0; for (let i = 1; i < d.length; i++) { const m = String(d[i][0] || "").match(/^OP-(\d{4})-(\d+)$/); if (m && parseInt(m[2], 10) > u) u = parseInt(m[2], 10); } return u; }
function obtenerUltimoNumeroLote() { const d = abrirHoja("inventario_pt").getDataRange().getValues(); let u = 0; for (let i = 1; i < d.length; i++) { const m = String(d[i][1] || "").match(/^L-(\d{4})-(\d+)$/); if (m && parseInt(m[2], 10) > u) u = parseInt(m[2], 10); } return u; }

function cancelarOP(numeroOP, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user || !["Planificador", "Administrador"].includes(user.perfil)) return { ok: false, error: "Sin permiso" };
  const sheetOP = abrirHoja("ordenes_produccion"); const dataOP = sheetOP.getDataRange().getValues();
  for (let i = 1; i < dataOP.length; i++) {
    if (String(dataOP[i][0]).trim() === numeroOP) {
      if (String(dataOP[i][16] || "").trim() !== "Pendiente") return { ok: false, error: "Solo se cancelan OPs Pendientes" };
      sheetOP.getRange(i + 1, 17).setValue("Cancelada"); const lote = String(dataOP[i][4] || "").trim();
      const rowOP = sheetOP.getRange(i + 1, 1, 1, CAMPOS.ordenes_produccion.length).getValues()[0]; syncRowToFirestore("ordenes_produccion", rowOP);
      if (lote) { const sheetInv = abrirHoja("inventario_pt"); const dataInv = sheetInv.getDataRange().getValues(); for (let j = 1; j < dataInv.length; j++) { if (String(dataInv[j][1]).trim() === lote && String(dataInv[j][9] || "").trim() === "Pendiente") { eliminarDocFirestore("inventario_pt", lote); sheetInv.deleteRow(j + 1); break; } } }
      return { ok: true, mensaje: "OP cancelada" };
    }
  }
  return { ok: false, error: "OP no encontrada" };
}

function calcularSugerenciasOP(sku, cantidadFaltante, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const skus = leerTodos("sku"); const skuInfo = skus.find(s => String(s.codigo_sku).trim() === sku);
  if (!skuInfo) return { ok: false, error: "SKU no encontrado" };
  
  const empresaSKU = String(skuInfo.empresa).trim(); 

  const lineaHabitual = String(skuInfo.linea_de_produc).trim(); const tiempoEstandar = parseFloat(skuInfo.tiempo_estandar_po) || 0;
  const unidadSKU = String(skuInfo.un_medida || "").trim().toUpperCase(); const presentacion = parseFloat(skuInfo.presentacion) || 1;
  
  const todasLineas = leerTodos("lineas").filter(l => String(l.estado).trim() === "Activo" && String(l.empresa).trim() === empresaSKU); 
  
  if (todasLineas.length === 0) return { ok: true, sugerencias: [], mensaje: "No hay líneas activas para la empresa " + empresaSKU };
  const lineasAgrupadas = {};
  todasLineas.forEach(l => {
    const nombreLinea = String(l.linea).trim();
    if (!lineasAgrupadas[nombreLinea]) lineasAgrupadas[nombreLinea] = { linea: nombreLinea, empresa: l.empresa, maquinas: [], capacidadTotal: 0, capacidadCompat: 0, unidad: l.um, compatible: false };
    const cap = parseFloat(l.capacidad) || 0;
    lineasAgrupadas[nombreLinea].maquinas.push({ maquina: l.maquina, capacidad: cap, um: l.um });
    lineasAgrupadas[nombreLinea].capacidadTotal += cap;
    if (String(l.um).trim().toUpperCase() === unidadSKU) { lineasAgrupadas[nombreLinea].capacidadCompat += cap; lineasAgrupadas[nombreLinea].compatible = true; }
  });
  const lineasDisponibles = Object.values(lineasAgrupadas).sort((a, b) => {
    const aEsHabitual = a.linea === lineaHabitual; const bEsHabitual = b.linea === lineaHabitual;
    if (aEsHabitual && !bEsHabitual) return -1; if (!aEsHabitual && bEsHabitual) return 1;
    if (a.compatible && !b.compatible) return -1; if (!a.compatible && b.compatible) return 1;
    return b.capacidadTotal - a.capacidadTotal;
  });
  const lineasCompatibleArr = lineasDisponibles.filter(l => l.compatible);
  let lineasParaUsar = lineasCompatibleArr.length > 0 ? lineasCompatibleArr : lineasDisponibles;
  let mensajeAdvertencia = lineasCompatibleArr.length > 0 ? "" : "⚠️ Ninguna línea tiene la unidad '" + unidadSKU + "'.";
  const sugerencias = [];
  const lineasOrdenadas = [...lineasParaUsar].sort((a, b) => (b.capacidadCompat || b.capacidadTotal) - (a.capacidadCompat || a.capacidadTotal));
  if (lineasOrdenadas.length > 0) {
    const lineaTop = lineasOrdenadas[0]; const capTop = lineaTop.capacidadCompat > 0 ? lineaTop.capacidadCompat : lineaTop.capacidadTotal;
    if (capTop > 0) {
      const numOPs = Math.ceil(cantidadFaltante / capTop); const ops = []; let restante = cantidadFaltante;
      for (let i = 0; i < numOPs; i++) { const cant = Math.min(capTop, restante); ops.push({ cantidad: cant, cantidad_unidades: cant / presentacion, tiempo: Math.round(cant * tiempoEstandar), linea: lineaTop.linea, maquina: lineaTop.maquinas[0]?.maquina || "", unidad: unidadSKU, presentacion: presentacion }); restante -= cant; }
      sugerencias.push({ tipo: "optimo_simple", etiqueta: `✅ ${numOPs} OP(s) de máximo ${formatNum(capTop)} ${unidadSKU} en ${lineaTop.linea} ${lineaTop.linea === lineaHabitual ? '(habitual)' : ''} (óptimo)`, numOPs: numOPs, lineasUsadas: [lineaTop.linea], ops: ops });
    }
  }
  const lineasDropdown = lineasDisponibles.map(l => ({ linea: l.linea, capacidadTotal: l.capacidadTotal, capacidadCompat: l.capacidadCompat, unidad: l.unidad, compatible: l.compatible, esHabitual: l.linea === lineaHabitual, maquinas: l.maquinas }));
  return { ok: true, sku: sku, descripcion_sku: skuInfo.descripcion_sku, cantidadFaltante: cantidadFaltante, lineaSugerida: lineaHabitual, unidadSKU: unidadSKU, presentacion: presentacion, tiempoEstandar: tiempoEstandar, lineasDisponibles: lineasDropdown, lineasCompatibles: lineasCompatibleArr.map(l => l.linea), sugerencias: sugerencias, mensaje: mensajeAdvertencia };
}

function obtenerIndicadoresPlanta(cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const esAdmin = user.perfil === "Administrador"; const empresaFiltro = esAdmin ? null : user.empresa;
  const lineas = leerTodos("lineas").filter(l => String(l.estado).trim() === "Activo" && (empresaFiltro ? String(l.empresa).trim() === empresaFiltro : true));
  let ops = []; try { ops = leerTodos("ordenes_produccion"); } catch (e) {}
  const skus = leerTodos("sku");
  const opsActivas = ops.filter(op => String(op.estado).trim() === "Pendiente" || String(op.estado).trim() === "En proceso");
  const lineasUnicas = [...new Set(lineas.map(l => String(l.linea).trim()))]; const ocupacionPorLinea = [];
  lineasUnicas.forEach(nombreLinea => {
    const opsLinea = opsActivas.filter(op => String(op.linea).trim() === nombreLinea);
    let tiempoOcupado = 0; opsLinea.forEach(op => { const skuInfo = skus.find(s => String(s.codigo_sku).trim() === op.sku_referencia); tiempoOcupado += calcularTiempoOP(op, skuInfo); });
    const diasConOps = new Set(opsLinea.map(op => formatearFecha(op.fecha_produccion)).filter(f => f));
    const capacidadTotal = Math.max(1, diasConOps.size) * JORNADA_MINUTOS;
    const porcentaje = capacidadTotal > 0 ? Math.min(100, Math.round((tiempoOcupado / capacidadTotal) * 100)) : 0;
    ocupacionPorLinea.push({ linea: nombreLinea, tiempoOcupadoMin: Math.round(tiempoOcupado), tiempoOcupadoHoras: Math.round(tiempoOcupado / 60 * 10) / 10, capacidadTotalMin: capacidadTotal, capacidadTotalHoras: Math.round(capacidadTotal / 60), porcentaje: porcentaje, numOPs: opsLinea.length });
  });
  ocupacionPorLinea.sort((a, b) => b.porcentaje - a.porcentaje);
  const unidadesPorSKU = {};
  opsActivas.forEach(op => {
    const sku = String(op.sku_referencia).trim(); const cantidad = parseFloat(op.cantidad_total_planeada) || 0; const skuInfo = skus.find(s => String(s.codigo_sku).trim() === sku);
    if (!unidadesPorSKU[sku]) unidadesPorSKU[sku] = { sku: sku, descripcion: skuInfo ? skuInfo.descripcion_sku : "", unidad: skuInfo ? skuInfo.un_medida : "", cantidadTotal: 0, numOPs: 0 };
    unidadesPorSKU[sku].cantidadTotal += cantidad; unidadesPorSKU[sku].numOPs++;
  });
  const skusTop = Object.values(unidadesPorSKU).sort((a, b) => b.cantidadTotal - a.cantidadTotal).slice(0, 5);
  const tiempoTotalOcupado = ocupacionPorLinea.reduce((sum, l) => sum + l.tiempoOcupadoMin, 0);
  const capacidadTotalPlanta = ocupacionPorLinea.reduce((sum, l) => sum + l.capacidadTotalMin, 0);
  const cargaTotalPorcentaje = capacidadTotalPlanta > 0 ? Math.min(100, Math.round((tiempoTotalOcupado / capacidadTotalPlanta) * 100)) : 0;
  const capacidadDisponiblePorcentaje = 100 - cargaTotalPorcentaje;
  const opsPorEstado = { pendientes: ops.filter(op => String(op.estado).trim() === "Pendiente").length, enProceso: ops.filter(op => String(op.estado).trim() === "En proceso").length, completadas: ops.filter(op => String(op.estado).trim() === "Completada").length, canceladas: ops.filter(op => String(op.estado).trim() === "Cancelada").length };
  const librePorLinea = ocupacionPorLinea.map(l => ({ linea: l.linea, tiempoLibreMin: Math.max(0, l.capacidadTotalMin - l.tiempoOcupadoMin), tiempoLibreHoras: Math.round(Math.max(0, l.capacidadTotalMin - l.tiempoOcupadoMin) / 60), porcentajeLibre: 100 - l.porcentaje }));
  return { ok: true, ocupacionPorLinea: ocupacionPorLinea, unidadesPorSKU: skusTop, cargaTotal: { porcentaje: cargaTotalPorcentaje, tiempoOcupadoHoras: Math.round(tiempoTotalOcupado / 60), capacidadTotalHoras: Math.round(capacidadTotalPlanta / 60) }, capacidadDisponible: { porcentaje: capacidadDisponiblePorcentaje, tiempoLibreHoras: Math.round((capacidadTotalPlanta - tiempoTotalOcupado) / 60) }, opsPorEstado: opsPorEstado, librePorLinea: librePorLinea };
}

function obtenerVistaCapacidad(cedula, fechaInicio, fechaFin) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const esAdmin = user.perfil === "Administrador"; const empresaFiltro = esAdmin ? null : user.empresa;
  const lineas = leerTodos("lineas").filter(l => String(l.estado).trim() === "Activo" && (empresaFiltro ? String(l.empresa).trim() === empresaFiltro : true));
  const ops = leerTodos("ordenes_produccion"); const pedidos = leerTodos("pedidos"); const skus = leerTodos("sku");
  const lineasUnicas = [...new Set(lineas.map(l => String(l.linea).trim()))];
  const resultado = {}; lineasUnicas.forEach(nombreLinea => { resultado[nombreLinea] = {}; });
  const inicio = new Date(fechaInicio + "T00:00:00"); const fin = new Date(fechaFin + "T00:00:00");
  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const fechaStr = formatearFechaInput(d); const diaSemana = d.getDay(); const esDiaLaboral = DIAS_LABORABLES.includes(diaSemana);
    lineasUnicas.forEach(nombreLinea => {
      if (!esDiaLaboral) { resultado[nombreLinea][fechaStr] = { fecha: fechaStr, diaSemana: diaSemana, descanso: true, capacidadTotal: 0, tiempoOcupado: 0, tiempoLibre: 0, porcentaje: 0, numOPs: 0, numPedidosAprobados: 0, numPedidosPendientes: 0, tiempoOps: 0, tiempoAprobados: 0, tiempoPendientes: 0, turnos: {}, ops: [], pedidosAprobados: [], pedidosPendientes: [] }; return; }
      const opsDelDia = ops.filter(op => formatearFecha(op.fecha_produccion) === fechaStr && String(op.linea).trim() === nombreLinea);
      let tiempoOps = 0; const opsDetalle = []; const turnosUso = { T1: 0, T2: 0, T3: 0 };
      opsDelDia.forEach(op => {
        const skuInfo = skus.find(s => String(s.codigo_sku).trim() === op.sku_referencia); if (!skuInfo) return;
        const tiempoMin = calcularTiempoOP(op, skuInfo); tiempoOps += tiempoMin;
        const horaFormateada = formatearHora(op.hora_produccion); const turno = obtenerTurnoPorHora(horaFormateada); if (turno) turnosUso[turno.codigo] += tiempoMin;
        const presentacion = parseFloat(skuInfo.presentacion) || 1; const cantidad = parseFloat(op.cantidad_total_planeada) || 0;
        opsDetalle.push({ numero_op: op.numero_op, sku: op.sku_referencia, descripcion_sku: op.descripcion_sku, cantidad: cantidad, unidad_medida: op.unidad_medida, unidades: cantidad / presentacion, tiempo_min: Math.round(tiempoMin), tiempo_horas: (tiempoMin / 60).toFixed(2), estado: op.estado, lote: op.lote, hora_produccion: horaFormateada, turno: turno ? turno.codigo : "-" });
      });
      const pedidosAprobadosLinea = []; let tiempoAprobados = 0;
      pedidos.forEach(p => {
        const estadoP = String(p.estado_pedido).trim(); if (estadoP !== "Aprobado" && estadoP !== "En producción") return;
        if (formatearFecha(p.fecha_preferida_entrega) !== fechaStr) return;
        const skuInfo = skus.find(s => String(s.codigo_sku).trim() === p.sku); if (!skuInfo || String(skuInfo.linea_de_produc).trim() !== nombreLinea) return;
        const opsDelPedido = ops.filter(op => String(op.codigo_pedido).trim() === p.pedido && String(op.sku_referencia).trim() === p.sku && (String(op.estado).trim() === "Pendiente" || String(op.estado).trim() === "En proceso"));
        if (opsDelPedido.length > 0) return;
        const tiempoMin = calcularTiempoPedido(p, skuInfo); tiempoAprobados += tiempoMin;
        pedidosAprobadosLinea.push({ pedido: p.pedido, num_pedido: p.num_pedido, destinatario: p.destinatario, sku: p.sku, descripcion_sku: p.descripcion_sku, cantidad: parseFloat(p.cantidad_solicitada) || 0, unidad_medida: skuInfo.un_medida, tiempo_min: Math.round(tiempoMin), tiempo_horas: (tiempoMin / 60).toFixed(2), estado: estadoP, urgencia: p.urgencia, fecha_preferida: formatearFecha(p.fecha_preferida_entrega), fecha_planta: formatearFecha(p.fecha_entrega_planta) });
      });
      const pedidosPendientesLinea = []; let tiempoPendientes = 0;
      pedidos.forEach(p => {
        if (String(p.estado_pedido).trim() !== "Pendiente") return;
        if (formatearFecha(p.fecha_preferida_entrega) !== fechaStr) return;
        const skuInfo = skus.find(s => String(s.codigo_sku).trim() === p.sku); if (!skuInfo || String(skuInfo.linea_de_produc).trim() !== nombreLinea) return;
        const tiempoMin = calcularTiempoPedido(p, skuInfo); tiempoPendientes += tiempoMin;
        pedidosPendientesLinea.push({ pedido: p.pedido, num_pedido: p.num_pedido, destinatario: p.destinatario, sku: p.sku, descripcion_sku: p.descripcion_sku, cantidad: parseFloat(p.cantidad_solicitada) || 0, unidad_medida: skuInfo.un_medida, tiempo_min: Math.round(tiempoMin), tiempo_horas: (tiempoMin / 60).toFixed(2), estado: "Pendiente", urgencia: p.urgencia, fecha_preferida: formatearFecha(p.fecha_preferida_entrega) });
      });
      const tiempoTotal = tiempoOps + tiempoAprobados + tiempoPendientes;
      const porcentaje = JORNADA_MINUTOS > 0 ? (tiempoTotal / JORNADA_MINUTOS) * 100 : 0;
      resultado[nombreLinea][fechaStr] = { fecha: fechaStr, diaSemana: diaSemana, descanso: false, capacidadTotal: JORNADA_MINUTOS, tiempoOcupado: Math.round(tiempoTotal), tiempoLibre: Math.max(0, JORNADA_MINUTOS - Math.round(tiempoTotal)), porcentaje: Math.round(porcentaje), numOPs: opsDelDia.length, numPedidosAprobados: pedidosAprobadosLinea.length, numPedidosPendientes: pedidosPendientesLinea.length, tiempoOps: Math.round(tiempoOps), tiempoAprobados: Math.round(tiempoAprobados), tiempoPendientes: Math.round(tiempoPendientes), turnos: turnosUso, ops: opsDetalle, pedidosAprobados: pedidosAprobadosLinea, pedidosPendientes: pedidosPendientesLinea };
    });
  }
  return { ok: true, fechaInicio: fechaInicio, fechaFin: fechaFin, jornadaMin: JORNADA_MINUTOS, lineas: lineasUnicas, datos: resultado };
}

function obtenerDatosPlantaListado(cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const empresaFiltro = user.perfil === "Administrador" ? null : user.empresa;
  const lineas = leerTodos("lineas").filter(l => String(l.estado).trim() === "Activo" && (empresaFiltro ? String(l.empresa).trim() === empresaFiltro : true));
  const ops = leerTodos("ordenes_produccion").filter(op => {
    const estado = String(op.estado).trim(); const emp = String(op.empresa).trim();
    if (empresaFiltro && emp !== empresaFiltro) return false;
    return ["Pendiente", "En proceso"].includes(estado);
  });
  const pedidos = leerTodos("pedidos"); const inventario = leerTodos("inventario_pt");
  let novedades = []; try { novedades = leerTodos("novedades"); } catch(e) {}
  const resultado = {};
  lineas.forEach(l => {
    const nombreLinea = String(l.linea).trim();
    if (!resultado[nombreLinea]) resultado[nombreLinea] = { linea: nombreLinea, capacidad: parseFloat(l.capacidad) || 0, um: l.um, procesos: l.procesos || "", ops: [] };
  });
  ops.forEach(op => {
    const nombreLinea = String(op.linea).trim();
    if (resultado[nombreLinea]) {
      const pedidoAsociado = pedidos.find(p => String(p.pedido).trim() === String(op.codigo_pedido).trim());
      const cantSolicitada = pedidoAsociado ? (parseFloat(pedidoAsociado.cantidad_solicitada) || 0) : 0;
      const fechaEntrega = pedidoAsociado ? formatearFecha(pedidoAsociado.fecha_preferida_entrega) : formatearFecha(op.fecha_entrega_despacho);
      const invDisponible = inventario.filter(i => 
          String(i.sku).trim() === String(op.sku_referencia).trim() && 
          String(i.estado_lote).trim() === "Disponible" &&
          String(i.pedido_asignado).trim() === op.codigo_pedido
      ).reduce((sum, i) => sum + (parseFloat(i.cantidad_disponible) || 0), 0);
      const opsActivas = ops.filter(o => String(o.codigo_pedido).trim() === String(op.codigo_pedido).trim() && String(o.sku_referencia).trim() === String(op.sku_referencia).trim() && ["Pendiente", "En proceso"].includes(String(o.estado).trim()));
      const totalEnOPs = opsActivas.reduce((sum, o) => sum + (parseFloat(o.cantidad_total_planeada) || 0), 0);
      const faltaProducir = Math.max(0, cantSolicitada - invDisponible - totalEnOPs);
      const novedadAsociada = novedades.find(n => String(n.pedido).trim() === op.codigo_pedido && String(n.estado_novedad).trim() === "Abierta" && String(n.tipo_novedad).includes("No Conforme"));
      resultado[nombreLinea].ops.push({ numero_op: op.numero_op, lote: op.lote, sku: op.sku_referencia, descripcion: op.descripcion_sku, cantidad_planeada: op.cantidad_total_planeada, unidad: op.unidad_medida, estado: op.estado, pedido: op.codigo_pedido, fecha_entrega: fechaEntrega, cant_solicitada: cantSolicitada, inv_pt: invDisponible, falta_producir: faltaProducir, ultimo_proceso: extraerUltimoProceso(op.observaciones_de_negociacion_planificador), tiene_no_conforme: novedadAsociada ? true : false });
    }
  });
  Object.keys(resultado).forEach(key => { resultado[key].ops.sort((a, b) => (a.fecha_entrega > b.fecha_entrega) ? 1 : -1); });
  return { ok: true, lineas: Object.values(resultado) };
}

function cambiarEstadoOP(numeroOP, nuevoEstado, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const sheet = abrirHoja("ordenes_produccion"); const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === numeroOP) { 
      sheet.getRange(i + 1, 17).setValue(nuevoEstado); 
      const row = sheet.getRange(i + 1, 1, 1, CAMPOS.ordenes_produccion.length).getValues()[0]; syncRowToFirestore("ordenes_produccion", row);
      return { ok: true, mensaje: "OP actualizada" }; 
    }
  }
  return { ok: false, error: "OP no encontrada" };
}

function registrarProcesoOP(datosProceso, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const sheetOP = abrirHoja("ordenes_produccion"); const dataOP = sheetOP.getDataRange().getValues();
  for (let i = 1; i < dataOP.length; i++) {
    if (String(dataOP[i][0]).trim() === datosProceso.numeroOP) {
      let obsActuales = String(dataOP[i][19] || "").trim();
      const nuevaNota = `[${formatearFechaHora(new Date().toISOString())} - ${user.nombre}] PROCESO: ${datosProceso.proceso}. ${datosProceso.observaciones || ''}`;
      sheetOP.getRange(i + 1, 20).setValue(obsActuales ? obsActuales + "\n---\n" + nuevaNota : nuevaNota);
      const row = sheetOP.getRange(i + 1, 1, 1, CAMPOS.ordenes_produccion.length).getValues()[0]; syncRowToFirestore("ordenes_produccion", row);
      return { ok: true, mensaje: "Proceso guardado en la OP" };
    }
  }
  return { ok: false, error: "OP no encontrada" };
}

function finalizarOPyEnviarPT(datosFinalizacion, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const sheetOP = abrirHoja("ordenes_produccion"); const dataOP = sheetOP.getDataRange().getValues();
  const sheetInv = abrirHoja("inventario_pt"); const dataInv = sheetInv.getDataRange().getValues();
  let opEncontrada = false, loteAsociado = "", codPedido = "", sku = "", linea = "";
  for (let i = 1; i < dataOP.length; i++) {
    if (String(dataOP[i][0]).trim() === datosFinalizacion.numeroOP) {
      sheetOP.getRange(i + 1, 7).setValue(datosFinalizacion.cantidadReal); sheetOP.getRange(i + 1, 17).setValue("Completada");
      loteAsociado = String(dataOP[i][4]).trim(); codPedido = String(dataOP[i][14]).trim(); sku = String(dataOP[i][3]).trim(); linea = String(dataOP[i][17]).trim();
      const rowOP = sheetOP.getRange(i + 1, 1, 1, CAMPOS.ordenes_produccion.length).getValues()[0]; syncRowToFirestore("ordenes_produccion", rowOP);
      opEncontrada = true; break;
    }
  }
  if (!opEncontrada) return { ok: false, error: "OP no encontrada" };
  for (let j = 1; j < dataInv.length; j++) {
    if (String(dataInv[j][1]).trim() === loteAsociado) { 
      sheetInv.getRange(j + 1, 5).setValue(datosFinalizacion.cantidadReal); sheetInv.getRange(j + 1, 6).setValue(datosFinalizacion.cantidadReal); sheetInv.getRange(j + 1, 10).setValue("Disponible"); 
      const rowInv = sheetInv.getRange(j + 1, 1, 1, CAMPOS.inventario_pt.length).getValues()[0]; syncRowToFirestore("inventario_pt", rowInv);
      break; 
    }
  }
  if (codPedido) {
    const sheetPed = abrirHoja("pedidos"); const dataPed = sheetPed.getDataRange().getValues();
    for (let k = 1; k < dataPed.length; k++) {
      if (String(dataPed[k][1]).trim() === codPedido) { 
        sheetPed.getRange(k + 1, 13).setValue("En inventario PT"); sheetPed.getRange(k + 1, 19).setValue("Listo"); 
        const rowPed = sheetPed.getRange(k + 1, 1, 1, CAMPOS.pedidos.length).getValues()[0]; syncRowToFirestore("pedidos", rowPed);
        break; 
      }
    }
  }
  if (datosFinalizacion.cantidadNoConforme > 0) {
    const sheetNov = abrirHoja("novedades");
    const novRow = ["NOV-NC-" + new Date().getTime(), user.empresa, "No Conforme", `Se reportaron ${datosFinalizacion.cantidadNoConforme} unidades NO CONFORMES en la OP ${datosFinalizacion.numeroOP}. Motivo: ${datosFinalizacion.motivoNoConforme}. Requiere reemplazo.`, codPedido, datosFinalizacion.numeroOP, sku, linea, formatearFechaHora(new Date().toISOString()), user.nombre, "Abierta", "Crítico", "", "", "", "", ""];
    sheetNov.appendRow(novRow); syncRowToFirestore("novedades", novRow);
  }
  return { ok: true, mensaje: "OP Finalizada. Producto enviado a PT." };
}

function registrarNovedadOperacion(datos, cedula) {
  const user = obtenerUsuarioPorCedula(cedula); if (!user) return { ok: false, error: "Usuario no encontrado" };
  const sheet = abrirHoja("novedades");
  const novRow = ["NOV-" + new Date().getTime(), user.empresa, datos.tipo, datos.descripcion, datos.pedido || "", datos.op || "", datos.sku || "", datos.linea || "", formatearFechaHora(new Date().toISOString()), user.nombre, "Abierta", "Alto", "", "", "", "", ""];
  sheet.appendRow(novRow); syncRowToFirestore("novedades", novRow);
  return { ok: true, mensaje: "Novedad registrada exitosamente" };
}

function obtenerPedidosDesdeSheets(cedula) {
  const u = obtenerUsuarioPorCedula(cedula); if (!u) return [];
  const pedidos = obtenerRegistros("pedidos", u.perfil === "Administrador" ? null : u.empresa);
  const ops = leerTodos("ordenes_produccion");
  pedidos.forEach(p => {
    const opAsociada = ops.find(op => String(op.codigo_pedido).trim() === p.pedido && String(op.sku_referencia).trim() === p.sku && ["Pendiente", "En proceso"].includes(String(op.estado).trim()));
    if (opAsociada) p.ultimo_proceso = extraerUltimoProceso(opAsociada.observaciones_de_negociacion_planificador);
  });
  return pedidos;
}
function obtenerEmpresasDesdeSheets(cedula) { const u = obtenerUsuarioPorCedula(cedula); return u ? (u.perfil === "Administrador" ? leerTodos("empresas") : leerTodos("empresas").filter(e => e.codigo_empresa === u.empresa)) : []; }
function obtenerSKUsDesdeSheets(empresa) { return obtenerRegistros("sku", empresa); }
function obtenerDestinatariosDesdeSheets(empresa) { return obtenerRegistros("destinatarios", empresa); }
function obtenerLineasDesdeSheets(empresa) { return obtenerRegistros("lineas", empresa); }
function obtenerLineasConMaquinas(cedula) { const u = obtenerUsuarioPorCedula(cedula); if(!u) return []; const lineas = leerTodos("lineas"); return u.perfil === "Administrador" ? lineas : lineas.filter(l => String(l.empresa).trim() === u.empresa); }
function obtenerEstadosDerivados(cedula) {
  try { const ordenes = leerTodos("ordenes_produccion"); const estados = {};
    ordenes.forEach(op => { const codPedido = String(op.codigo_pedido || "").trim(); if (codPedido && codPedido !== "") { if (String(op.estado || "").toLowerCase() === "en proceso") estados[codPedido] = "En producción"; else if (String(op.estado || "").toLowerCase() === "completada") estados[codPedido] = "En inventario PT"; } });
    return estados;
  } catch (e) { return {}; }
}

const FIRESTORE_PROJECT = "proguide-systems-tdea";
function obtenerTokenFirebase() { return ScriptApp.getOAuthToken(); }
function fechaFirestore() { return new Date().toISOString().replace(/\.\d{3}Z$/, "Z"); }
function normalizarDocId(valor) { return String(valor || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[\/\\#?\[\]*~%]/g, ""); }
function syncRowToFirestore(modulo, rawRowData) {
  const campos = CAMPOS[modulo]; const obj = {};
  campos.forEach((campo, idx) => { obj[normalizarKey(campo)] = String(rawRowData[idx] == null ? "" : rawRowData[idx]).trim(); });
  let docId = "";
  if (modulo === "pedidos") docId = obj.id_pedido_consecutivo;
  else if (modulo === "ordenes_produccion") docId = obj.numero_op;
  else if (modulo === "inventario_pt") docId = obj.lote;
  else if (modulo === "novedades") docId = obj.id_novedad;
  else if (modulo === "usuarios") docId = obj.cedula;
  else if (modulo === "sku") docId = obj.codigo_sku;
  else if (modulo === "empresas") docId = obj.codigo_empresa;
  else if (modulo === "destinatarios") docId = obj.cod_destinatario;
  else if (modulo === "lineas") docId = obj.id;
  if (docId) { guardarDocFirestore(modulo, docId, obj); }
}
function guardarDocFirestore(coleccion, docId, data) {
  const token = obtenerTokenFirebase();
  const urlCommit = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents:commit`;
  const nombreDoc = `projects/${FIRESTORE_PROJECT}/databases/(default)/documents/${coleccion}/${normalizarDocId(docId)}`;
  const fields = {};
  for (const key in data) {
    const valor = data[key];
    if (typeof valor === "number") { fields[key] = { doubleValue: valor }; } else { fields[key] = { stringValue: String(valor == null ? "" : valor) }; }
  }
  fields.sincronizado_el = { timestampValue: fechaFirestore() };
  const payload = { writes: [{ update: { name: nombreDoc, fields: fields } }] };
  UrlFetchApp.fetch(urlCommit, { method: "post", contentType: "application/json", headers: { Authorization: `Bearer ${token}` }, payload: JSON.stringify(payload), muteHttpExceptions: true });
}
function eliminarDocFirestore(coleccion, docId) {
  const token = obtenerTokenFirebase();
  const urlCommit = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents:commit`;
  const nombreDoc = `projects/${FIRESTORE_PROJECT}/databases/(default)/documents/${coleccion}/${normalizarDocId(docId)}`;
  const payload = { writes: [{ delete: nombreDoc }] };
  UrlFetchApp.fetch(urlCommit, { method: "post", contentType: "application/json", headers: { Authorization: `Bearer ${token}` }, payload: JSON.stringify(payload), muteHttpExceptions: true });
}
function sincronizarTodoFirebase() {
  Logger.log("🚀 Iniciando sincronización TOTAL...");
  const modulos = ["empresas", "destinatarios", "lineas", "sku", "usuarios", "pedidos", "ordenes_produccion", "inventario_pt", "novedades"];
  modulos.forEach(modulo => {
    try {
      const sheet = abrirHoja(modulo); const data = sheet.getDataRange().getValues();
      if (data.length > 1) {
        for (let i = 1; i < data.length; i++) { syncRowToFirestore(modulo, data[i]); }
        Logger.log(`✅ ${modulo} sincronizado (${data.length - 1} registros).`);
      }
    } catch (e) { Logger.log(`⚠️ Error sincronizando ${modulo}: ${e.message}`); }
  });
  Logger.log("🎉 ¡Sincronización TOTAL completada!");
}

function resetearTodoParaPresentacion() {
  Logger.log("🧹 Iniciando limpieza profunda del sistema...");
  const modulos = Object.keys(SHEETS);
  modulos.forEach(modulo => {
    try {
      const sheet = abrirHoja(modulo);
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) { sheet.deleteRows(2, lastRow - 1); }
    } catch (e) { Logger.log(`⚠️ No se pudo limpiar ${modulo}`); }
  });
  Logger.log("✅ Google Sheets limpio.");
  const token = ScriptApp.getOAuthToken();
  const colecciones = ["pedidos", "ordenes_produccion", "inventario_pt", "novedades", "usuarios", "sku", "empresas", "destinatarios", "lineas"];
  colecciones.forEach(coleccion => {
    try {
      const urlList = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents/${coleccion}?pageSize=500`;
      const res = UrlFetchApp.fetch(urlList, { headers: { Authorization: `Bearer ${token}` }, muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const json = JSON.parse(res.getContentText());
        const docs = json.documents || [];
        if (docs.length > 0) {
          const writes = docs.map(doc => ({ delete: doc.name }));
          const urlCommit = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents:commit`;
          UrlFetchApp.fetch(urlCommit, { method: "post", contentType: "application/json", headers: { Authorization: `Bearer ${token}` }, payload: JSON.stringify({ writes: writes }), muteHttpExceptions: true });
        }
      }
    } catch (e) { Logger.log(`⚠️ Error limpiando Firebase en ${coleccion}`); }
  });
  Logger.log("🎉 ¡SISTEMA TOTALMENTE LIMPIO!");
}

function cargarEscenarioNivelDios() {
  Logger.log("🚀 Iniciando carga masiva NIVEL DIOS (Base de datos x5)...");
  const hoy = new Date();
  const f = (dias) => { const d = new Date(hoy); d.setDate(hoy.getDate() + dias); return d.toISOString().split('T')[0]; };
  const sheetEmp = abrirHoja("empresas"); sheetEmp.clear();
  sheetEmp.appendRow(["Codigo empresa", "Razon social", "NIT", "Direccion", "Contacto tel", "correo", "Departamento", "Ciudad", "Estado empresa"]);
  sheetEmp.appendRow(["EMP-001", "Alimentos Delicias S.A.", "900111222-1", "Calle 10 # 1-1", "3001112222", "contacto@delicias.com", "Antioquia", "Medellín", "Activo"]);
  sheetEmp.appendRow(["EMP-002", "AutoPartes Global", "900222333-2", "Carrera 20 # 2-2", "3002223333", "contacto@autopartes.com", "Cundinamarca", "Bogotá", "Activo"]);
  sheetEmp.appendRow(["EMP-003", "NutriAnimal S.A.S.", "900333444-3", "Av 30 # 3-3", "3003334444", "contacto@nutrianimal.com", "Valle", "Cali", "Activo"]);
  sheetEmp.appendRow(["EMP-004", "Cárnicos Premium", "900444555-4", "Calle 40 # 4-4", "3004445555", "contacto@carnicos.com", "Antioquia", "Medellín", "Activo"]);
  sheetEmp.appendRow(["EMP-005", "ElectroHogar S.A.", "900555666-5", "Carrera 50 # 5-5", "3005556666", "contacto@electrohogar.com", "Atlántico", "Barranquilla", "Activo"]);
  const sheetDest = abrirHoja("destinatarios"); sheetDest.clear();
  sheetDest.appendRow(["Cod destinatario", "Nombre destinatario", "Correo", "Telefono", "Codigo empresa", "Estado Destinatario"]);
  sheetDest.appendRow(["DEST-01", "Éxito Envigado", "envigado@exito.com", "3101111111", "EMP-001", "Activo"]);
  sheetDest.appendRow(["DEST-02", "Carulla Poblado", "poblado@carulla.com", "3102222222", "EMP-001", "Activo"]);
  sheetDest.appendRow(["DEST-03", "Olímpica Centro", "centro@olimpica.com", "3103333333", "EMP-001", "Activo"]);
  sheetDest.appendRow(["DEST-04", "Concesionario Norte", "norte@autopartes.com", "3104444444", "EMP-002", "Activo"]);
  sheetDest.appendRow(["DEST-05", "Taller Central", "central@autopartes.com", "3105555555", "EMP-002", "Activo"]);
  sheetDest.appendRow(["DEST-06", "Agropecuaria Sur", "sur@nutrianimal.com", "3106666666", "EMP-003", "Activo"]);
  sheetDest.appendRow(["DEST-07", "Finca El Porvenir", "porvenir@agro.com", "3107777777", "EMP-003", "Activo"]);
  sheetDest.appendRow(["DEST-08", "Restaurante El Buen Sabor", "reservas@buensabor.com", "3108888888", "EMP-004", "Activo"]);
  sheetDest.appendRow(["DEST-09", "Surtimax Carnes", "carnes@surtimax.com", "3109999999", "EMP-004", "Activo"]);
  sheetDest.appendRow(["DEST-10", "Alkosto", "compras@alkosto.com", "3110000000", "EMP-005", "Activo"]);
  sheetDest.appendRow(["DEST-11", "Falabella", "compras@falabella.com", "3111111111", "EMP-005", "Activo"]);
  const sheetLin = abrirHoja("lineas"); sheetLin.clear();
  sheetLin.appendRow(["Linea", "Maquina", "Capacidad", "UM", "Estado", "Empresa", "Procesos", "ID"]);
  sheetLin.appendRow(["L1-Alimentos", "Horno Industrial", 500, "KG", "Activo", "EMP-001", "Mezcla, Horneado, Empaque", "LIN-ALI-01"]);
  sheetLin.appendRow(["L2-Alimentos", "Envasadora al Vacío", 200, "UNIDADES", "Activo", "EMP-001", "Llenado, Sellado", "LIN-ALI-02"]);
  sheetLin.appendRow(["L1-Auto", "Ensambladora", 100, "UNIDADES", "Activo", "EMP-002", "Chasis, Motor, Pintura", "LIN-AUT-01"]);
  sheetLin.appendRow(["L2-Auto", "Inyectora de Plástico", 500, "KG", "Activo", "EMP-002", "Fundido, Moldeado", "LIN-AUT-02"]);
  sheetLin.appendRow(["L1-Concentrados", "Molino", 2000, "KG", "Activo", "EMP-003", "Molienda, Mezcla", "LIN-CON-01"]);
  sheetLin.appendRow(["L1-Cárnicos", "Sierra de Desposte", 800, "KG", "Activo", "EMP-004", "Corte, Limpieza", "LIN-CAR-01"]);
  sheetLin.appendRow(["L1-Electro", "Línea de Ensamble PCB", 300, "UNIDADES", "Activo", "EMP-005", "Soldadura, Pruebas", "LIN-ELE-01"]);
  const sheetSku = abrirHoja("sku"); sheetSku.clear();
  sheetSku.appendRow(["Codigo SKU", "Descripcion SKU", "Cod destinatario", "UN medida", "Presentacion", "Caracteristicas", "Modelo manufactura", "Tiempo estandar po", "Linea de produc", "Stock minimo si MTO", "Estado SKU", "Empresa"]);
  const skus = [
    ["1001", "Galletas de Avena", "DEST-01", "UNIDADES", "10", "Alimento", "MTO", "2", "L1-Alimentos", "50", "Activo", "EMP-001"],
    ["1002", "Chocolatina Jet", "DEST-02", "UNIDADES", "20", "Alimento", "MTS", "1", "L2-Alimentos", "100", "Activo", "EMP-001"],
    ["1003", "Papas Margarita", "DEST-03", "UNIDADES", "15", "Alimento", "MTS", "1.5", "L2-Alimentos", "80", "Activo", "EMP-001"],
    ["1004", "Maní Salado", "DEST-01", "UNIDADES", "10", "Alimento", "MTS", "1.2", "L2-Alimentos", "40", "Activo", "EMP-001"],
    ["1005", "Gaseosa Cola 1.5L", "DEST-02", "UNIDADES", "6", "Bebida", "MTO", "0.8", "L2-Alimentos", "60", "Activo", "EMP-001"],
    ["2001", "Frenos ABS Delanteros", "DEST-04", "UNIDADES", "1", "Automotriz", "MTO", "15", "L1-Auto", "10", "Activo", "EMP-002"],
    ["2002", "Filtro de Aceite", "DEST-05", "UNIDADES", "1", "Automotriz", "MTS", "5", "L2-Auto", "30", "Activo", "EMP-002"],
    ["2003", "Bujías de Iridio", "DEST-04", "UNIDADES", "4", "Automotriz", "MTS", "2", "L2-Auto", "50", "Activo", "EMP-002"],
    ["2004", "Aceite Sintético", "DEST-05", "LITROS", "1", "Químico", "MTO", "3", "L2-Auto", "20", "Activo", "EMP-002"],
    ["2005", "Amortiguadores", "DEST-04", "UNIDADES", "1", "Automotriz", "MTO", "20", "L1-Auto", "8", "Activo", "EMP-002"],
    ["3001", "Concentrado Bovino 40kg", "DEST-06", "KG", "40", "Agro", "MTO", "10", "L1-Concentrados", "20", "Activo", "EMP-003"],
    ["3002", "Concentrado Porcino 40kg", "DEST-07", "KG", "40", "Agro", "MTO", "10", "L1-Concentrados", "15", "Activo", "EMP-003"],
    ["3003", "Concentrado Aves 20kg", "DEST-06", "KG", "20", "Agro", "MTO", "8", "L1-Concentrados", "30", "Activo", "EMP-003"],
    ["3004", "Sal Mineralizada", "DEST-07", "KG", "10", "Agro", "MTS", "5", "L1-Concentrados", "40", "Activo", "EMP-003"],
    ["3005", "Melaza de Caña", "DEST-06", "LITROS", "20", "Agro", "MTS", "4", "L1-Concentrados", "25", "Activo", "EMP-003"],
    ["4001", "Lomo de Cerdo", "DEST-08", "KG", "5", "Cárnico", "MTO", "8", "L1-Cárnicos", "15", "Activo", "EMP-004"],
    ["4002", "Costilla de Res", "DEST-09", "KG", "10", "Cárnico", "MTO", "12", "L1-Cárnicos", "10", "Activo", "EMP-004"],
    ["4003", "Punta de Anca", "DEST-08", "KG", "8", "Cárnico", "MTO", "9", "L1-Cárnicos", "12", "Activo", "EMP-004"],
    ["4004", "Muchacho de Res", "DEST-09", "KG", "5", "Cárnico", "MTO", "10", "L1-Cárnicos", "14", "Activo", "EMP-004"],
    ["4005", "Chorizo Santarrosano", "DEST-08", "UNIDADES", "12", "Cárnico", "MTS", "3", "L1-Cárnicos", "20", "Activo", "EMP-004"],
    ["5001", "Licuadora 500W", "DEST-10", "UNIDADES", "1", "Hogar", "MTO", "12", "L1-Electro", "5", "Activo", "EMP-005"],
    ["5002", "Tostadora 2 Puestos", "DEST-11", "UNIDADES", "1", "Hogar", "MTO", "10", "L1-Electro", "8", "Activo", "EMP-005"],
    ["5003", "Microondas 20L", "DEST-10", "UNIDADES", "1", "Hogar", "MTO", "25", "L1-Electro", "3", "Activo", "EMP-005"],
    ["5004", "Freidora de Aire", "DEST-11", "UNIDADES", "1", "Hogar", "MTO", "18", "L1-Electro", "4", "Activo", "EMP-005"],
    ["5005", "Batidora de Pedestal", "DEST-10", "UNIDADES", "1", "Hogar", "MTO", "15", "L1-Electro", "6", "Activo", "EMP-005"]
  ];
  skus.forEach(s => sheetSku.appendRow(s));
  const sheetUsr = abrirHoja("usuarios"); sheetUsr.clear();
  sheetUsr.appendRow(["Cedula", "Nombre", "Perfil", "Sede", "Area", "Correo", "Contraseña", "Estado", "Ultimo_ingreso", "Empresa"]);
  sheetUsr.appendRow(["1000", "Admin Global", "Administrador", "Central", "TI", "admin@proguide.com", "AD1000", "Activo", "", "GLOBAL"]);
  const usuariosDemo = [
    ["1001", "KAM Delicias", "KAM Logístico", "Medellín", "Ventas", "kam@delicias.com", "KA1001", "EMP-001"],
    ["1002", "Plan Delicias", "Planificador", "Medellín", "Planta", "plan@delicias.com", "PL1002", "EMP-001"],
    ["1003", "Op Delicias", "Operario", "Medellín", "Planta", "op@delicias.com", "OP1003", "EMP-001"],
    ["1004", "Coord Delicias", "Coordinador planta", "Medellín", "Planta", "coord@delicias.com", "CO1004", "EMP-001"],
    ["1005", "DM Delicias", "Datos maestros", "Medellín", "TI", "dm@delicias.com", "DM1005", "EMP-001"],
    ["2001", "KAM AutoPartes", "KAM Logístico", "Bogotá", "Ventas", "kam@autopartes.com", "KA2001", "EMP-002"],
    ["2002", "Plan AutoPartes", "Planificador", "Bogotá", "Planta", "plan@autopartes.com", "PL2002", "EMP-002"],
    ["2003", "Op AutoPartes", "Operario", "Bogotá", "Planta", "op@autopartes.com", "OP2003", "EMP-002"],
    ["2004", "Coord AutoPartes", "Coordinador planta", "Bogotá", "Planta", "coord@autopartes.com", "CO2004", "EMP-002"],
    ["2005", "DM AutoPartes", "Datos maestros", "Bogotá", "TI", "dm@autopartes.com", "DM2005", "EMP-002"],
    ["3001", "KAM NutriAnimal", "KAM Logístico", "Cali", "Ventas", "kam@nutrianimal.com", "KA3001", "EMP-003"],
    ["3002", "Plan NutriAnimal", "Planificador", "Cali", "Planta", "plan@nutrianimal.com", "PL3002", "EMP-003"],
    ["3003", "Op NutriAnimal", "Operario", "Cali", "Planta", "op@nutrianimal.com", "OP3003", "EMP-003"],
    ["3004", "Coord NutriAnimal", "Coordinador planta", "Cali", "Planta", "coord@nutrianimal.com", "CO3004", "EMP-003"],
    ["3005", "DM NutriAnimal", "Datos maestros", "Cali", "TI", "dm@nutrianimal.com", "DM3005", "EMP-003"],
    ["4001", "KAM Cárnicos", "KAM Logístico", "Medellín", "Ventas", "kam@carnicos.com", "KA4001", "EMP-004"],
    ["4002", "Plan Cárnicos", "Planificador", "Medellín", "Planta", "plan@carnicos.com", "PL4002", "EMP-004"],
    ["4003", "Op Cárnicos", "Operario", "Medellín", "Planta", "op@carnicos.com", "OP4003", "EMP-004"],
    ["4004", "Coord Cárnicos", "Coordinador planta", "Medellín", "Planta", "coord@carnicos.com", "CO4004", "EMP-004"],
    ["4005", "DM Cárnicos", "Datos maestros", "Medellín", "TI", "dm@carnicos.com", "DM4005", "EMP-004"],
    ["5001", "KAM ElectroHogar", "KAM Logístico", "Barranquilla", "Ventas", "kam@electrohogar.com", "KA5001", "EMP-005"],
    ["5002", "Plan ElectroHogar", "Planificador", "Barranquilla", "Planta", "plan@electrohogar.com", "PL5002", "EMP-005"],
    ["5003", "Op ElectroHogar", "Operario", "Barranquilla", "Planta", "op@electrohogar.com", "OP5003", "EMP-005"],
    ["5004", "Coord ElectroHogar", "Coordinador planta", "Barranquilla", "Planta", "coord@electrohogar.com", "CO5004", "EMP-005"],
    ["5005", "DM ElectroHogar", "Datos maestros", "Barranquilla", "TI", "dm@electrohogar.com", "DM5005", "EMP-005"]
  ];
  usuariosDemo.forEach(u => sheetUsr.appendRow([u[0], u[1], u[2], u[3], u[4], u[5], u[6], "Activo", "", u[7]]));
  const sheetPed = abrirHoja("pedidos"); sheetPed.clear();
  sheetPed.appendRow(["ID Pedido consecutivo", "Pedido", "Num Pedido", "Empresa", "Destinatario", "SKU", "Descripción SKU", "Cantidad Solicitada", "Fecha Preferida Entrega", "Hora Entrega", "Urgencia", "Fecha Entrega Planta", "Estado Pedido", "Prioridad", "Programador", "Fecha Creación", "Observaciones", "Ultima edicion", "Estado Producción"]);
  const pedidos = []; let contadorLinea = 1;
  const estados = ["Pendiente", "Aprobado", "En producción", "En inventario PT", "Despachado", "Cancelado"];
  const empresasData = [
    { id: "EMP-001", skus: ["1001", "1002", "1003", "1004", "1005"], dest: ["DEST-01", "DEST-02", "DEST-03"], lineas: ["L1-Alimentos", "L2-Alimentos"] },
    { id: "EMP-002", skus: ["2001", "2002", "2003", "2004", "2005"], dest: ["DEST-04", "DEST-05"], lineas: ["L1-Auto", "L2-Auto"] },
    { id: "EMP-003", skus: ["3001", "3002", "3003", "3004", "3005"], dest: ["DEST-06", "DEST-07"], lineas: ["L1-Concentrados"] },
    { id: "EMP-004", skus: ["4001", "4002", "4003", "4004", "4005"], dest: ["DEST-08", "DEST-09"], lineas: ["L1-Cárnicos"] },
    { id: "EMP-005", skus: ["5001", "5002", "5003", "5004", "5005"], dest: ["DEST-10", "DEST-11"], lineas: ["L1-Electro"] }
  ];
  for (let i = 1; i <= 50; i++) {
    const emp = empresasData[i % 5];
    const numPedido = `2026${String(i).padStart(5, "0")}`;
    const pedidoCod = `PED-2026-${String(i).padStart(5, "0")}`;
    const estado = estados[i % estados.length];
    const cant = Math.floor(Math.random() * 4000) + 500; 
    const fechaPref = f(Math.floor(Math.random() * 20) - 5); 
    pedidos.push([`PL-${contadorLinea++}`, pedidoCod, numPedido, emp.id, emp.dest[i % emp.dest.length], emp.skus[i % emp.skus.length], "Descripción de prueba", cant, fechaPref, "10:00", "Alta", f(0), estado, "1", "", "Generación masiva"]);
    if (i % 5 === 0) {
      pedidos.push([`PL-${contadorLinea++}`, pedidoCod, numPedido, emp.id, emp.dest[i % emp.dest.length], emp.skus[(i+1) % emp.skus.length], "Descripción de prueba", cant/2, fechaPref, "10:00", "Alta", f(0), estado, "1", "", "Línea adicional Multi-SKU"]);
    }
  }
  pedidos.forEach(p => { sheetPed.appendRow([p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10], p[11], p[12], p[13], p[14], new Date().toISOString(), p[15], "", ""]); });
  const sheetOP = abrirHoja("ordenes_produccion"); sheetOP.clear();
  sheetOP.appendRow(["Numero OP", "Empresa", "Descripción SKU", "SKU Referencia", "Lote", "Cantidad Total Planeada", "Cantidad Total Real", "Presentación", "Unidades Planeadas", "Unidad Medida", "Fecha Entrega Despacho", "Hora Entrega", "Fecha Producción", "Hora Producción", "Código Pedido", "Destinatario Cliente", "Estado", "Línea", "Usuario Creador OP", "Observaciones de Negociacion planificador"]);
  const ops = []; let numOP = 1; let numLote = 1;
  pedidos.filter(p => p[12] === "En producción" || p[12] === "Aprobado").forEach((p, index) => {
    const empData = empresasData.find(e => e.id === p[3]);
    const cantOP = Math.min(p[7], 500); 
    const estadoOP = p[12] === "En producción" ? "En proceso" : "Pendiente";
    const fechaProd = f(Math.floor(Math.random() * 10) - 3); 
    ops.push([`OP-2026-${String(numOP++).padStart(5, "0")}`, p[3], p[6], p[5], `LOT-${String(numLote++).padStart(5, "0")}`, cantOP, "", 1, cantOP, "UNIDADES", p[8], "10:00", fechaProd, "08:00", p[1], p[4], estadoOP, empData.lineas[0], "Planificador", estadoOP === "En proceso" ? "[PROCESO: Mezcla]" : ""]);
  });
  ops.forEach(o => sheetOP.appendRow(o));
  const sheetInv = abrirHoja("inventario_pt"); sheetInv.clear();
  sheetInv.appendRow(["SKU", "Lote", "Empresa", "Descripción SKU", "Cantidad Total", "Cantidad Disponible", "Unidad Medida", "Fecha Producción", "Ubicación", "Estado Lote", "OP Origen", "Pedido Asignado"]);
  let numLoteInv = 1;
  pedidos.filter(p => p[12] === "En inventario PT" || p[12] === "Despachado").forEach(p => {
    const lot = `LOT-${String(numLoteInv++).padStart(5, "0")}`;
    sheetInv.appendRow([p[5], lot, p[3], "Desc", p[7], p[7], "UNIDADES", f(-2), "Bodega 1", "Disponible", "OP-VIEJA", p[1]]);
  });
  const sheetNov = abrirHoja("novedades"); sheetNov.clear();
  sheetNov.appendRow(["ID Novedad", "Empresa", "Tipo Novedad", "Descripción", "Pedido", "OP", "SKU", "Línea", "Fecha Reporte", "Reportado Por", "Estado Novedad", "Impacto", "Responsable Gestión", "Fecha Gestión", "Fecha Cierre", "Cerrado Por", "Observaciones"]);
  sheetNov.appendRow(["NOV-001", "EMP-002", "No Conforme", "5 unidades con falla en frenado.", "PED-2026-00004", "OP-2026-00001", "2001", "L1-Auto", new Date().toISOString(), "Op AutoPartes", "Abierta", "Crítico", "", "", "", "", ""]);
  sheetNov.appendRow(["NOV-002", "EMP-001", "Paro por Mantenimiento", "Horno detenido por mantenimiento.", "", "", "", "L1-Alimentos", new Date().toISOString(), "Op Delicias", "Abierta", "Alto", "", "", "", "", ""]);
  sheetNov.appendRow(["NOV-003", "EMP-004", "Falta de Insumos", "Falta empaque al vacío para el Lomo.", "PED-2026-00008", "OP-2026-00008", "4001", "L1-Cárnicos", new Date().toISOString(), "Op Cárnicos", "Abierta", "Medio", "", "", "", "", ""]);
  sheetNov.appendRow(["NOV-004", "EMP-003", "No Conforme", "Lote de concentrado fuera de especificación.", "PED-2026-00009", "", "3001", "L1-Concentrados", new Date().toISOString(), "Op NutriAnimal", "Abierta", "Crítico", "", "", "", "", ""]);
  Logger.log("🌟 Base de datos masiva x5 insertada exitosamente.");
  Logger.log("🔥 Iniciando sincronización automática con Firebase...");
  sincronizarTodoFirebase();
  Logger.log("🎉 ¡Proceso completado!");
}