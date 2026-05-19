import { useState } from 'react';
import {
  Box, Typography, Button, Chip, CircularProgress,
  Alert, Divider, LinearProgress, Avatar, Card,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ReplayIcon from '@mui/icons-material/Replay';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';

// ▼ Lee del store global — comparte datos con MisServicios e InicioResumen
import { useStore } from './Store';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Estrellas({ n }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
      {[1, 2, 3, 4, 5].map(i => {
        const Icon = i <= Math.floor(n) ? StarIcon : i - 0.5 <= n ? StarHalfIcon : StarBorderIcon;
        return <Icon key={i} sx={{ fontSize: 15, color: '#f59e0b' }} />;
      })}
    </Box>
  );
}

function ScoreBadge({ valor }) {
  const color = valor >= 4.5 ? '#10b981' : valor >= 3.5 ? '#f59e0b' : '#ef4444';
  const label = valor >= 4.5 ? 'Excelente' : valor >= 3.5 ? 'Bueno' : 'Necesita mejora';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{
        width: 90, height: 90, borderRadius: '50%',
        border: `5px solid ${color}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${color}10`,
      }}>
        <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1 }}>{valor}</Typography>
        <Estrellas n={Number(valor)} />
      </Box>
      <Chip label={label} size="small" sx={{ backgroundColor: `${color}20`, color, fontWeight: 700, fontSize: 11 }} />
    </Box>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Reputacion() {
  // ▼ Reseñas y devoluciones vienen del store (los mismos datos que MisServicios)
  const { state } = useStore();
  const RESENAS = state.resenas;
  const DEVOLUCIONES = state.devoluciones;

  const [reporte, setReporte]               = useState(null);
  const [cargando, setCargando]             = useState(false);
  const [error, setError]                   = useState(null);
  const [filtroEstrellas, setFiltroEstrellas] = useState('todas');

  const totalResenas    = RESENAS.length;
  const promedioGeneral = totalResenas
    ? (RESENAS.reduce((a, r) => a + r.estrellas, 0) / totalResenas).toFixed(1)
    : '0.0';

  const distribucion = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: RESENAS.filter(r => r.estrellas === n).length,
    pct: totalResenas
      ? Math.round((RESENAS.filter(r => r.estrellas === n).length / totalResenas) * 100)
      : 0,
  }));

  const resenasFiltradas = filtroEstrellas === 'todas'
    ? RESENAS
    : RESENAS.filter(r => r.estrellas === Number(filtroEstrellas));

  // ─── Generar reporte IA ────────────────────────────────────────────────────
  const generarReporte = async () => {
    setCargando(true);
    setError(null);
    setReporte(null);

    const resumenResenas = RESENAS.map(r =>
      `[${r.estrellas}★] ${r.servicio} — "${r.texto}"`
    ).join('\n');

    const resumenDevoluciones = DEVOLUCIONES.map(d =>
      `- ${d.articulo}: ${d.motivo} (${d.estado})`
    ).join('\n');

    const prompt = `Eres un consultor de reputación digital para MonkeyMarket, una plataforma de servicios y productos para eventos.

Analiza las siguientes reseñas y devoluciones de un proveedor y genera un reporte estructurado en JSON con este formato exacto (sin markdown, solo JSON puro):

{
  "resumen": "Un párrafo ejecutivo de 2-3 oraciones resumiendo el estado general de la reputación.",
  "puntuacion": ${promedioGeneral},
  "puntosFuertes": [
    { "titulo": "Título corto", "descripcion": "Explicación de 1-2 oraciones basada en las reseñas." }
  ],
  "areasMejora": [
    { "titulo": "Título corto", "descripcion": "Explicación de 1-2 oraciones basada en las reseñas." }
  ],
  "recomendaciones": [
    "Acción concreta y específica que el proveedor puede tomar."
  ]
}

RESEÑAS (${totalResenas} en total, promedio ${promedioGeneral}★):
${resumenResenas}

DEVOLUCIONES (${DEVOLUCIONES.length}):
${resumenDevoluciones}

Genera exactamente 3 puntos fuertes, 3 áreas de mejora y 3 recomendaciones. Basa todo en evidencia concreta de las reseñas. Solo responde con el JSON, sin texto adicional.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      const texto = data.content?.find(b => b.type === 'text')?.text ?? '';
      const clean = texto.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setReporte(parsed);
    } catch (e) {
      setError('No se pudo generar el reporte. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box>
      {/* ── Encabezado ── */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reputación</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Análisis de reseñas y retroalimentación de tus clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={cargando ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <AutoAwesomeIcon />}
          onClick={generarReporte}
          disabled={cargando || totalResenas === 0}
          sx={{ 
                borderRadius: 50, px: 3, textTransform: 'none', fontWeight: 600, 
                backgroundColor: '#FACC15', color: '#111', 
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)', 
                '&:hover': { backgroundColor: '#FDE047', boxShadow: '0 6px 15px rgba(245, 158, 11, 0.4)' },
                alignSelf: { xs: 'flex-start', sm: 'auto' },
              }}
        >
          {cargando ? 'Generando...' : reporte ? 'Regenerar reporte IA' : 'Generar reporte IA'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Resumen de calificaciones — datos en vivo del store ── */}
      <Box sx={{
        backgroundColor: 'white', borderRadius: 3, p: { xs: 2, sm: 3 }, mb: 3,
        border: '1px solid #e5e7eb',
        display: 'flex', gap: { xs: 2, sm: 4 }, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <ScoreBadge valor={promedioGeneral} />

        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Basado en <strong>{totalResenas} reseñas</strong>
          </Typography>
          {distribucion.map(({ n, count, pct }) => (
            <Box key={n} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, width: 60 }}>
                <Typography variant="caption" fontWeight={600}>{n}</Typography>
                <StarIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
              </Box>
              <LinearProgress variant="determinate" value={pct} sx={{
                flex: 1, height: 8, borderRadius: 4,
                backgroundColor: '#f3f4f6',
                '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: '#f59e0b' },
              }} />
              <Typography variant="caption" color="text.secondary" sx={{ width: 36, textAlign: 'right' }}>
                {count} ({pct}%)
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Stats rápidos */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { label: 'Positivas (4-5★)', val: RESENAS.filter(r => r.estrellas >= 4).length, color: '#10b981' },
            { label: 'Negativas (1-2★)', val: RESENAS.filter(r => r.estrellas <= 2).length, color: '#ef4444' },
            { label: 'Devoluciones',     val: DEVOLUCIONES.length, color: '#f59e0b' },
          ].map(({ label, val, color }) => (
            <Box key={label} sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800} sx={{ color }}>{val}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Reporte IA ── */}
      {reporte && (
        <Card sx={{ borderRadius: 3, mb: 3, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Box sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            p: 2.5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutoAwesomeIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="white">Reporte de Reputación — IA</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Generado a partir de {totalResenas} reseñas y {DEVOLUCIONES.length} devoluciones
                </Typography>
              </Box>
            </Box>
            <Button
              size="small"
              startIcon={<ReplayIcon fontSize="small" />}
              onClick={generarReporte}
              disabled={cargando}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', border: '1px solid', borderRadius: 2, textTransform: 'none', fontSize: 12 }}
            >
              Regenerar
            </Button>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Resumen ejecutivo */}
            <Box sx={{ backgroundColor: '#f8faff', borderRadius: 2, p: 2, mb: 3, borderLeft: '4px solid #6366f1' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>Resumen ejecutivo</Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#1e293b' }}>{reporte.resumen}</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* Puntos fuertes */}
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 1.5, backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUpIcon sx={{ color: '#059669', fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#065f46">Puntos Fuertes</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {reporte.puntosFuertes?.map((p, i) => (
                    <Box key={i} sx={{ backgroundColor: '#f0fdf4', borderRadius: 2, p: 1.8, border: '1px solid #bbf7d0' }}>
                      <Typography variant="body2" fontWeight={700} color="#15803d" sx={{ mb: 0.3 }}>{p.titulo}</Typography>
                      <Typography variant="caption" color="#166534" sx={{ lineHeight: 1.6 }}>{p.descripcion}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Áreas de mejora */}
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 1.5, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDownIcon sx={{ color: '#dc2626', fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#7f1d1d">Áreas de Mejora</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {reporte.areasMejora?.map((a, i) => (
                    <Box key={i} sx={{ backgroundColor: '#fff7f7', borderRadius: 2, p: 1.8, border: '1px solid #fecaca' }}>
                      <Typography variant="body2" fontWeight={700} color="#dc2626" sx={{ mb: 0.3 }}>{a.titulo}</Typography>
                      <Typography variant="caption" color="#991b1b" sx={{ lineHeight: 1.6 }}>{a.descripcion}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Recomendaciones */}
            {reporte.recomendaciones?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2.5 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 16, color: '#6366f1' }} /> Recomendaciones de acción
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {reporte.recomendaciones.map((rec, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
                        <Typography variant="caption" fontWeight={800} color="#6366f1">{i + 1}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{rec}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Card>
      )}

      {/* ── Reseñas individuales — del store ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>Todas las reseñas</Typography>
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          {['todas', '5', '4', '3', '2', '1'].map(f => (
            <Chip key={f}
              label={f === 'todas' ? 'Todas' : `${f} ★`}
              size="small" clickable
              onClick={() => setFiltroEstrellas(f)}
              color={filtroEstrellas === f ? 'primary' : 'default'}
              variant={filtroEstrellas === f ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, fontSize: 12 }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {resenasFiltradas.map(r => (
          <Card key={r.id} sx={{
            borderRadius: 3, p: 2.5, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: r.estrellas <= 2 ? '1px solid #fecaca' : '1px solid #f3f4f6',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar sx={{
                width: 38, height: 38,
                backgroundColor: r.estrellas >= 4 ? '#d1fae5' : r.estrellas === 3 ? '#fef3c7' : '#fee2e2',
                color: r.estrellas >= 4 ? '#059669' : r.estrellas === 3 ? '#d97706' : '#dc2626',
                fontWeight: 700, fontSize: 15,
              }}>
                {r.avatar}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>{r.autor}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.servicio}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Estrellas n={r.estrellas} />
                    <Typography variant="caption" color="text.secondary">{r.fecha}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', mt: 1 }}>
                  <FormatQuoteIcon sx={{ color: '#d1d5db', fontSize: 18, mt: 0.2, mr: 0.5, flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{r.texto}</Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* ── Devoluciones — del store ── */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Devoluciones registradas</Typography>
      {DEVOLUCIONES.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Sin devoluciones registradas.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {DEVOLUCIONES.map(d => (
            <Card key={d.id} sx={{
              borderRadius: 3, p: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AssignmentReturnIcon sx={{ color: '#d97706', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={700}>{d.articulo}</Typography>
                <Typography variant="caption" color="text.secondary">{d.motivo}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip label={d.estado} size="small" sx={{ backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 600, fontSize: 11, mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{d.fecha}</Typography>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}