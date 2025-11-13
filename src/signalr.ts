import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5099';
let connection: HubConnection | null = null;

export async function startSignalR(): Promise<HubConnection> {
  if (connection) return connection;

  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token');

  console.log('Starting SignalR...');
  connection = new HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/floor`, {
      accessTokenFactory: () => token
    })
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  await connection.start();
  console.log('SignalR Connected');
  return connection;
}

export function getConnection(): HubConnection | null {
  return connection;
}

export function stopSignalR(): void {
  if (connection) {
    connection.stop();
    connection = null;
  }
}