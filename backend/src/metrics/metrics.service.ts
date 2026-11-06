import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';

interface NetworkInterfaceRaw {
  ifname: string;
  address?: string;
  operstate?: string;
  mtu?: number;
  link_type?: string;
  master?: string;
  addr_info?: {
    family: string;
    local: string;
    prefixlen: number;
    scope: string;
  }[];
}

interface RouteRaw {
  dst?: string;
  gateway?: string;
  dev?: string;
  prefsrc?: string;
  metric?: number;
  protocol?: string;
}

interface NeighborRaw {
  dst: string;
  dev: string;
  lladdr?: string;
  state?: string[];
}

@Injectable()
export class MetricsService {
  // Выполнение команды по SSH
  execCommand(conn: Client, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });

        stream.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(errorOutput || `Command failed: ${command}`));
            return;
          }

          resolve(output.trim());
        });
      });
    });
  }

  
async getDockerInfo(host: string, username: string, password: string) {
  const conn = await this.connectToServer(host, username, password);

  try {
    const raw = await this.execCommand(
      conn,
      "docker ps -a --format '{{json .}}'",
    );

    const rawNetworks = await this.execCommand(
      conn,
      'docker network inspect $(docker network ls -q)',
    );

    const containers = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const item = JSON.parse(line);

        return {
          id: item.ID,
          name: item.Names,
          image: item.Image,
          state: item.State,
          status: item.Status,
          ports: item.Ports
            ? item.Ports.split(',').map((port: string) => port.trim())
            : [],
        };
      });

    const networks = JSON.parse(rawNetworks).map((network: any) => ({
      id: network.Id,
      name: network.Name,
      driver: network.Driver,
      containers: Object.entries(network.Containers || {}).map(
        ([containerId, container]: [string, any]) => ({
          id: containerId,
          name: container.Name,
          ipv4Address: container.IPv4Address,
        }),
      ),
    }));

    return {
      containers,
      networks,
    };

  } finally {
    conn.end();
  }
}
 
  connectToServer(
    host: string,
    username: string,
    password: string,
  ): Promise<Client> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => resolve(conn));

      conn.on('error', (err) => {
        console.error(`[SSH Connection Error] ${host}:`, err.message);
        reject(new Error('Не удалось подключиться к серверу'));
      });

      conn.connect({
        host,
        port: 22,
        username,
        password,
      });
    });
  }
}
