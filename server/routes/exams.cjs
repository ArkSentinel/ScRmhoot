const express = require('express');
const router = express.Router();
const db = require('../database-maria.cjs');

router.post('/save', async (req, res) => {
  try {
    const { 
      paciente_id, 
      protocolo_id,
      secuencia_id,
      tipo_estudio, 
      nombre_secuencia, 
      tr, te, fov, slice_thickness,
      flip_angle, phase_direction, matrix_size, gap_percentage, nex,
      box_x, box_y, box_w, box_h 
    } = req.body;

    if (!nombre_secuencia) {
      return res.status(400).json({ message: 'nombre_secuencia is required' });
    }

    let pacienteId = paciente_id;
    
    if (!pacienteId) {
      const insertPatient = db.prepare('INSERT INTO pacientes (nombre) VALUES (?)');
      const patientResult = await insertPatient.run(['Demo Patient']);
      pacienteId = patientResult.lastInsertRowid;
    }

    const insertExam = db.prepare(`
      INSERT INTO estudios (paciente_id, protocolo_id, secuencia_id, tipo_estudio, nombre_secuencia)
      VALUES (?, ?, ?, ?, ?)
    `);
    const examResult = await insertExam.run([
      pacienteId, 
      protocolo_id || 1, 
      secuencia_id || null,
      tipo_estudio || 'Cerebro', 
      nombre_secuencia
    ]);
    const examId = examResult.lastInsertRowid;

    const insertParams = db.prepare(`
      INSERT INTO parametros_secuencia (
        estudio_id, nombre_secuencia, tr, te, fov, slice_thickness,
        flip_angle, phase_direction, matrix_size, gap_percentage, nex,
        box_x, box_y, box_w, box_h
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await insertParams.run([
      examId,
      nombre_secuencia,
      tr || 2000,
      te || 80,
      fov || 220,
      slice_thickness || 3.0,
      flip_angle || 140,
      phase_direction || 'R>L',
      matrix_size || '320x320',
      gap_percentage || 10,
      nex || 2,
      box_x || 64,
      box_y || 64,
      box_w || 128,
      box_h || 128
    ]);

    let evaluation = null;
    if (secuencia_id) {
      const sequenceStmt = db.prepare('SELECT * FROM secuencias WHERE id = ?');
      const sequence = await sequenceStmt.get([secuencia_id]);
      
      if (sequence) {
        const checks = [];
        
        if (tr >= sequence.tr_min && tr <= sequence.tr_max) {
          checks.push({ param: 'TR', status: 'ok', value: tr, expected: `${sequence.tr_min}-${sequence.tr_max}` });
        } else {
          checks.push({ param: 'TR', status: 'error', value: tr, expected: `${sequence.tr_min}-${sequence.tr_max}` });
        }
        
        if (te >= sequence.te_min && te <= sequence.te_max) {
          checks.push({ param: 'TE', status: 'ok', value: te, expected: `${sequence.te_min}-${sequence.te_max}` });
        } else {
          checks.push({ param: 'TE', status: 'error', value: te, expected: `${sequence.te_min}-${sequence.te_max}` });
        }
        
        if (slice_thickness === sequence.slice_thickness) {
          checks.push({ param: 'Slice', status: 'ok', value: slice_thickness, expected: sequence.slice_thickness });
        } else {
          checks.push({ param: 'Slice', status: 'error', value: slice_thickness, expected: sequence.slice_thickness });
        }
        
        if (flip_angle >= sequence.flip_angle_min && flip_angle <= sequence.flip_angle_max) {
          checks.push({ param: 'Flip', status: 'ok', value: flip_angle, expected: `${sequence.flip_angle_min}-${sequence.flip_angle_max}` });
        } else {
          checks.push({ param: 'Flip', status: 'error', value: flip_angle, expected: `${sequence.flip_angle_min}-${sequence.flip_angle_max}` });
        }
        
        if (phase_direction === sequence.phase_direction) {
          checks.push({ param: 'Phase', status: 'ok', value: phase_direction, expected: sequence.phase_direction });
        } else {
          checks.push({ param: 'Phase', status: 'error', value: phase_direction, expected: sequence.phase_direction });
        }
        
        if (matrix_size === sequence.matrix_size) {
          checks.push({ param: 'Matrix', status: 'ok', value: matrix_size, expected: sequence.matrix_size });
        } else {
          checks.push({ param: 'Matrix', status: 'error', value: matrix_size, expected: sequence.matrix_size });
        }
        
        if (fov >= sequence.fov_min && fov <= sequence.fov_max) {
          checks.push({ param: 'FoV', status: 'ok', value: fov, expected: `${sequence.fov_min}-${sequence.fov_max}` });
        } else {
          checks.push({ param: 'FoV', status: 'error', value: fov, expected: `${sequence.fov_min}-${sequence.fov_max}` });
        }
        
        if (gap_percentage === sequence.gap_percentage) {
          checks.push({ param: 'Gap', status: 'ok', value: gap_percentage, expected: `${sequence.gap_percentage}%` });
        } else {
          checks.push({ param: 'Gap', status: 'error', value: gap_percentage, expected: `${sequence.gap_percentage}%` });
        }
        
        if (nex === sequence.nex) {
          checks.push({ param: 'NEX', status: 'ok', value: nex, expected: sequence.nex });
        } else {
          checks.push({ param: 'NEX', status: 'error', value: nex, expected: sequence.nex });
        }

        const errors = checks.filter(c => c.status === 'error').length;
        evaluation = {
          sequence: sequence.nombre_secuencia,
          total: checks.length,
          passed: checks.length - errors,
          errors,
          checks
        };
      }
    }

    res.json({ 
      success: true, 
      examId, 
      message: 'Exam saved successfully',
      evaluation
    });
  } catch (error) {
    console.error('Error saving exam:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT e.*, p.nombre as paciente_nombre
      FROM estudios e
      LEFT JOIN pacientes p ON e.paciente_id = p.id
      ORDER BY e.created_at DESC
    `);
    const exams = await stmt.all();
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { paciente_id, tipo_estudio, nombre_secuencia, parametros } = req.body;

    const insertExam = db.prepare(`
      INSERT INTO estudios (paciente_id, tipo_estudio, nombre_secuencia)
      VALUES (?, ?, ?)
    `);
    const examResult = await insertExam.run([paciente_id, tipo_estudio, nombre_secuencia]);
    const examId = examResult.lastInsertRowid;

    const p = parametros || {};
    const insertParams = db.prepare(`
      INSERT INTO parametros_secuencia (
        estudio_id, fov_read, fov_phase, tr_ms, te_ms, ti_ms,
        slice_thickness, slice_gap, flip_angle, voxel_x, voxel_y,
        matrix_x, matrix_y, box_x, box_y, box_width, box_height
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await insertParams.run([
      examId,
      p.fov_read || 250,
      p.fov_phase || 250,
      p.tr_ms || 8000,
      p.te_ms || 35,
      p.ti_ms || null,
      p.slice_thickness || 2.0,
      p.slice_gap || 0,
      p.flip_angle || 90,
      p.voxel_x || 2.0,
      p.voxel_y || 2.0,
      p.matrix_x || 128,
      p.matrix_y || 128,
      p.box_x || 50,
      p.box_y || 50,
      p.box_width || 100,
      p.box_height || 100
    ]);

    res.json({ id: examId, message: 'Exam saved successfully' });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const examStmt = db.prepare(`
      SELECT e.*, p.nombre as paciente_nombre
      FROM estudios e
      LEFT JOIN pacientes p ON e.paciente_id = p.id
      WHERE e.id = ?
    `);
    const exam = await examStmt.get([req.params.id]);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const paramsStmt = db.prepare('SELECT * FROM parametros_secuencia WHERE estudio_id = ?');
    const params = await paramsStmt.get([req.params.id]);

    res.json({ ...exam, parametros: params });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/parameters', async (req, res) => {
  try {
    const { parametros } = req.body;
    const p = parametros || {};

    const stmt = db.prepare(`
      UPDATE parametros_secuencia SET
        fov_read = ?, fov_phase = ?, tr_ms = ?, te_ms = ?, ti_ms = ?,
        slice_thickness = ?, slice_gap = ?, flip_angle = ?,
        voxel_x = ?, voxel_y = ?, matrix_x = ?, matrix_y = ?,
        box_x = ?, box_y = ?, box_width = ?, box_height = ?
      WHERE estudio_id = ?
    `);

    await stmt.run([
      p.fov_read, p.fov_phase, p.tr_ms, p.te_ms, p.ti_ms,
      p.slice_thickness, p.slice_gap, p.flip_angle,
      p.voxel_x, p.voxel_y, p.matrix_x, p.matrix_y,
      p.box_x, p.box_y, p.box_width, p.box_height,
      req.params.id
    ]);

    res.json({ message: 'Parameters updated' });
  } catch (error) {
    console.error('Error updating parameters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;