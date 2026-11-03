import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';
import * as crypto from 'crypto';

@Injectable()
export class MetricsService {
  execCommand(conn: Client, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let output = '';

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.on('close', () => {
          resolve(output.trim());
        });
      });
    });
  }

  async getNetwork(
  host: string,
  username: string,
  password: string,
) {
  const conn = await this.connectToServer(host, username, password);

  try {
    const addressesRaw = await this.execCommand(conn, 'ip -j addr');
    const routesRaw = await this.execCommand(conn, 'ip -j route');
    const neighborsRaw = await this.execCommand(conn, 'ip neigh show');
    const socketsRaw = await this.execCommand(conn, 'ss -tuln');

    return {
      addresses: JSON.parse(addressesRaw),
      routes: JSON.parse(routesRaw),
      neighbors: neighborsRaw,
      sockets: socketsRaw,
    };
  } finally {
    conn.end();
  }
}



  connectToServer(host: string, username: string, password: string): Promise<Client> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        resolve(conn);
      });
      console.log({
        host,
        username,
        hasPassword: Boolean(password),
      });

      conn.on('error', (err) => {
        console.error(`[SSH Connection Error] Ошибка подключения к ${host}:`, err.message);
        reject('проверьте подключение');
      });
      console.log({
  host,
  username,
  passwordLength: password?.length,
  passwordType: typeof password,
});

      try {
        conn.connect({
          host,
          port: 22,
          username,
          password,
          debug: (message) => {
            console.log('[SSH DEBUG]', message);
          },
        });
      } catch (err: any) {
        console.error(`Критическая ошибка дешифрации для host ${host}:`, err);
        reject('Ошибка расшифровки ключа');
      }
    });
  }
}