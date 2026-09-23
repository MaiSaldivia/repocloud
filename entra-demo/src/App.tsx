import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { tokenRequest } from './authConfig';
import { obtenerToken } from './token';
import { consultarDashboard, crearProductoApi, crearPedidoApi } from './api';

export default function App() {
  const { instance, accounts, inProgress } = useMsal();
  const [salida, setSalida] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const account = accounts[0];
  const bloqueado = ocupado || inProgress !== InteractionStatus.None;

  // Ejemplos de productos para la red de Panaderías/Cafés (EFT Pedidos360)
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
      setSalida(
        error instanceof Error ? error.message : String(error)
      );
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
    setHasToken(true);
    setSalida(
      'Token de API Azure AD validado con éxito.\nVence: ' +
        (token.expiresOn?.toLocaleString() ?? 'Consultar metadatos')
    );
  }

  async function consultar() {
    if (account) {
      const resultado = await consultarDashboard(instance, account);
      setSalida(JSON.stringify(resultado, null, 2));
    }
  }

  async function agregarProductoPanaderia() {
    if (account) {
      const randomProd = productosEjemplo[Math.floor(Math.random() * productosEjemplo.length)];
      const resultado = await crearProductoApi(instance, account, randomProd);
      setSalida('Producto de Panadería/Café creado en Catálogo:\n' + JSON.stringify(resultado, null, 2));
    }
  }

  async function agregarPedidoPanaderia() {
    if (account) {
      const nuevoPedido = {
        customerEmail: account.username,
        totalAmount: 4900,
        status: 'CREADO' as const,
      };
      const resultado = await crearPedidoApi(instance, account, nuevoPedido);
      setSalida('Pedido de PyME creado (Pendiente Aceptación/Cocina):\n' + JSON.stringify(resultado, null, 2));
    }
  }

  async function salir() {
    if (account) {
      setHasToken(false);
      await instance.logoutPopup({ account });
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 20, fontFamily: 'Segoe UI, sans-serif' }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 15, marginBottom: 20 }}>
        <h1 style={{ color: '#2d3748', marginBottom: 5 }}>Pedidos360 - Red de Panaderías & Cafés</h1>
        <p style={{ color: '#718096', margin: 0 }}>Plataforma Cloud-Native de gestión de pedidos y despachos (Caso EFT)</p>
      </header>

      {!account ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <button
            disabled={bloqueado}
            onClick={() => void ejecutar(entrar)}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#0078d4',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Iniciar sesión con Microsoft Entra ID
          </button>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: '#f7fafc', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
            <strong>Usuario Activo (IDaaS):</strong> {account.username}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button disabled={bloqueado} onClick={() => void ejecutar(probarToken)}>
              1. Validar JWT Entra ID
            </button>
            <button disabled={bloqueado || !hasToken} onClick={() => void ejecutar(consultar)}>
              2. Consultar Dashboard BFF
            </button>
            <button disabled={bloqueado || !hasToken} onClick={() => void ejecutar(agregarProductoPanaderia)}>
              + Crear Producto (Pan/Café)
            </button>
            <button disabled={bloqueado || !hasToken} onClick={() => void ejecutar(agregarPedidoPanaderia)}>
              + Crear Pedido Web
            </button>
            <button disabled={bloqueado} onClick={() => void ejecutar(salir)}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      <h3>Panel de Datos (BFF &gt; Microservicios):</h3>
      <pre style={{
        backgroundColor: '#1a202c',
        color: '#48bb78',
        padding: '18px',
        borderRadius: '6px',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        minHeight: '180px',
        fontSize: '14px'
      }}>
        {salida || '// Presiona "2. Consultar Dashboard BFF" o crea productos/pedidos para visualizar las respuestas del backend.'}
      </pre>
    </main>
  );
}