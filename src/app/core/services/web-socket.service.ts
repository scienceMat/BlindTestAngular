import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client;
  private isConnected$ = new BehaviorSubject<boolean>(false); // Observable to track connection state

  constructor() {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/chat'),
      debug: (str) => { console.log(str); },
      reconnectDelay: 5000, // Reconnect every 5 seconds if disconnected
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.stompClient.onConnect = () => {
      console.log('Connected to WebSocket');
      this.isConnected$.next(true); // Mark as connected
    };

    this.stompClient.onStompError = (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected$.next(false); // Mark as disconnected
    };

    this.stompClient.onWebSocketClose = (event) => {
      console.log('WebSocket closed:', event);
      this.isConnected$.next(false); // Mark as disconnected
    };
  }

  /**
   * Connect to the WebSocket
   */
  public connectSocket(): void {
    if (!this.isConnected$.getValue()) {
      this.stompClient.activate(); // Activate the connection
    } else {
      console.warn('WebSocket is already connected.');
    }
  }

  /**
   * Subscribe to a specific session topic
   * @param sessionId Session ID to subscribe to
   * @returns Observable for the messages from the subscribed session
   */
  public subscribeToSession(sessionId: string): Observable<string> {
    return new Observable((subscriber) => {
      if (!this.isConnected$.getValue()) {
        console.error('Cannot subscribe, WebSocket is not connected.');
        return;
      }

      const subscription = this.stompClient.subscribe(`/topic/session/${sessionId}`, (message: IMessage) => {
        subscriber.next(message.body);
        console.log(`subcribed from /topic/session/${message.body}`);
      });

      return () => {
        subscription.unsubscribe();
        console.log(`Unsubscribed from /topic/session/${sessionId}`);
      };
    });
  }

  /**
   * Disconnect from the WebSocket
   */
  public disconnectSocket(): void {
    if (this.isConnected$.getValue()) {
      this.stompClient.deactivate().then(() => {
        console.log('Disconnected from WebSocket');
        this.isConnected$.next(false);
      });
    } else {
      console.warn('WebSocket is not connected, cannot disconnect.');
    }
  }

  /**
   * Get the connection state as an observable
   * @returns Observable<boolean> Connection state (true if connected, false if not)
   */
  public getConnectionState(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }
}
