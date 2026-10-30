/**
 * PROGUIDE SYSTEMS — Backend multi-módulo con Login, Permisos dinámicos y Capa de Validación NoSQL
 */

const MODULOS = {
  sku: {
    sheetsId:  "1rOU2yfKxE-zAxGgWWfKlT5OPLToYc39Thik2CE87ur0",
    pestaña:   "SKU",
    coleccion: "sku",
    campos: ["codigo_sku", "descripcion_sku", "cod_destinatario", "unidad_medida", "presentacion", "caracteristicas", "modelo_manufactura", "tiempo_estandar_unidad", "linea_produccion_habitual", "stock_minimo", "estado_sku", "empresa"],
    tipos: { tiempo_estandar_unidad: "double", stock_minimo: "integer" }
  },
  empresas: {
    sheetsId:  "1g4j8EbwOC349MFsb9SnscjsWIYpThTGpbNpHRNRM640",
    pestaña:   "Clasificacion empresas",
    coleccion: "empresas",
    campos: ["cod_empresa", "razon_social", "nit_identificacion", "direccion", "telefono_contacto", "correo_contacto", "departamento", "ciudad", "estado_empresa"],
    tipos: {}
  },
  destinatarios: {
    sheetsId:  "1DoSDkBWAD1MAkkGzfliHDPyHQY83MOyKMRn6vd7kzM8",
    pestaña:   "Destinatarios",
    coleccion: "destinatarios",
    campos: ["cod_destinatario", "nombre_destinatario", "correo", "telefono", "codigo_empresa", "estado_destinatario"],
    tipos: {}
  },
  lineas: {
    sheetsId:  "1I-hJB2IVAIEML4320EKev0UTW6HwfJIyxDYIaWMYL9w",
    pestaña:   "Lineas y maquinas",
    coleccion: "lineas",
    campos: ["linea", "maquina", "capacidad", "um", "estado", "empresa", "procesos", "id"],
    tipos: { capacidad: "double" }
  },
  usuarios: {
    sheetsId:  "1G2M5l0JgXvyiBNOEO2ITooU5nzDhNpyR_XIbv0rQKfY",
    pestaña:   "Registro",
    pestañaPermisos: "Permisos",
    coleccion: "usuarios",
    campos: ["cedula", "nombre", "perfil", "sede", "area", "correo", "contraseña", "estado", "ultimo_ingreso", "empresa"],
    tipos: {}
  }
};

const FIRESTORE_PROJECT = "proguide-systems-tdea";

function obtenerTokenFirebase() { 
  return ScriptApp.getOAuthToken(); 
}

function fechaFirestore() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function normalizarDocId(valor) {
  return String(valor || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[\/\\#?\[\]*~%]/g, "");
}

function abrirHoja(modulo) {
  const config = MODULOS[modulo];
  if (!config) throw new Error("Módulo desconocido: " + modulo);
  const ss = SpreadsheetApp.openById(config.sheetsId);
  const sheet = ss.getSheetByName(config.pestaña) || ss.getSheets()[0];
  if (!sheet) throw new Error("No se encontró la pestaña '" + config.pestaña + "'");
  return sheet;
}

function doGet(e) {
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

function include(nombre) { 
  return HtmlService.createHtmlOutputFromFile(nombre).getContent(); 
}

function obtenerAppHTML() { 
  return HtmlService.createTemplateFromFile('Index').evaluate().getContent(); 
}

function generarPasswordDesdeNombre(cedula, nombre) {
  const partes = String(nombre).trim().split(/\s+/);
  let iniciales = "";
  if (partes.length === 1) { 
    iniciales = partes[0].substring(0, 2); 
  } else {
    iniciales += partes[0] ? partes[0].charAt(0) : "";
    iniciales += partes[1] ? partes[1].charAt(0) : "";
    iniciales += partes[2] ? partes[2].charAt(0) : "";
  }
  const ultimos4 = String(cedula).trim().slice(-4);
  return (iniciales + ultimos4).toUpperCase();
}

// =========================================================================
// VALIDACIONES Y FORMATEO
// =========================================================================

function formatoNombrePropio(texto) {
  if (!texto) return "";
  return String(texto).trim().toLowerCase()
    .replace(/(?:^|\s|[-/])\S/g, function(caracter) {
      return caracter.toUpperCase();
    })
    .replace(/\s+/g, " ");
}

function esCorreoValido(correo) {
  const patron = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return patron.test(String(correo).trim());
}

function esDireccionValida(direccion) {
  const dir = String(direccion).trim();
  if (dir.length < 5) return false;
  const patronVia = /^(cl|cll|calle|cr|cra|carrera|dg|diagonal|tv|transversal|av|avenida|aut|autopista|circ|circular|manzana|mz|km|kilometro)\b/i;
  return patronVia.test(dir) || /[0-9#\-]/.test(dir);
}

function esTelefonoValido(telefono) {
  const digitos = String(telefono).replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 12;
}

function validarYFormatearDatos(modulo, data) {
  if (!data) throw new Error("No se recibieron datos para procesar.");

  switch (modulo) {
    case "empresas":
      if (!data.cod_empresa || String(data.cod_empresa).trim() === "") {
        throw new Error("El código de empresa es obligatorio.");
      }
      if (!data.razon_social || String(data.razon_social).trim().length < 3) {
        throw new Error("La razón social debe tener al menos 3 caracteres.");
      }
      data.razon_social = formatoNombrePropio(data.razon_social);

      if (data.correo_contacto && String(data.correo_contacto).trim() !== "") {
        if (!esCorreoValido(data.correo_contacto)) {
          throw new Error("El correo de contacto no tiene un formato válido (ej: contacto@empresa.com).");
        }
        data.correo_contacto = String(data.correo_contacto).trim().toLowerCase();
      }

      if (data.direccion && String(data.direccion).trim() !== "") {
        if (!esDireccionValida(data.direccion)) {
          throw new Error("La dirección debe incluir nomenclatura válida (Ej: Calle, Carrera, Cra, Cll) y numeración.");
        }
        data.direccion = formatoNombrePropio(data.direccion);
      }

      if (data.telefono_contacto && String(data.telefono_contacto).trim() !== "") {
        if (!esTelefonoValido(data.telefono_contacto)) {
          throw new Error("El teléfono de la empresa debe contener entre 7 y 12 dígitos numéricos.");
        }
      }

      if (data.departamento) data.departamento = formatoNombrePropio(data.departamento);
      if (data.ciudad) data.ciudad = formatoNombrePropio(data.ciudad);
      break;

    case "destinatarios":
      if (!data.nombre_destinatario || String(data.nombre_destinatario).trim().length < 3) {
        throw new Error("El nombre del destinatario es obligatorio (mínimo 3 caracteres).");
      }
      data.nombre_destinatario = String(data.nombre_destinatario).trim().toUpperCase();

      if (data.correo && String(data.correo).trim() !== "") {
        if (!esCorreoValido(data.correo)) {
          throw new Error("El correo del destinatario es inválido (ej: cliente@correo.com).");
        }
        data.correo = String(data.correo).trim().toLowerCase();
      }

      if (data.telefono && String(data.telefono).trim() !== "") {
        if (!esTelefonoValido(data.telefono)) {
          throw new Error("El teléfono del destinatario debe contener entre 7 y 12 dígitos numéricos.");
        }
      }

      if (!data.codigo_empresa || String(data.codigo_empresa).trim() === "") {
        throw new Error("Debe asociar una empresa válida al destinatario.");
      }
      break;

    case "sku":
      if (!data.codigo_sku || String(data.codigo_sku).trim() === "") {
        throw new Error("El código SKU es obligatorio.");
      }
      data.codigo_sku = String(data.codigo_sku).trim().toUpperCase();

      if (!data.descripcion_sku || String(data.descripcion_sku).trim().length < 3) {
        throw new Error("La descripción del SKU es obligatoria.");
      }
      data.descripcion_sku = formatoNombrePropio(data.descripcion_sku);

      if (Number(data.tiempo_estandar_unidad) < 0) {
        throw new Error("El tiempo estándar no puede ser un número negativo.");
      }
      if (Number(data.stock_minimo) < 0) {
        throw new Error("El stock mínimo no puede ser un número negativo.");
      }
      if (!data.empresa || String(data.empresa).trim() === "") {
        throw new Error("Debe seleccionar una empresa para este SKU.");
      }
      break;

    case "lineas":
      if (!data.linea || String(data.linea).trim() === "") {
        throw new Error("El nombre de la línea es obligatorio.");
      }
      if (!data.maquina || String(data.maquina).trim() === "") {
        throw new Error("El nombre de la máquina es obligatorio.");
      }
      data.linea = formatoNombrePropio(data.linea);
      data.maquina = formatoNombrePropio(data.maquina);

      if (Number(data.capacidad) <= 0) {
        throw new Error("La capacidad de la máquina debe ser mayor a 0.");
      }
      if (!data.empresa || String(data.empresa).trim() === "") {
        throw new Error("Debe seleccionar una empresa para esta línea/máquina.");
      }
      break;

    case "usuarios":
      const digitosCedula = String(data.cedula || "").replace(/\D/g, "");
      if (digitosCedula.length < 6 || digitosCedula.length > 12) {
        throw new Error("La cédula debe contener solo números (entre 6 y 12 dígitos).");
      }
      data.cedula = digitosCedula;

      if (!data.nombre || String(data.nombre).trim().length < 3) {
        throw new Error("El nombre completo es obligatorio.");
      }
      data.nombre = formatoNombrePropio(data.nombre);

      if (!data.correo || !esCorreoValido(data.correo)) {
        throw new Error("Debe ingresar un correo electrónico corporativo o personal válido.");
      }
      data.correo = String(data.correo).trim().toLowerCase();

      if (!data.empresa || String(data.empresa).trim() === "") {
        throw new Error("Debe asignar una empresa al usuario.");
      }

      if (data.sede) data.sede = formatoNombrePropio(data.sede);
      if (data.area) data.area = formatoNombrePropio(data.area);
      break;
  }

  return data;
}

// =========================================================================
// OPERACIONES PRINCIPALES
// =========================================================================

function obtenerRegistros(modulo, empresaFiltro) {
  const config = MODULOS[modulo];
  if (!config) throw new Error("Módulo no configurado: " + modulo);
  const sheet = abrirHoja(modulo);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const registros = [];

  let colEmpresa = config.campos.indexOf("empresa");
  if (colEmpresa === -1) colEmpresa = config.campos.indexOf("codigo_empresa");
  if (colEmpresa === -1) colEmpresa = config.campos.indexOf("cod_empresa");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] || String(row[0]).trim() === "") continue;

    if (empresaFiltro && empresaFiltro !== "GLOBAL" && colEmpresa !== -1) {
      if (String(row[colEmpresa]).trim() !== String(empresaFiltro).trim()) continue;
    }

    const obj = {};
    config.campos.forEach((campo, idx) => {
      const raw = row[idx];
      if (config.tipos && config.tipos[campo] === "double") obj[campo] = parseFloat(String(raw).replace(",", ".")) || 0;
      else if (config.tipos && config.tipos[campo] === "integer") obj[campo] = parseInt(raw, 10) || 0;
      else obj[campo] = String(raw == null ? "" : raw).trim();
    });
    registros.push(obj);
  }
  return registros;
}

function obtenerSKUsDesdeSheets(empresa)          { return obtenerRegistros("sku", empresa); }
function obtenerEmpresasDesdeSheets()             { return obtenerRegistros("empresas"); }
function obtenerDestinatariosDesdeSheets(empresa) { return obtenerRegistros("destinatarios", empresa); }
function obtenerLineasMaquinasDesdeSheets(empresa){ return obtenerRegistros("lineas", empresa); }
function obtenerUsuariosDesdeSheets(empresa)      { return obtenerRegistros("usuarios", empresa); }

function leerMatrizPermisos() {
  const ss = SpreadsheetApp.openById(MODULOS.usuarios.sheetsId);
  const sheet = ss.getSheetByName(MODULOS.usuarios.pestañaPermisos);
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};
  const headers = data[0]; 
  const matriz = {};
  for (let i = 1; i < data.length; i++) {
    const fila = data[i]; 
    const perfil = String(fila[0] || "").trim();
    if (!perfil) continue;
    const permisos = {};
    for (let j = 1; j < headers.length; j++) {
      const modulo = String(headers[j] || "").trim().toLowerCase();
      const valor  = String(fila[j] || "").trim().toUpperCase();
      if (modulo) permisos[modulo] = valor;
    }
    matriz[perfil] = permisos;
  }
  return matriz;
}

function obtenerPermisosDePerfil(perfil) { 
  return leerMatrizPermisos()[perfil] || {}; 
}

function loginUsuario(cedula, password) {
  const usuarios = obtenerRegistros("usuarios");
  const user = usuarios.find(u => String(u.cedula).trim() === String(cedula).trim());

  if (!user) return { ok: false, error: "Usuario no encontrado" };
  if (String(user.estado).toLowerCase() !== "activo") return { ok: false, error: "Usuario inactivo" };
  if (String(user.contraseña).trim() !== String(password).trim()) return { ok: false, error: "Contraseña incorrecta" };

  try {
    const sheet = abrirHoja("usuarios");
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(user.cedula).trim()) {
        sheet.getRange(i + 1, 9).setValue(new Date().toISOString().replace(/\.\d{3}Z$/, "Z"));
        break;
      }
    }
  } catch (e) { 
    Logger.log("No se pudo actualizar último ingreso: " + e); 
  }

  const permisos = obtenerPermisosDePerfil(user.perfil);

  let nombreEmpresa = "GLOBAL";
  if (user.empresa && user.empresa !== "GLOBAL") {
    const empresas = obtenerRegistros("empresas");
    const emp = empresas.find(e => String(e.cod_empresa).trim() === String(user.empresa).trim());
    if (emp) nombreEmpresa = emp.razon_social;
  }

  const sesion = {
    cedula:   user.cedula,
    nombre:   user.nombre,
    perfil:   user.perfil,
    correo:   user.correo,
    empresa:  user.empresa || "GLOBAL",
    empresaNombre: nombreEmpresa,
    permisos: permisos,
    expira:   new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };

  return { ok: true, usuario: sesion };
}

function puedeEditar(cedula, modulo) {
  const usuarios = obtenerRegistros("usuarios");
  const user = usuarios.find(u => String(u.cedula).trim() === String(cedula).trim());
  if (!user) return false;
  const permisos = obtenerPermisosDePerfil(user.perfil);
  return (permisos[modulo] || "").toUpperCase().includes("U") || (permisos[modulo] || "").toUpperCase() === "CRUD";
}

function puedeEliminar(cedula, modulo) {
  const usuarios = obtenerRegistros("usuarios");
  const user = usuarios.find(u => String(u.cedula).trim() === String(cedula).trim());
  if (!user) return false;
  const permisos = obtenerPermisosDePerfil(user.perfil);
  return (permisos[modulo] || "").toUpperCase().includes("D") || (permisos[modulo] || "").toUpperCase() === "CRUD";
}

function guardarEnFirestore(modulo, data) {
  const config = MODULOS[modulo];
  if (!config) return false;
  const token = obtenerTokenFirebase();
  let docId = modulo === "lineas" ? normalizarDocId(data.id) : normalizarDocId(data[config.campos[0]]);
  if (!docId) return false;
  const urlCommit = "https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT + "/databases/(default)/documents:commit";
  const nombreDoc = "projects/" + FIRESTORE_PROJECT + "/databases/(default)/documents/" + config.coleccion + "/" + docId;
  const fields = {};
  config.campos.forEach(campo => {
    const valor = data[campo];
    if (config.tipos && config.tipos[campo] === "double") fields[campo] = { doubleValue: Number(valor) || 0 };
    else if (config.tipos && config.tipos[campo] === "integer") fields[campo] = { integerValue: String(Math.trunc(Number(valor) || 0)) };
    else fields[campo] = { stringValue: String(valor == null ? "" : valor) };
  });
  fields.sincronizado_el = { timestampValue: fechaFirestore() };
  const res = UrlFetchApp.fetch(urlCommit, { 
    method: "post", 
    contentType: "application/json", 
    headers: { Authorization: `Bearer ${token}` }, 
    payload: JSON.stringify({ writes: [{ update: { name: nombreDoc, fields: fields } }] }), 
    muteHttpExceptions: true 
  });
  return res.getResponseCode() < 300;
}

function eliminarEnFirestore(modulo, clave) {
  const config = MODULOS[modulo];
  if (!config) return false;
  const token = obtenerTokenFirebase();
  const docId = normalizarDocId(clave);
  if (!docId) return false;
  const urlCommit = "https://firestore.googleapis.com/v1/projects/" + FIRESTORE_PROJECT + "/databases/(default)/documents:commit";
  const nombreDoc = "projects/" + FIRESTORE_PROJECT + "/databases/(default)/documents/" + config.coleccion + "/" + docId;
  const res = UrlFetchApp.fetch(urlCommit, { 
    method: "post", 
    contentType: "application/json", 
    headers: { Authorization: `Bearer ${token}` }, 
    payload: JSON.stringify({ writes: [{ delete: nombreDoc }] }), 
    muteHttpExceptions: true 
  });
  return res.getResponseCode() < 300 || res.getResponseCode() === 404;
}

function guardarEnSheets(modulo, data, cedulaUsuario) {
  const config = MODULOS[modulo];
  if (!config) throw new Error("Módulo no configurado: " + modulo);
  if (cedulaUsuario && !puedeEditar(cedulaUsuario, modulo)) return { ok: false, error: "Sin permiso para editar " + modulo };
  
  try {
    data = validarYFormatearDatos(modulo, data);
  } catch (errorValidacion) {
    return { ok: false, error: errorValidacion.message };
  }

  if (modulo === "usuarios") data.contraseña = generarPasswordDesdeNombre(data.cedula, data.nombre);
  const sheet = abrirHoja(modulo);
  const todas = sheet.getDataRange().getValues();
  let filaEncontrada = -1;
  if (modulo === "lineas" && !data.id) data.id = "LIN-" + Utilities.getUuid().substring(0, 8).toUpperCase();
  if (modulo === "lineas") {
    const idBuscado = String(data.id || "").trim();
    for (let i = 1; i < todas.length; i++) { 
      if (String(todas[i][7]).trim() === idBuscado) { 
        filaEncontrada = i + 1; 
        break; 
      } 
    }
  } else {
    const clave = String(data[config.campos[0]] || "").trim().toLowerCase();
    for (let i = 1; i < todas.length; i++) { 
      if (String(todas[i][0]).trim().toLowerCase() === clave) { 
        filaEncontrada = i + 1; 
        break; 
      } 
    }
  }
  const fila = config.campos.map(campo => {
    const valor = data[campo];
    if (config.tipos && config.tipos[campo] === "double") return Number(valor) || 0;
    if (config.tipos && config.tipos[campo] === "integer") return Number(valor) || 0;
    return String(valor == null ? "" : valor).trim();
  });
  if (filaEncontrada !== -1) sheet.getRange(filaEncontrada, 1, 1, fila.length).setValues([fila]);
  else sheet.appendRow(fila);
  guardarEnFirestore(modulo, data);
  return { ok: true, registros: obtenerRegistros(modulo) };
}

function eliminarEnSheets(modulo, clave, cedulaUsuario) {
  const config = MODULOS[modulo];
  if (!config) throw new Error("Módulo no configurado: " + modulo);

  if (cedulaUsuario && !puedeEliminar(cedulaUsuario, modulo)) {
    return { ok: false, error: "Sin permiso para eliminar en " + modulo };
  }

  let esGlobal = true;
  let empresaUsuario = "";
  if (cedulaUsuario) {
    const usuarios = obtenerRegistros("usuarios");
    const user = usuarios.find(u => String(u.cedula).trim() === String(cedulaUsuario).trim());
    if (user && user.empresa && user.empresa !== "GLOBAL") {
      esGlobal = false;
      empresaUsuario = user.empresa;
    }
  }

  const sheet = abrirHoja(modulo);
  const data = sheet.getDataRange().getValues();

  if (modulo === "lineas") {
    const idBuscado = String(clave).trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][7]).trim() === idBuscado) {
        if (!esGlobal && String(data[i][5]).trim() !== empresaUsuario) {
          return { ok: false, error: "No puedes eliminar registros de otra empresa." };
        }
        sheet.deleteRow(i + 1);
        eliminarEnFirestore(modulo, clave);
        break;
      }
    }
  } else {
    const buscar = String(clave).trim().toLowerCase();
    let colEmpresa = config.campos.indexOf("empresa"); 
    if (modulo === "destinatarios") colEmpresa = config.campos.indexOf("codigo_empresa");
    if (modulo === "empresas") colEmpresa = config.campos.indexOf("cod_empresa");

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === buscar) {
        if (!esGlobal && colEmpresa !== -1 && String(data[i][colEmpresa]).trim() !== empresaUsuario) {
           return { ok: false, error: "No puedes eliminar registros de otra empresa." };
        }
        sheet.deleteRow(i + 1);
        eliminarEnFirestore(modulo, clave);
        break;
      }
    }
  }
  return { ok: true, registros: obtenerRegistros(modulo) };
}

function guardarSKUEnSheets(d, c)          { return guardarEnSheets("sku", d, c); }
function eliminarSKUEnSheets(k, c)         { return eliminarEnSheets("sku", k, c); }
function guardarEmpresaEnSheets(d, c)      { return guardarEnSheets("empresas", d, c); }
function eliminarEmpresaEnSheets(k, c)     { return eliminarEnSheets("empresas", k, c); }
function guardarDestinatarioEnSheets(d, c) { return guardarEnSheets("destinatarios", d, c); }
function eliminarDestinatarioEnSheets(k, c){ return eliminarEnSheets("destinatarios", k, c); }
function guardarLineaMaquinaEnSheets(d, c) { return guardarEnSheets("lineas", d, c); }
function eliminarLineaMaquinaEnSheets(l, m, c) { return eliminarEnSheets("lineas", l, c || m); }
function guardarUsuarioEnSheets(d, c)      { return guardarEnSheets("usuarios", d, c); }
function eliminarUsuarioEnSheets(k, c)     { return eliminarEnSheets("usuarios", k, c); }

function sincronizarTodo() {
  const resultado = {};
  Object.keys(MODULOS).forEach(modulo => {
    try {
      const registros = obtenerRegistros(modulo);
      let ok = 0, fail = 0;
      registros.forEach(reg => { 
        if (guardarEnFirestore(modulo, reg)) ok++; 
        else fail++; 
      });
      resultado[modulo] = { total: registros.length, ok: ok, fail: fail };
      Logger.log("✅ " + modulo + ": " + ok + "/" + registros.length);
    } catch (e) { 
      Logger.log("❌ " + modulo + ": " + e.message); 
    }
  });
  return resultado;
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('🔥 ProGuide')
      .addItem('Sincronizar TODO con Firestore', 'sincronizarTodo')
      .addSeparator()
      .addItem('Sincronizar SKUs', 'menuSyncSKU')
      .addItem('Sincronizar Empresas', 'menuSyncEmpresas')
      .addItem('Sincronizar Destinatarios', 'menuSyncDestinatarios')
      .addItem('Sincronizar Líneas', 'menuSyncLineas')
      .addItem('Sincronizar Usuarios', 'menuSyncUsuarios')
      .addToUi();
  } catch (e) {}
}

function menuSyncSKU()          { sincronizarModulo("sku");           SpreadsheetApp.getUi().alert("SKUs ✅"); }
function menuSyncEmpresas()     { sincronizarModulo("empresas");      SpreadsheetApp.getUi().alert("Empresas ✅"); }
function menuSyncDestinatarios(){ sincronizarModulo("destinatarios"); SpreadsheetApp.getUi().alert("Destinatarios ✅"); }
function menuSyncLineas()       { sincronizarModulo("lineas");        SpreadsheetApp.getUi().alert("Líneas ✅"); }
function menuSyncUsuarios()     { sincronizarModulo("usuarios");      SpreadsheetApp.getUi().alert("Usuarios ✅"); }

function sincronizarModulo(modulo) {
  const registros = obtenerRegistros(modulo);
  let ok = 0, fail = 0;
  registros.forEach(reg => { 
    if (guardarEnFirestore(modulo, reg)) ok++; 
    else fail++; 
  });
  return { total: registros.length, ok: ok, fail: fail };
}

function obtenerLoginHTML() { 
  return HtmlService.createTemplateFromFile('Login').evaluate().getContent(); 
}

function obtenerPerfilesDisponibles() {
  const ss = SpreadsheetApp.openById(MODULOS.usuarios.sheetsId);
  const sheet = ss.getSheetByName(MODULOS.usuarios.pestañaPermisos);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const perfiles = [];
  for (let i = 1; i < data.length; i++) {
    const perfil = String(data[i][0] || "").trim();
    if (perfil) perfiles.push(perfil);
  }
  return perfiles;
}

function generarCodDestinatario() {
  const data = abrirHoja("destinatarios").getDataRange().getValues();
  let ultimo = 0;
  for (let i = 1; i < data.length; i++) {
    const match = String(data[i][0] || "").trim().match(/^DEST-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > ultimo) ultimo = num;
    }
  }
  return `DEST-${String(ultimo + 1).padStart(3, "0")}`;
}

function generarCodEmpresa() {
  const data = abrirHoja("empresas").getDataRange().getValues();
  let ultimo = 0;
  for (let i = 1; i < data.length; i++) {
    const match = String(data[i][0] || "").trim().match(/^EMP-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > ultimo) ultimo = num;
    }
  }
  return `EMP-${String(ultimo + 1).padStart(3, "0")}`;
}

// Generador de SKU inteligente por empresa
function generarCodSKU(codEmpresa) {
  if (!codEmpresa || codEmpresa === "GLOBAL") return "";
  
  // Extraer el número de la empresa (Ej: "EMP-001" -> 1)
  const matchEmpresa = String(codEmpresa).trim().match(/^EMP-(\d+)$/);
  const numEmpresa = matchEmpresa ? parseInt(matchEmpresa[1], 10) : 1;
  
  // Base inicial para la empresa: para 1 es 1000, para 2 es 2000, etc.
  const baseEmpresa = numEmpresa * 1000;
  let ultimoNumero = baseEmpresa;

  const data = abrirHoja("sku").getDataRange().getValues();
  const colEmpresa = MODULOS.sku.campos.indexOf("empresa");

  for (let i = 1; i < data.length; i++) {
    const rowEmpresa = String(data[i][colEmpresa] || "").trim();
    if (rowEmpresa === String(codEmpresa).trim()) {
      const skuVal = parseInt(String(data[i][0]).replace(/\D/g, ""), 10);
      if (!isNaN(skuVal) && skuVal > ultimoNumero) {
        ultimoNumero = skuVal;
      }
    }
  }
  
  return String(ultimoNumero + 1);
}



function generarDatosLinea(codEmpresa) {
  if (!codEmpresa || codEmpresa === "GLOBAL") return { linea: "", id: "" };

  // 1. Localizar la razón social de la empresa
  const empresas = obtenerRegistros("empresas");
  const emp = empresas.find(e => String(e.cod_empresa).trim() === String(codEmpresa).trim());
  if (!emp) return { linea: "", id: "" };

  // 2. Extraer la primera palabra representativa (quitando caracteres especiales)
  let palabra = String(emp.razon_social).trim().split(/\s+/)[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "");
  palabra = palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  
  // 3. Prefijo de 3 letras para el ID técnico
  const prefijoId = palabra.substring(0, 3).toUpperCase();

  // 4. Contar cuántas líneas tiene registradas esa empresa
  const lineas = obtenerRegistros("lineas");
  let contador = 0;
  lineas.forEach(l => {
    if (String(l.empresa).trim() === String(codEmpresa).trim()) {
      contador++;
    }
  });

  const siguiente = contador + 1;
  const numPad = String(siguiente).padStart(2, "0");

  return {
    linea: `L${siguiente}-${palabra}`,
    id: `LIN-${prefijoId}-${numPad}`
  };
}