import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';

const API_URL = 'http://localhost:3000';

interface Server {
  id: string;
  host: string;
  username: string;
  port: number;
  authType: 'password' | 'key';
}

const initialNodes = [
  { id: 'n1', position: { x: 250, y: 50 }, data: { label: 'Ubuntu' } },
  { id: 'n2', position: { x: 100, y: 200 }, data: { label: 'Nginx' } },
  { id: 'n3', position: { x: 400, y: 200 }, data: { label: 'Docker' } },
];

const initialEdges = [
  { id: 'e1', source: 'n1', target: 'n2' },
  { id: 'e2', source: 'n1', target: 'n3' },
];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const [servers, setServers] = useState<Server[]>([]);


  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [port, setPort] = useState('22');
  const [authType, setAuthType] = useState<'password' | 'key'>('password');

  const [showServers, setShowServers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((prev) => applyNodeChanges(changes, prev)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((prev) => applyEdgeChanges(changes, prev)),
    []
  );

  const onConnect = useCallback(
    (params: any) =>
      setEdges((prev) => addEdge(params, prev)),
    []
  );

 
  const loadServers = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/servers`);

      if (!res.ok) {
        throw new Error(`Ошибка загрузки: ${res.status}`);
      }

      const data: Server[] = await res.json();

      setServers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неизвестная ошибка'
      );
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    void loadServers();
  }, []);

  
  const handleAddServer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setMessage('');

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host,
          username,
          port: Number(port),
          authType,
          password: authType === 'password' ? secret : undefined,
          privateKey: authType === 'key' ? secret : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ошибка сохранения сервера: ${res.status}`);
      }

      const savedServer: Server = await res.json();

      // Добавляем сохранённый сервер в список
      setServers((prev) => [...prev, savedServer]);

    
      setHost('');
      setUsername('');
      setSecret('');
      setPort('22');

      setMessage('Сервер успешно добавлен!');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неизвестная ошибка'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">N</div>
          <div>
            <h2>NetScope</h2>
            <span>Infrastructure map</span>
          </div>
        </div>

        <div className="sidebar-section">

          <p className="section-title">CONNECTION</p>

          <form className="connection-form" onSubmit={handleAddServer}>

            <label>Server IP / Host</label>
            <input
              type="text"
              placeholder="192.168.1.100"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
            />

            <label>SSH Port</label>
            <input
              type="number"
              placeholder="22"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              required
              min="1"
              max="65535"
            />

            <label>Username</label>
            <input
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label>Authentication type</label>
            <select
              value={authType}
              onChange={(e) =>
                setAuthType(e.target.value as 'password' | 'key')
              }
            >
              <option value="password">Password</option>
              <option value="key">Private key</option>
            </select>

            <label>
              {authType === 'password' ? 'Password' : 'Private key'}
            </label>

            <textarea
              placeholder={
                authType === 'password'
                  ? 'Enter password'
                  : 'Paste private key'
              }
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              rows={authType === 'key' ? 5 : 1}
            />

            <button
              type="submit"
              className="connect-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Add server'}
            </button>

          </form>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

        </div>

        {/* SERVER LIST */}
        <div className="servers-section">

          <button
            className="servers-toggle"
            onClick={() => setShowServers((prev) => !prev)}
          >
            <span>My Servers ({servers.length})</span>
            <span>{showServers ? '−' : '+'}</span>
          </button>

          {showServers && (
            <div className="servers-list">

              {servers.length === 0 ? (
                <p className="empty-message">No servers added yet</p>
              ) : (
                servers.map((server) => (
                  <div className="server-item" key={server.id}>
                    <div className="server-item-icon">▣</div>

                    <div>
                      <p>{server.host}</p>
                      <span>
                        {server.username}@{server.host}:{server.port}
                      </span>
                    </div>
                  </div>
                ))
              )}

            </div>
          )}

        </div>

        <div className="connection-status">
          <span className="status-dot"></span>
          <span>Infrastructure discovery</span>
        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        <header className="topbar">
          <div>
            <h1>Infrastructure</h1>
            <p>Visualize your server infrastructure</p>
          </div>

          <div className="topbar-right">
            <span className="environment">LOCAL ENVIRONMENT</span>
          </div>
        </header>

        <div className="workspace">

          <div className="canvas-header">
            <div>
              <h3>Topology map</h3>
              <p>Discover and visualize your infrastructure</p>
            </div>

            <div className="canvas-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setNodes(initialNodes);
                  setEdges(initialEdges);
                }}
              >
                Reset view
              </button>
            </div>
          </div>

          <div className="flow-container">

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
            />

          </div>

        </div>

      </main>
    </div>
  );
}