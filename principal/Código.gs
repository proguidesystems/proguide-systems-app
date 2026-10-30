const SPREADSHEET_ID = "1nN_XBIlLRfUu7cQ4hYcx21wthDODP8sZga8mEOYcC84";

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('ProGuide Systems - Centro de Comando Industrial')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

const URL_MASTER_DATA = "https://script.google.com/macros/s/AKfycbyx83u7DdjsJpTXeo0H7M4TBuFGxKbNZAqp9oo1SUlvKolcmqC0gNCt9zTeb-86FL4U/exec";
const URL_OPERACIONES = "https://script.google.com/macros/s/AKfycbyJQ6z7_LAUHTe9iXjbEvITEBpfcZfrlA8Svbss3WU_S5gvnIHC_rnUgKrcxUQ7ik5Q/exec";

const DATOS_FALLBACK = {
  modulos_detalle: [
    {
      id: "mod_maestros",
      nombre: "Datos Maestros e Ingeniería",
      icono: "database",
      alcance: "Cimiento y Configuración Base",
      descripcion: "Es la fuente única de verdad del sistema. Administra la arquitectura multi-empresa, la creación de sedes, el catálogo integral de SKUs con sus unidades de medida, velocidades nominales y procesos requeridos, así como el directorio de clientes y destinatarios.",
      caracteristicas: [
        "Aislamiento y gobernanza de datos para múltiples empresas.",
        "Catálogo de SKUs con parametrización de tiempos y velocidades estándar.",
        "Gestión de líneas de producción, capacidades de máquina y turnos.",
        "Directorio oficial de clientes y puntos de entrega certificados."
      ],
      url_modulo: URL_MASTER_DATA,
      texto_boton: "Lanzar Datos Maestros",
      subsistema: "Entorno Master Data"
    },
    {
      id: "mod_usuarios",
      nombre: "Seguridad y Gestión de Usuarios",
      icono: "shield-alert",
      alcance: "Gobernanza y Control RBAC",
      descripcion: "Módulo centralizado para la administración de credenciales, control de acceso basado en roles (RBAC) y directivas de seguridad. Garantiza que cada colaborador ingrese únicamente a los procesos que le corresponden según su cargo y empresa.",
      caracteristicas: [
        "Control granular de roles (Admin, Gerencia, Abastecimiento, KAM, PCP, Operarios).",
        "Asignación de usuarios por empresa y sede para evitar filtración de datos.",
        "Gestión de contraseñas, estados de actividad y credenciales de acceso.",
        "Auditoría continua de eventos y cumplimiento de políticas de seguridad."
      ],
      url_modulo: URL_MASTER_DATA,
      texto_boton: "Gestionar Usuarios",
      subsistema: "Entorno Master Data"
    },
    {
      id: "mod_pedidos",
      nombre: "Gestión de Pedidos",
      icono: "clipboard-list",
      alcance: "Comercial, Demanda y Clientes",
      descripcion: "Permite la captura estructurada de las solicitudes de compra. Un pedido agrupa múltiples referencias de SKUs con sus cantidades solicitadas, fecha preferida de entrega solicitada por el cliente y nivel de urgencia, garantizando trazabilidad comercial.",
      caracteristicas: [
        "Creación de pedidos multi-SKU validados contra catálogo activo.",
        "Parametrización de fecha comercial prometida, horario y nivel de urgencia.",
        "Control de ciclo de vida del pedido (Pendiente, Aprobado, Planta, PT, Despachado).",
        "Edición y anulación controlada con trazabilidad por ejecutivo comercial."
      ],
      url_modulo: URL_OPERACIONES,
      texto_boton: "Ingresar a Pedidos",
      subsistema: "Suite Operaciones"
    },
    {
      id: "mod_programacion",
      nombre: "Programación y Capacidad (PCP)",
      icono: "calendar-clock",
      alcance: "Planeación y Nivelación de Planta",
      descripcion: "El corazón táctico de la operación. El planificador evalúa pedidos, pacta y aprueba la fecha viable en planta (registrando motivos si difiere de comercial) y utiliza el motor de sugerencias de OPs para fraccionar lotes óptimos en la jornada de 24 horas.",
      caracteristicas: [
        "Vista Consolidada para aprobación y negociación formal de fechas de planta.",
        "Motor heurístico de cálculo automático de OPs según velocidad de línea.",
        "Vista de Capacidad 24h con balanceo de líneas y semáforos de saturación.",
        "Planificación preventiva para evitar paros no programados y cuellos de botella."
      ],
      url_modulo: URL_OPERACIONES,
      texto_boton: "Abrir Programación",
      subsistema: "Suite Operaciones"
    },
    {
      id: "mod_planta",
      nombre: "Control de Planta y Ejecución",
      icono: "cpu",
      alcance: "Manufactura en Piso y Calidad",
      descripcion: "Diseñado para el ritmo de la fábrica. Operarios y supervisores visualizan las OPs de su línea, registran el paso a paso de cada proceso (pesaje, mezcla, envasado, empaque) con sellado de tiempo real, reportan novedades y cierran órdenes con unidades conformes.",
      caracteristicas: [
        "Muro de OPs con filtros rápidos por estado (Pendiente, En proceso, Finalizada).",
        "Registro secuencial de etapas productivas con trazabilidad de tiempos.",
        "Reporte estructurado de paradas de línea (mantenimiento, aseo, insumos).",
        "Cierre de orden con balance de producto terminado y no conformidades."
      ],
      url_modulo: URL_OPERACIONES,
      texto_boton: "Acceder a Planta",
      subsistema: "Suite Operaciones"
    },
    {
      id: "mod_dashboards",
      nombre: "Tableros de Control y Analítica",
      icono: "bar-chart-3",
      alcance: "Dirección, Abastecimiento y KPIs",
      descripcion: "El centro de inteligencia en tiempo real. Provee tableros visuales especializados que convierten las transacciones en indicadores en vivo para gerencia, logística, compras y supervisores, permitiendo decisiones sobre entregas, compras y eficiencia de líneas.",
      caracteristicas: [
        "Dashboard Comercial (KAM/Compras): cumplimiento OTIF y rotación de SKUs.",
        "Dashboard de Planificación: balance de carga instalada vs real en 24h.",
        "Dashboard de Planta: indicadores de productividad y tasa de no conformidades.",
        "Filtros avanzados por rango de fechas, estados y empresas."
      ],
      url_modulo: URL_OPERACIONES,
      texto_boton: "Visualizar Analítica",
      subsistema: "Suite Operaciones"
    }
  ],
  perfiles_usuarios: [
    {
      perfil: "Administrador / Dirección TI",
      icono: "shield-check",
      mision: "Gobernanza absoluta del sistema, control de seguridad, creación de empresas y auditoría integral de la plataforma.",
      acceso_modulos: "Todos los 6 módulos habilitados sin restricciones.",
      kpi_principal: "Disponibilidad del Sistema (99.9%) e Integridad de Datos",
      responsabilidades: [
        "Configurar empresas, sedes, catálogos base y usuarios con sus respectivos perfiles.",
        "Auditar la consistencia transaccional y sincronización en tiempo real con Google Cloud Firestore.",
        "Supervisar la continuidad operativa de todas las empresas conectadas a la plataforma."
      ]
    },
    {
      perfil: "Gerencial / Directivo",
      icono: "line-chart",
      mision: "Visualización estratégica de alto nivel para evaluar el rendimiento comercial, capacidad de planta y cumplimiento global.",
      acceso_modulos: "Tableros de Control y Analítica (Dashboards Comercial, Capacidad y Planta).",
      kpi_principal: "Nivel de Servicio General (OTIF Consolidado) y Rentabilidad de Capacidad",
      responsabilidades: [
        "Monitorear el volumen consolidado de pedidos y el estado global de cumplimiento de despachos.",
        "Analizar el índice de ocupación general de las fábricas para decisiones de inversión o expansión.",
        "Evaluar desviaciones críticas entre fechas comerciales requeridas y fechas reales pactadas por planta."
      ]
    },
    {
      perfil: "Abastecimiento / Compras",
      icono: "truck",
      mision: "Anticipar la demanda futura para asegurar materia prima, empaques y suministros según los pedidos aprobados y OPs en curso.",
      acceso_modulos: "Tableros de Analítica y Módulo de Pedidos.",
      kpi_principal: "Disponibilidad Oportuna de Insumos y Cero Paros por Desabastecimiento",
      responsabilidades: [
        "Consultar los SKUs de mayor solicitud y la tendencia cronológica de entregas comprometidas.",
        "Revisar el volumen de pedidos aprobados para coordinar entregas de proveedores justo a tiempo.",
        "Identificar picos de demanda proyectada en las vistas de capacidad de las líneas."
      ]
    },
    {
      perfil: "KAM Logístico / Comercial",
      icono: "clipboard-list",
      mision: "Atención directa al cliente, recepción y captura de pedidos de venta, y seguimiento del avance de fabricación hasta el despacho.",
      acceso_modulos: "Módulo de Pedidos y Tableros de Analítica Comercial.",
      kpi_principal: "Cumplimiento OTIF (On-Time In-Full) y Tasa de Retención de Clientes",
      responsabilidades: [
        "Crear pedidos multi-SKU con destino, fecha requerida y nivel de urgencia.",
        "Rastrear el avance de las órdenes desde que son aprobadas hasta que llegan a producto terminado.",
        "Gestionar el despacho oportuno y comunicar a los clientes el estado de sus pedidos."
      ]
    },
    {
      perfil: "Planificador de Producción (PCP)",
      icono: "calendar-clock",
      mision: "Transformar la cartera de pedidos en un programa de producción viable, balanceando líneas de 24h y emitiendo órdenes de trabajo.",
      acceso_modulos: "Módulo de Programación, Balance de Capacidad y Tableros de Planificación.",
      kpi_principal: "Porcentaje de Ocupación de Líneas y Adherencia al Programa de Producción",
      responsabilidades: [
        "Evaluar la factibilidad técnica y comprometer la fecha formal de entrega en planta.",
        "Generar órdenes de producción (OPs) optimizadas por tamaño de lote y máquina.",
        "Monitorear la carga horaria acumulada para evitar sobrecargas y cuellos de botella."
      ]
    },
    {
      perfil: "Coordinador de Planta",
      icono: "activity",
      mision: "Supervisar el flujo continuo de manufactura en piso, resolver novedades operativas y auditar la calidad del producto.",
      acceso_modulos: "Módulo de Planta, Reporte de Novedades y Tablero de Planta.",
      kpi_principal: "OEE (Efectividad Global de Equipos) y Tiempo Medio entre Fallas (MTBF)",
      responsabilidades: [
        "Asignar las OPs a los operarios según disponibilidad de línea y personal.",
        "Gestionar y resolver novedades operativas (mantenimiento correctivo, ajustes o calidad).",
        "Validar el cierre de órdenes y verificar los reportes de unidades conformes y no conformes."
      ]
    },
    {
      perfil: "Operario de Manufactura",
      icono: "cpu",
      mision: "Ejecutar físicamente la fabricación de los lotes en máquina, certificar cada etapa y reportar novedades de primera mano.",
      acceso_modulos: "Módulo de Planta (Vista de Operador en Línea).",
      kpi_principal: "Productividad Estándar por Hora y Cero Incidentes Operativos",
      responsabilidades: [
        "Iniciar y finalizar las OPs programadas en su línea asignada.",
        "Registrar avances por etapa productiva en tiempo real.",
        "Notificar paradas o anomalías en la máquina de forma inmediata."
      ]
    }
  ]
};

function leerPestaña(ss, nombrePestaña) {
  try {
    const sheet = ss.getSheetByName(nombrePestaña);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, "_"));
    const resultado = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || String(row[0]).trim() === "") continue;
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = String(row[idx] == null ? "" : row[idx]).trim();
      });
      resultado.push(obj);
    }
    return resultado;
  } catch (e) {
    return [];
  }
}

function obtenerDatosPortal() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const modulos = leerPestaña(ss, "Modulos_Detalle");
    const perfiles = leerPestaña(ss, "Perfiles_Usuarios");

    return {
      ok: true,
      modulos: modulos.length > 0 ? modulos : DATOS_FALLBACK.modulos_detalle,
      perfiles: perfiles.length > 0 ? perfiles : DATOS_FALLBACK.perfiles_usuarios
    };
  } catch (e) {
    return {
      ok: true,
      modulos: DATOS_FALLBACK.modulos_detalle,
      perfiles: DATOS_FALLBACK.perfiles_usuarios
    };
  }
}

function inicializarHojaCentral() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let shMod = ss.getSheetByName("Modulos_Detalle");
  if (!shMod) shMod = ss.insertSheet("Modulos_Detalle");
  shMod.clear();
  shMod.appendRow(["ID", "Nombre", "Icono", "Alcance", "Descripcion", "Caracteristicas_JSON", "URL_Modulo", "Texto_Boton", "Subsistema"]);
  DATOS_FALLBACK.modulos_detalle.forEach(m => shMod.appendRow([
    m.id, m.nombre, m.icono, m.alcance, m.descripcion, JSON.stringify(m.caracteristicas), m.url_modulo, m.texto_boton, m.subsistema
  ]));

  let shPerf = ss.getSheetByName("Perfiles_Usuarios");
  if (!shPerf) shPerf = ss.insertSheet("Perfiles_Usuarios");
  shPerf.clear();
  shPerf.appendRow(["Perfil", "Icono", "Mision", "Acceso_Modulos", "KPI_Principal", "Responsabilidades_JSON"]);
  DATOS_FALLBACK.perfiles_usuarios.forEach(p => shPerf.appendRow([
    p.perfil, p.icono, p.mision, p.acceso_modulos, p.kpi_principal, JSON.stringify(p.responsabilidades)
  ]));

  Logger.log("✅ Estructura con 6 módulos y botones directos inicializada con éxito.");
}