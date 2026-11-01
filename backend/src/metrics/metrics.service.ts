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

  async getNetwork(host: string, username: string, password: string): Promise<string> {
    const conn = await this.connectToServer(host, username, password);
    const uptimeRaw = await this.execCommand(conn, `
      ip -j addr
ip -j route
ip neigh show
ss -tuln`);
    conn.end();
    return uptimeRaw;
  }



  connectToServer(host: string, username: string, password: string): Promise<Client> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        resolve(conn);
      });

      conn.on('error', (err) => {
        console.error(`[SSH Connection Error] Ошибка подключения к ${host}:`, err.message);
        reject('проверьте подключение');
      });

      try {
        conn.connect({
          host,
          port: 22,
          username,
          password,
        });
      } catch (err: any) {
        console.error(`Критическая ошибка дешифрации для host ${host}:`, err);
        reject('Ошибка расшифровки ключа');
      }
    });
  }
}