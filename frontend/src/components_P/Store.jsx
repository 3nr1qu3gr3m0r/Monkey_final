import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../config/api';

// ─── Estado inicial ────────────────────────────────────────────────────────────
const ESTADO_INICIAL = {
  items: [],
  meses: [
    { mes: 'Jul', valor: 20, activo: false }, 
    { mes: 'Ago', valor: 50, activo: false }, 
    { mes: 'Sep', valor: 80, activo: false }, 
    { mes: 'Oct', valor: 40, activo: false }, 
    { mes: 'Nov', valor: 90, activo: true }
  ],
  resenas: [],
  reservasHoy: 0,
  pedidosPorEmpaquetar: 0,
  saldoWallet: 0,
  devoluciones: [],
  pedidosActivos: [], // Aquí guardamos las ventas reales
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'ACTUALIZAR_WALLET':
      return { ...state, saldoWallet: action.payload };
    case 'SET_ITEMS':
      return { ...state, items: action.payload };
    case 'AGREGAR_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'EDITAR_ITEM':
      return { ...state, items: state.items.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'ELIMINAR_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'TOGGLE_PAUSA':
      return {
        ...state,
        items: state.items.map(i => {
          if (i.id === action.payload) {
            // 🚀 BLINDAJE: Si el admin lo bloqueó, el estado local tampoco se mueve
            if (i.estado === 'bloqueado') return i;
            return { ...i, estado: i.estado === 'activo' ? 'pausado' : 'activo' };
          }
          return i;
        }),
      };
    
    // 👇 ACCIONES PARA EL DASHBOARD Y ESTATUS
      case 'SET_DASHBOARD_DATA':
        const { saldoWallet, totalRetiros, pedidos } = action.payload; // 🚀 Agregamos totalRetiros aquí
        return {
          ...state,
          saldoWallet: saldoWallet,
          totalRetiros: totalRetiros || 0, // 🚀 Lo guardamos en el estado global
          pedidosActivos: pedidos,
          reservasHoy: pedidos.filter(p => p.tipo === 'servicio' && p.estatus !== 'entregado').length,
          pedidosPorEmpaquetar: pedidos.filter(p => p.tipo === 'producto' && p.estatus === 'pendiente').length
      };
    case 'SET_PEDIDOS_ACTIVOS': // 🚀 NUEVA ACCIÓN PARA ACTUALIZAR SOLO LOS PEDIDOS
      return {
        ...state,
        pedidosActivos: action.payload
      };
    case 'UPDATE_PEDIDO_ESTATUS':
      return {
        ...state,
        pedidosActivos: state.pedidosActivos.map(p => 
          p.id === action.payload.id ? { ...p, estatus: action.payload.estatus } : p
        )
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, ESTADO_INICIAL);

  const actions = {
    setItems:            (payload) => dispatch({ type: 'SET_ITEMS', payload }),
    agregarItem:         (payload) => dispatch({ type: 'AGREGAR_ITEM', payload }),
    editarItem:          (payload) => dispatch({ type: 'EDITAR_ITEM', payload }),
    eliminarItem:        (id)      => dispatch({ type: 'ELIMINAR_ITEM', payload: id }),
    togglePausa:         (id)      => dispatch({ type: 'TOGGLE_PAUSA', payload: id }),
    updatePedidoEstatus: (id, estatus) => dispatch({ type: 'UPDATE_PEDIDO_ESTATUS', payload: { id, estatus } }),
    actualizarWallet:    (nuevoSaldo) => dispatch({ type: 'ACTUALIZAR_WALLET', payload: nuevoSaldo }),
    setPedidosActivos:   (pedidos) => dispatch({ type: 'SET_PEDIDOS_ACTIVOS', payload: pedidos }), // 🚀 AGREGADO AQUÍ
  };

  // 👇 CARGAMOS LA BILLETERA Y LOS PEDIDOS AL INICIAR EL STORE
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/proveedor/dashboard');
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: res.data });
      } catch (error) {
        console.error("Error cargando dashboard del proveedor:", error);
      }
    };
    fetchDashboard();
  }, []);

  const metricas = {
    totalItems: state.items.length,
    itemsActivos: state.items.filter(i => i.estado === 'activo').length,
    promedioCalificacion: state.resenas.length
      ? (state.resenas.reduce((a, r) => a + r.estrellas, 0) / state.resenas.length).toFixed(1)
      : null,
    totalResenas: state.resenas.length,
    totalDevoluciones: state.devoluciones.length,
  };

  return (
    <StoreContext.Provider value={{ state, actions, metricas }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}