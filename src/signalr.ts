// src/signalr.ts
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;

export async function startSignalR() {
  if (connection) return connection;

  console.log('Starting SignalR...');
  connection = new HubConnectionBuilder()
    .withUrl('http://localhost:5140/hubs/floor')
    .configureLogging(LogLevel.Information)
    .withAutomaticReconnect()
    .build();

  try {
    await connection.start();
    console.log('SignalR connected.');
  } catch (err) {
    console.error('SignalR failed:', err);
    connection = null;
    throw err;
  }
  return connection;
}

export function stopSignalR() {
  if (connection) {
    connection.stop().catch(err => console.error('Stop failed:', err));
    connection = null;
  }
}

export function getConnection() {
  return connection;
}