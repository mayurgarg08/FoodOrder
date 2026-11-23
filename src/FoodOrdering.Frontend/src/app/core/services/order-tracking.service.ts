import { Injectable } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel
} from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface OrderStatusUpdate {
  orderId: number;
  status: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
  private connection?: HubConnection;
  private starting?: Promise<void>;
  private trackedOrderIds = new Set<number>();
  private statusSubject = new Subject<OrderStatusUpdate>();
  private connectedSubject = new BehaviorSubject<boolean>(false);

  readonly statusUpdates$ = this.statusSubject.asObservable();
  readonly connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {}

  async trackOrders(orderIds: number[]): Promise<void> {
    orderIds.forEach(id => this.trackedOrderIds.add(id));
    if (!this.trackedOrderIds.size) return;

    await this.connect();
    await this.joinTrackedOrders();
  }

  async stopTracking(): Promise<void> {
    this.trackedOrderIds.clear();
    const connection = this.connection;
    this.connection = undefined;
    this.connectedSubject.next(false);
    if (connection && connection.state !== HubConnectionState.Disconnected) {
      await connection.stop();
    }
  }

  private async connect(): Promise<void> {
    if (!this.connection) {
      const hubUrl = `${environment.apiUrl.replace(/\/api\/?$/, '')}/hubs/order-tracking`;
      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, { accessTokenFactory: () => this.authService.getToken() || '' })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      this.connection.on('OrderStatusUpdated', (update: OrderStatusUpdate) => {
        this.statusSubject.next(update);
      });
      this.connection.onreconnecting(() => this.connectedSubject.next(false));
      this.connection.onreconnected(() => {
        this.connectedSubject.next(true);
        void this.joinTrackedOrders();
      });
      this.connection.onclose(() => this.connectedSubject.next(false));
    }

    if (this.connection.state === HubConnectionState.Connected) return;
    if (!this.starting) {
      this.starting = this.connection.start()
        .then(() => this.connectedSubject.next(true))
        .finally(() => this.starting = undefined);
    }
    await this.starting;
  }

  private async joinTrackedOrders(): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) return;
    for (const orderId of this.trackedOrderIds) {
      await this.connection.invoke('JoinOrder', orderId);
    }
  }
}
