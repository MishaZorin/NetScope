import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './App.css';
import type { Node } from '@xyflow/react';
const API_URL = 'http://localhost:3000';

interface Server {
  id: string;
  host: string;
  username: string;
  port: number;
  authType: 'password' | 'key';
  password?: string;
  privateKey?: string;
}
interface Response {
  containers: {
    id: string;
    name: string;
    image: string;
    state: string;
    status: string;
    ports: string[];
  }[];
}


const initialNodes: Node[] = [];

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

      const res = await fetch(`${API_URL}/servers/load`);

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

      setServers((prev) => [
        ...prev,
        {
          ...savedServer,
          password: authType === 'password' ? secret : undefined,
          privateKey: authType === 'key' ? secret : undefined,
        },
      ]);


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


  const getTopologyMap = async (server: Server) => {
    try {
      setError('');

      const res = await fetch(`${API_URL}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: server.host,
          username: server.username,
          port: server.port,
          authType: server.authType,
          password: server.password,
          privateKey: server.privateKey,
        }),
      });

      

      if (!res.ok) {
        throw new Error(`Ошибка загрузки: ${res.status}`);
      }

     const data: Response = await res.json();
     setNodes(
  data.containers.map((container, index) => ({
    id: container.id,
    position: {
      x: 250 + (index % 3) * 200,
      y: 50 + Math.floor(index / 3) * 150,
    },
    data: {
      label: container.name,
    },
  }))
);
      console.log('Topology:', data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неизвестная ошибка'
      );
    }
  };
  const handleDeleteServer = async (serverId: string) => {
    try {
      const res = await fetch(`${API_URL}/servers/${serverId}`, {
        method: "DELETE",

      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        throw new Error(
          errorData.message || `Ошибка сервера: ${res.status}`
        );
      }

      setServers(prev =>
        prev.filter(server => server.id !== serverId)
      );



    } catch (error) {
      console.error("Ошибка при удалении сервера:", error);
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
            <div className="servers-list" >

              {servers.length === 0 ? (
                <p className="empty-message">No servers added yet</p>
              ) : (
                servers.map((server) => (
                  <div className="server-item" key={server.id} >
                    <div className="server-item-icon">▣</div>
                    <button
                      className="btn-secondary"
                      onClick={() => getTopologyMap(server)}
                    >
                      Discover
                    </button>

                    <div>
                      <p>{server.host}</p>
                      <span>
                        {server.username}@{server.host}:{server.port}
                      </span>
                      <button className="btn-secondary" onClick={() => handleDeleteServer(server.id)}>
                        Удалить
                      </button>
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