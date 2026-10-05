import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  namespace: '/incidents',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((x) => x.trim()) ?? '*',
    credentials: true,
  },
})
export class IncidentGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-incident')
  joinIncident(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { incidentId: number },
  ) {
    const room = `incident-${Number(body.incidentId)}`;
    client.join(room);
    return { joined: room };
  }

  @SubscribeMessage('leave-incident')
  leaveIncident(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { incidentId: number },
  ) {
    const room = `incident-${Number(body.incidentId)}`;
    client.leave(room);
    return { left: room };
  }

  broadcastIncidentUpdate(
    incidentId: number,
    payload: unknown,
  ) {
    this.server
      .to(`incident-${incidentId}`)
      .emit('incident.updated', payload);
  }
}