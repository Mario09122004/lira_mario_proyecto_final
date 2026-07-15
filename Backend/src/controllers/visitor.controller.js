import pool from '../config/db.js';
import PDFDocument from 'pdfkit';

// Registrar un visitante (Público)
export const registrarVisitante = async (req, res) => {
  const {
    folio_boleto,
    nombre_visitante,
    num_personas,
    hombres,
    mujeres,
    ninos,
    jovenes,
    adultos,
    tercera_edad,
    tipo_procedencia,
    procedencia,
    municipio
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO visitantes.registro 
      (folio_boleto, nombre_visitante, num_personas, hombres, mujeres, ninos, jovenes, adultos, tercera_edad, tipo_procedencia, procedencia, municipio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        folio_boleto,
        nombre_visitante,
        num_personas,
        hombres,
        mujeres,
        ninos,
        jovenes,
        adultos,
        tercera_edad,
        tipo_procedencia,
        procedencia,
        tipo_procedencia === 'Local' ? municipio : null
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Registro de visitante guardado exitosamente.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error al registrar visitante:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al registrar la visita."
    });
  }
};

// Obtener datos filtrados para estadísticas (Privado)
const getFilteredData = async (filters) => {
  const { startDate, endDate, tipo_procedencia, procedencia, municipio } = filters;
  
  let queryText = 'SELECT * FROM visitantes.registro WHERE 1=1';
  const queryParams = [];
  let paramIndex = 1;

  if (startDate) {
    queryText += ` AND fecha >= $${paramIndex}`;
    queryParams.push(new Date(startDate));
    paramIndex++;
  }

  if (endDate) {
    // Para incluir todo el día de endDate, sumamos 1 día o comparamos con menor que
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    queryText += ` AND fecha <= $${paramIndex}`;
    queryParams.push(end);
    paramIndex++;
  }

  if (tipo_procedencia) {
    queryText += ` AND tipo_procedencia = $${paramIndex}`;
    queryParams.push(tipo_procedencia);
    paramIndex++;
  }

  if (procedencia) {
    queryText += ` AND procedencia = $${paramIndex}`;
    queryParams.push(procedencia);
    paramIndex++;
  }

  if (municipio) {
    queryText += ` AND municipio = $${paramIndex}`;
    queryParams.push(municipio);
    paramIndex++;
  }

  // Ordenar por fecha descendente
  queryText += ' ORDER BY fecha DESC';

  const result = await pool.query(queryText, queryParams);
  return result.rows;
};

// Obtener estadísticas agregadas para el dashboard
export const obtenerEstadisticas = async (req, res) => {
  try {
    const records = await getFilteredData(req.query);

    // Inicializar agregadores
    let totalVisitantes = 0;
    let totalHombres = 0;
    let totalMujeres = 0;
    let totalNinos = 0;
    let totalJovenes = 0;
    let totalAdultos = 0;
    let totalTerceraEdad = 0;
    const totalGrupos = records.length;

    const procedenciaTipoMap = { Local: 0, Nacional: 0, Internacional: 0 };
    const procedenciaDetalleMap = {};
    const tendenciaVisitasMap = {};

    records.forEach(row => {
      totalVisitantes += row.num_personas;
      totalHombres += row.hombres;
      totalMujeres += row.mujeres;
      totalNinos += row.ninos;
      totalJovenes += row.jovenes;
      totalAdultos += row.adultos;
      totalTerceraEdad += row.tercera_edad;

      // Agrupar por tipo de procedencia
      if (procedenciaTipoMap[row.tipo_procedencia] !== undefined) {
        procedenciaTipoMap[row.tipo_procedencia] += row.num_personas;
      }

      // Agrupar por procedencia detallada (Estado/País y Municipio)
      const key = row.tipo_procedencia === 'Local' && row.municipio 
        ? `${row.procedencia} - ${row.municipio}`
        : row.procedencia;
      
      procedenciaDetalleMap[key] = (procedenciaDetalleMap[key] || 0) + row.num_personas;

      // Agrupar por fecha para tendencia (YYYY-MM-DD)
      const dateStr = new Date(row.fecha).toISOString().split('T')[0];
      tendenciaVisitasMap[dateStr] = (tendenciaVisitasMap[dateStr] || 0) + row.num_personas;
    });

    // Formatear mapas a arreglos para Recharts
    const demografia = [
      { name: 'Niños', value: totalNinos },
      { name: 'Jóvenes', value: totalJovenes },
      { name: 'Adultos', value: totalAdultos },
      { name: 'Tercera Edad', value: totalTerceraEdad }
    ];

    const genero = [
      { name: 'Hombres', value: totalHombres },
      { name: 'Mujeres', value: totalMujeres }
    ];

    const procedenciaTipo = Object.keys(procedenciaTipoMap).map(key => ({
      name: key,
      value: procedenciaTipoMap[key]
    }));

    const procedenciaDetalle = Object.keys(procedenciaDetalleMap)
      .map(key => ({
        location: key,
        value: procedenciaDetalleMap[key]
      }))
      .sort((a, b) => b.value - a.value);

    const tendenciaVisitas = Object.keys(tendenciaVisitasMap)
      .map(key => ({
        fecha: key,
        total: tendenciaVisitasMap[key]
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalVisitantes,
          totalHombres,
          totalMujeres,
          totalNinos,
          totalJovenes,
          totalAdultos,
          totalTerceraEdad,
          totalGrupos,
          promedioGrupo: totalGrupos > 0 ? parseFloat((totalVisitantes / totalGrupos).toFixed(1)) : 0
        },
        demografia,
        genero,
        procedenciaTipo,
        procedenciaDetalle,
        tendenciaVisitas,
        rawRecords: records.slice(0, 100) // Devolver últimos 100 registros para tabla simple
      }
    });

  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al calcular estadísticas."
    });
  }
};

// Generar y descargar reporte PDF (Privado)
export const generarReportePDF = async (req, res) => {
  try {
    const records = await getFilteredData(req.query);

    // Calcular KPIs rápidos
    let totalVisitantes = 0;
    let totalHombres = 0;
    let totalMujeres = 0;
    let totalNinos = 0;
    let totalJovenes = 0;
    let totalAdultos = 0;
    let totalTerceraEdad = 0;

    records.forEach(row => {
      totalVisitantes += row.num_personas;
      totalHombres += row.hombres;
      totalMujeres += row.mujeres;
      totalNinos += row.ninos;
      totalJovenes += row.jovenes;
      totalAdultos += row.adultos;
      totalTerceraEdad += row.tercera_edad;
    });

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 40 });
    
    // Configurar cabeceras HTTP para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-museo-francisco-villa.pdf');
    doc.pipe(res);

    // Header del reporte
    doc.fillColor('#78350f') // Color café/ocre histórico
       .fontSize(22)
       .text('MUSEO FRANCISCO VILLA', { align: 'center' });
    
    doc.fillColor('#374151')
       .fontSize(14)
       .text('Reporte de Registro de Visitantes', { align: 'center' });
    
    doc.fontSize(10)
       .text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'center' });
    
    doc.moveDown(1.5);

    // Filtros aplicados
    doc.fillColor('#1f2937').fontSize(11).text('Filtros del reporte:', { underline: true });
    doc.fontSize(10).text(`• Rango de fecha: ${req.query.startDate || 'Inicio'} al ${req.query.endDate || 'Fin'}`);
    doc.text(`• Tipo procedencia: ${req.query.tipo_procedencia || 'Todos'}`);
    if (req.query.procedencia) doc.text(`• Estado/País: ${req.query.procedencia}`);
    if (req.query.municipio) doc.text(`• Municipio: ${req.query.municipio}`);
    
    doc.moveDown(1.5);

    // Tabla de KPIs
    doc.fillColor('#78350f').fontSize(12).text('Resumen Estadístico', { underline: true }).moveDown(0.5);
    
    // Tabla dibujada simple
    const kpiData = [
      ['Categoría', 'Cantidad', 'Categoría', 'Cantidad'],
      ['Total Visitantes', `${totalVisitantes}`, 'Total Grupos/Boletos', `${records.length}`],
      ['Hombres', `${totalHombres}`, 'Mujeres', `${totalMujeres}`],
      ['Niños', `${totalNinos}`, 'Jóvenes', `${totalJovenes}`],
      ['Adultos', `${totalAdultos}`, 'Tercera Edad', `${totalTerceraEdad}`]
    ];

    let y = doc.y;
    kpiData.forEach((row, i) => {
      const isHeader = i === 0;
      doc.fontSize(isHeader ? 10 : 9)
         .font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      
      doc.text(row[0], 50, y);
      doc.text(row[1], 180, y);
      doc.text(row[2], 280, y);
      doc.text(row[3], 410, y);
      
      y += 18;
      // Dibujar línea separadora
      doc.moveTo(40, y - 4).lineTo(550, y - 4).strokeColor('#e5e7eb').lineWidth(1).stroke();
    });

    doc.moveDown(2);

    // Listado de visitas detallado
    doc.fillColor('#78350f').fontSize(12).font('Helvetica-Bold').text('Detalle de Registros', { underline: true }).moveDown(0.5);
    
    const tableHeaderY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
    doc.text('Folio', 45, tableHeaderY);
    doc.text('Nombre Visitante', 100, tableHeaderY);
    doc.text('Personas', 240, tableHeaderY);
    doc.text('H/M', 295, tableHeaderY);
    doc.text('N / J / A / 3ª', 345, tableHeaderY);
    doc.text('Procedencia', 435, tableHeaderY);
    doc.text('Fecha', 510, tableHeaderY);

    doc.moveTo(40, tableHeaderY + 12).lineTo(570, tableHeaderY + 12).strokeColor('#9ca3af').lineWidth(1.5).stroke();
    
    let tableY = tableHeaderY + 18;
    
    doc.font('Helvetica').fillColor('#1f2937');
    records.slice(0, 30).forEach(row => {
      // Si la tabla supera el tamaño de página, crear nueva página
      if (tableY > 700) {
        doc.addPage();
        tableY = 50;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
        doc.text('Folio', 45, tableY);
        doc.text('Nombre Visitante', 100, tableY);
        doc.text('Personas', 240, tableY);
        doc.text('H/M', 295, tableY);
        doc.text('N / J / A / 3ª', 345, tableY);
        doc.text('Procedencia', 435, tableY);
        doc.text('Fecha', 510, tableY);
        doc.moveTo(40, tableY + 12).lineTo(570, tableY + 12).strokeColor('#9ca3af').lineWidth(1.5).stroke();
        tableY += 18;
        doc.font('Helvetica').fillColor('#1f2937');
      }

      const shortName = row.nombre_visitante.length > 22 ? row.nombre_visitante.substring(0, 20) + '..' : row.nombre_visitante;
      const formattedDate = new Date(row.fecha).toLocaleDateString();
      
      const locText = row.tipo_procedencia === 'Local' && row.municipio 
        ? `${row.municipio}, Dgo` 
        : row.procedencia.length > 13 ? row.procedencia.substring(0, 11) + '..' : row.procedencia;

      doc.fontSize(8);
      doc.text(row.folio_boleto, 45, tableY);
      doc.text(shortName, 100, tableY);
      doc.text(`${row.num_personas}`, 245, tableY);
      doc.text(`${row.hombres}/${row.mujeres}`, 295, tableY);
      doc.text(`${row.ninos}/${row.jovenes}/${row.adultos}/${row.tercera_edad}`, 345, tableY);
      doc.text(locText, 435, tableY);
      doc.text(formattedDate, 510, tableY);

      tableY += 15;
      doc.moveTo(40, tableY - 3).lineTo(570, tableY - 3).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
    });

    if (records.length > 30) {
      doc.moveDown(1.5);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#6b7280')
         .text(`* Mostrando los primeros 30 registros de un total de ${records.length} resultados.`, { align: 'center' });
    }

    doc.end();

  } catch (error) {
    console.error("Error al generar reporte PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al exportar el reporte."
      });
    }
  }
};
