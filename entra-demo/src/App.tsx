import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { tokenRequest } from './authConfig';
import { obtenerToken } from './token';

// Importación de funciones
import {
  consultarDashboard,
  crearProductoApi,
  actualizarProductoApi,
  eliminarProductoApi,
  crearPedidoApi,
  actualizarEstadoPedidoApi,
} from './api';

// Importación estricta de interfaces
import type {
  Product,
  Order,
  DashboardData
} from './api';

export default function App() {
  const { instance, accounts, inProgress } = useMsal();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [data, setData] = useState<DashboardData>({ products: [], orders: [] });
  const [salida, setSalida] = useState('');
  const [ocupado, setOcupado] = useState(false);
  
  // Términos de búsqueda independientes
  const [searchOrderTerm, setSearchOrderTerm] = useState('');
  const [searchProductTerm, setSearchProductTerm] = useState('');

  const account = accounts[0];
  const bloqueado = ocupado || inProgress !== InteractionStatus.None;

  // Formularios de Productos
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 2500, stock: 20 });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Formulario de Pedidos
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);

  const productosEjemplo = [
    { name: 'Café Capuchino 300ml', description: 'Café expreso con leche vaporizada y espuma', price: 2800, stock: 50 },
    { name: 'Pan Marraqueta (Kg)', description: 'Pan tradicional fresco crujiente', price: 2100, stock: 100 },
    { name: 'Tartaleta de Frutas', description: 'Pie individual con crema pastelera y fruta de estación', price: 3500, stock: 20 },
    { name: 'Pailita de Huevos con Tostadas', description: 'Desayuno preparado al momento para cocina', price: 4900, stock: 15 }
  ];

  async function ejecutar(action: () => Promise<void>) {
    setOcupado(true);
    setSalida('');
    try {
      await action();
    } catch (error) {
      setSalida(error instanceof Error ? error.message : String(error));
    } finally {
      setOcupado(false);
    }
  }

  async function entrar() {
    await instance.loginPopup({
      ...tokenRequest,
      prompt: 'select_account',
    });
  }

  async function probarToken() {
    if (!account) return;
    const token = await obtenerToken(instance, account);
    if (!token.accessToken) {
      throw new Error('No se obtuvo access token de Entra ID');
    }
    setSalida(
      'Token de API Azure AD validado con éxito.\nVence: ' +
        (token.expiresOn?.toLocaleString() ?? 'Consultar metadatos')
    );
  }

  async function cargarDatos() {
    if (account) {
      const res = await consultarDashboard(instance, account);
      setData(res);
      setSalida('Datos del Dashboard actualizados desde el BFF.');
    }
  }

  useEffect(() => {
    if (account) {
      void cargarDatos();
    }
  }, [account]);

  // Manejo de Creación y Edición de Productos
  async function handleGuardarProducto(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!account) return;

    if (editingProductId !== null) {
      // Edición
      await actualizarProductoApi(instance, account, editingProductId, {
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        stock: newProduct.stock,
      });
      setEditingProductId(null);
      setSalida(`Producto #${editingProductId} actualizado con éxito.`);
    } else {
      // Creación
      const prod = newProduct.name ? newProduct : productosEjemplo[Math.floor(Math.random() * productosEjemplo.length)];
      await crearProductoApi(instance, account, prod);
      setSalida('Producto creado exitosamente.');
    }

    setNewProduct({ name: '', description: '', price: 2500, stock: 20 });
    await cargarDatos();
  }

  function handleIniciarEdicion(product: Product) {
    if (!product.id) return;
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
    });
  }

  function handleCancelarEdicion() {
    setEditingProductId(null);
    setNewProduct({ name: '', description: '', price: 2500, stock: 20 });
  }

  async function handleEliminarProducto(id: number) {
    if (account && confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
      await eliminarProductoApi(instance, account, id);
      await cargarDatos();
    }
  }

  async function handleCrearPedido(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!account) return;

    if (!selectedProductId) {
      setSalida('⚠️ Por favor selecciona un producto del catálogo.');
      return;
    }

    const prod = data.products.find(p => p.id === Number(selectedProductId));
    if (!prod) {
      setSalida('⚠️ Producto seleccionado no válido.');
      return;
    }

    if (quantity > prod.stock) {
      setSalida(`⚠️ Cantidad excede el stock disponible (${prod.stock} un.).`);
      return;
    }

    const totalCalculado = prod.price * quantity;

    await crearPedidoApi(instance, account, {
      customerEmail: account.username,
      productId: prod.id,
      itemDescription: `${prod.name} (x${quantity})`,
      quantity: quantity,
      totalAmount: totalCalculado,
      status: 'CREADO',
    });

    setSelectedProductId('');
    setQuantity(1);
    await cargarDatos();
  }

  async function handleCambiarEstado(id: number, status: Order['status']) {
    if (account) {
      try {
        await actualizarEstadoPedidoApi(instance, account, id, status);
        await cargarDatos();
      } catch (err: any) {
        setSalida('⚠️ Regla de Negocio Rechazada: ' + err.message);
      }
    }
  }

  async function salir() {
    if (account) {
      await instance.logoutPopup({ account });
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREADO': return '#3b82f6';
      case 'ACEPTADO': return '#10b981';
      case 'EN_PREPARACIÓN': return '#f59e0b';
      case 'DESPACHADO': return '#8b5cf6';
      case 'ENTREGADO': return '#059669';
      case 'CANCELADO': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Filtros
  const productosFiltrados = data.products.filter(p =>
    p.name.toLowerCase().includes(searchProductTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchProductTerm.toLowerCase())
  );

  const ordersFiltradas = data.orders.filter(o =>
    o.customerEmail.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchOrderTerm.toLowerCase()) ||
    (o.itemDescription && o.itemDescription.toLowerCase().includes(searchOrderTerm.toLowerCase()))
  );

  const productoSeleccionado = data.products.find(p => p.id === Number(selectedProductId));

  return (
    <main style={{ maxWidth: 1100, margin: '20px auto', padding: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>🥖 Pedidos360 - Red de Panaderías & Cafés</h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Plataforma Cloud-Native de Gestión de Pedidos</p>
          </div>
          {account && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '13px', backgroundColor: '#e2e8f0', color: '#334155', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                👤 {account.username}
              </span>
            </div>
          )}
        </div>

        {/* Auth Bar */}
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {!account ? (
            <button disabled={bloqueado} onClick={() => void ejecutar(entrar)} style={{ padding: '10px 20px', backgroundColor: '#0078d4', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Iniciar sesión con Microsoft Entra ID
            </button>
          ) : (
            <>
              <button disabled={bloqueado} onClick={() => void ejecutar(probarToken)} style={{ padding: '6px 12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                1. Validar JWT Entra ID
              </button>
              <button disabled={bloqueado} onClick={() => void ejecutar(cargarDatos)} style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                2. Consultar Dashboard BFF
              </button>
              <button disabled={bloqueado} onClick={() => void ejecutar(salir)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>

        {/* Tabs Navegación */}
        {account && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
            <button onClick={() => setActiveTab('dashboard')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'dashboard' ? '#1e293b' : '#f1f5f9', color: activeTab === 'dashboard' ? '#fff' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
              📊 Resumen KPIs
            </button>
            <button onClick={() => setActiveTab('products')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'products' ? '#1e293b' : '#f1f5f9', color: activeTab === 'products' ? '#fff' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
              🥐 Catálogo ({data.products.length})
            </button>
            <button onClick={() => setActiveTab('orders')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'orders' ? '#1e293b' : '#f1f5f9', color: activeTab === 'orders' ? '#fff' : '#475569', cursor: 'pointer', fontWeight: 'bold' }}>
              📦 Pedidos ({data.orders.length})
            </button>
          </div>
        )}
      </header>

      {/* Salida de Log / Excepciones */}
      {salida && (
        <div style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {salida}
        </div>
      )}

      {account && activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Total Pedidos Registrados</h3>
            <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold', color: '#1e293b' }}>{data.orders.length}</p>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Productos en Catálogo</h3>
            <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold', color: '#2563eb' }}>{data.products.length}</p>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Ventas Totales</h3>
            <p style={{ margin: '10px 0 0 0', fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
              ${data.orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {account && activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Catálogo de Panadería & Café</h2>
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={searchProductTerm}
                onChange={e => setSearchProductTerm(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '220px' }}
              />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Nombre</th>
                  <th style={{ padding: '10px' }}>Descripción</th>
                  <th style={{ padding: '10px' }}>Precio</th>
                  <th style={{ padding: '10px' }}>Stock</th>
                  <th style={{ padding: '10px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>#{p.id}</td>
                    <td style={{ padding: '10px', fontWeight: '600' }}>{p.name}</td>
                    <td style={{ padding: '10px', color: '#64748b', fontSize: '13px' }}>{p.description}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#059669' }}>${p.price}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: p.stock > 5 ? '#d1fae5' : '#fee2e2', color: p.stock > 5 ? '#065f46' : '#991b1b', fontSize: '12px', fontWeight: 'bold' }}>
                        {p.stock} un.
                      </span>
                    </td>
                    <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleIniciarEdicion(p)} style={{ padding: '4px 8px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        Editar
                      </button>
                      {p.id && (
                        <button onClick={() => void ejecutar(() => handleEliminarProducto(p.id!))} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0 }}>
              {editingProductId !== null ? `✏️ Editar Producto #${editingProductId}` : '+ Crear Producto'}
            </h3>
            <form onSubmit={e => void ejecutar(() => handleGuardarProducto(e))} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Nombre" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
              <input placeholder="Descripción" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
              <input type="number" placeholder="Precio" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: +e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
              <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: +e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
              
              <button type="submit" style={{ padding: '10px', backgroundColor: editingProductId !== null ? '#f59e0b' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingProductId !== null ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>

              {editingProductId !== null && (
                <button type="button" onClick={handleCancelarEdicion} style={{ padding: '8px', backgroundColor: '#94a3b8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  Cancelar Edición
                </button>
              )}
            </form>

            {editingProductId === null && (
              <button onClick={() => void ejecutar(() => handleGuardarProducto())} style={{ marginTop: '10px', width: '100%', padding: '8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                🎲 Generar Producto Aleatorio
              </button>
            )}
          </div>
        </div>
      )}

      {account && activeTab === 'orders' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Listado de Pedidos</h2>
              <input
                type="text"
                placeholder="🔍 Buscar por cliente o ítem..."
                value={searchOrderTerm}
                onChange={e => setSearchOrderTerm(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '220px' }}
              />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Cliente</th>
                  <th style={{ padding: '10px' }}>Ítem / Detalle</th>
                  <th style={{ padding: '10px' }}>Cant.</th>
                  <th style={{ padding: '10px' }}>Total</th>
                  <th style={{ padding: '10px' }}>Estado</th>
                  <th style={{ padding: '10px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordersFiltradas.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>#{o.id}</td>
                    <td style={{ padding: '10px', fontSize: '13px' }}>{o.customerEmail}</td>
                    <td style={{ padding: '10px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
                      {o.itemDescription || 'Sin detalle'}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{o.quantity || 1}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#059669' }}>${o.totalAmount}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', color: '#fff', backgroundColor: getStatusColor(o.status), fontSize: '11px', fontWeight: 'bold' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {o.status === 'CREADO' && (
                        <button onClick={() => void handleCambiarEstado(o.id!, 'ACEPTADO')} style={{ padding: '4px 8px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Aceptar
                        </button>
                      )}
                      {o.status === 'ACEPTADO' && (
                        <button onClick={() => void handleCambiarEstado(o.id!, 'DESPACHADO')} style={{ padding: '4px 8px', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Despachar
                        </button>
                      )}
                      {o.status === 'DESPACHADO' && (
                        <button onClick={() => void handleCambiarEstado(o.id!, 'ENTREGADO')} style={{ padding: '4px 8px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Entregar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h3 style={{ marginTop: 0 }}>+ Crear Pedido de Catálogo</h3>
            <form onSubmit={e => void ejecutar(() => handleCrearPedido(e))} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: '#64748b' }}>Cliente:</label>
              <input value={account.username} disabled style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }} />

              <label style={{ fontSize: '12px', color: '#64748b' }}>Seleccionar Producto:</label>
              <select
                value={selectedProductId}
                onChange={e => {
                  setSelectedProductId(e.target.value ? Number(e.target.value) : '');
                  setQuantity(1);
                }}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              >
                <option value="">-- Elige un producto --</option>
                {data.products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price}) - Stock: {p.stock}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '12px', color: '#64748b' }}>Cantidad:</label>
              <input
                type="number"
                min="1"
                max={productoSeleccionado ? productoSeleccionado.stock : 100}
                value={quantity}
                onChange={e => {
                  const val = +e.target.value;
                  const maxStock = productoSeleccionado ? productoSeleccionado.stock : 100;
                  setQuantity(Math.min(maxStock, Math.max(1, val)));
                }}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                required
              />

              {productoSeleccionado && (
                <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '13px', color: '#334155' }}>
                  <div><strong>Stock Disponible:</strong> {productoSeleccionado.stock} un.</div>
                  <div><strong>Monto Total Proyectado:</strong> ${(productoSeleccionado.price * quantity).toLocaleString()}</div>
                </div>
              )}

              <button type="submit" style={{ padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Generar Pedido Web
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}