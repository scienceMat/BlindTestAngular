import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client;

  constructor() {
    const socket = new SockJS('http://localhost:8080/chat');
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => { console.log(str); },
    });
  }

  public connectSocket(): Observable<void> {
    return new Observable((subscriber) => {
      this.stompClient.onConnect = () => {
        console.log('Connected to WebSocket');
        subscriber.next();
        subscriber.complete();
      };

      this.stompClient.onStompError = (error) => {
        console.error('WebSocket connection error:', error);
        subscriber.error(error);
      };

      this.stompClient.activate();
    });
  }

  public subscribeToStart(): Observable<string> {
    return new Observable((subscriber) => {
      this.stompClient.subscribe('/topic/start', (message: IMessage) => {
        subscriber.next(message.body);
      });
    });
  }

  public subscribeToSession(sessionId: number): Observable<string> {
    return new Observable((subscriber) => {
      const subscription = this.stompClient.subscribe(`/topic/session/${sessionId}`, (message: IMessage) => {
        subscriber.next(message.body);
      });

      return () => subscription.unsubscribe();
    });
  }

  public disconnectSocket() {
    if (this.stompClient) {
      this.stompClient.deactivate({ force: true });
      console.log('Disconnected from WebSocket');
    }
  }
}
