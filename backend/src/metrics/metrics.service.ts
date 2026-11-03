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

  // Получение данных с Linux-сервера
  async getNetwork(host: string, username: string, password: string) {
    const conn = await this.connectToServer(host, username, password);

    try {
      const addressesRaw = await this.execCommand(conn, 'ip -j addr');
      const routesRaw = await this.execCommand(conn, 'ip -j route');
      const neighborsRaw = await this.execCommand(conn, 'ip -j neigh');
      const socketsRaw = await this.execCommand(conn, 'ss -H -tuln');

      const rawData = {
        addresses: JSON.parse(addressesRaw) as NetworkInterfaceRaw[],
        routes: JSON.parse(routesRaw) as RouteRaw[],
        neighbors: JSON.parse(neighborsRaw) as NeighborRaw[],
        sockets: socketsRaw,
      };

      return this.normalizeNetworkData(rawData);
    } finally {
      conn.end();
    }
  }

  normalizeNetworkData(data: {
    addresses: NetworkInterfaceRaw[];
    routes: RouteRaw[];
    neighbors: NeighborRaw[];
    sockets: string;
  }) {
    
    const interfaces = data.addresses.map((item) => {
      let type = 'other';

      if (item.ifname === 'lo') {
        type = 'loopback';
      } else if (item.ifname.startsWith('br-') || item.ifname === 'docker0') {
        type = 'docker-bridge';
      } else if (item.ifname.startsWith('veth')) {
        type = 'virtual-ethernet';
      } else if (item.ifname.startsWith('wl')) {
        type = 'wireless';
      } else if (item.ifname.startsWith('en') || item.ifname.startsWith('eth')) {
        type = 'ethernet';
      }

      return {
        id: item.ifname,
        name: item.ifname,
        type,
        status: item.operstate ?? 'UNKNOWN',
        mac: item.address ?? null,
        mtu: item.mtu ?? null,
        master: item.master ?? null,

        addresses: (item.addr_info ?? []).map((ip) => ({
          address: ip.local,
          version: ip.family,
          prefix: ip.prefixlen,
          scope: ip.scope,
        })),
      };
    });

   
    const routes = data.routes.map((route, index) => ({
      id: `route-${index}`,
      destination: route.dst ?? 'default',
      gateway: route.gateway ?? null,
      interface: route.dev ?? null,
      sourceAddress: route.prefsrc ?? null,
      metric: route.metric ?? null,
      protocol: route.protocol ?? null,
      isDefault: !route.dst || route.dst === 'default',
    }));


    const neighbors = data.neighbors.map((neighbor, index) => ({
      id: `neighbor-${index}`,
      ip: neighbor.dst,
      mac: neighbor.lladdr ?? null,
      interface: neighbor.dev,
      state: neighbor.state ?? [],
    }));

    const listeningPorts = data.sockets
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        const protocol = parts[0];
        const localAddress = parts[4];

        return {
          protocol,
          address: localAddress,
          port: localAddress?.split(':').pop() ?? null,
        };
      });

    return {
      summary: {
        interfacesCount: interfaces.length,
        routesCount: routes.length,
        neighborsCount: neighbors.length,
        listeningPortsCount: listeningPorts.length,
      },

      interfaces,
      routes,
      neighbors,
      listeningPorts,
    };
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
