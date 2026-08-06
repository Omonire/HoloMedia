import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { SocketService } from '../services/socket.service';
import { Message, User } from '../models';
import { AvatarComponent } from '../shared/avatar.component';
import { TimeAgoPipe } from '../shared/timeago.pipe';

interface SocketMessage {
  id: number;
  content: string;
  read: boolean;
  created_at: string;
  sender_id: number;
  recipient_id: number;
}

@Component({
  selector: 'app-conversation',
  imports: [RouterLink, FormsModule, AvatarComponent, TimeAgoPipe],
  templateUrl: './conversation.html',
  styleUrl: './conversation.css',
})
export class ConversationComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private socket = inject(SocketService);
  auth = inject(AuthService);

  other = signal<User | null>(null);
  messages: Message[] = [];
  text = '';
  loading = true;
  error = signal('');
  online = signal(false);

  private thread = viewChild.required<ElementRef<HTMLDivElement>>('thread');
  private poll?: Subscription;
  private offMessage?: () => void;
  private offPresence?: () => void;
  username = '';

  ngOnInit(): void {
    this.username = this.route.snapshot.paramMap.get('username') ?? '';
    this.load();
    this.offMessage = this.socket.on<SocketMessage>('new_message', (m) => this.onSocketMessage(m));
    this.offPresence = this.socket.on<{ user_id: number }>('presence', (p) => {
      if (p.user_id === this.other()?.id) this.online.set(true);
    });
    this.poll = interval(8000).subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.poll?.unsubscribe();
    this.offMessage?.();
    this.offPresence?.();
  }

  private load(): void {
    this.loading = true;
    this.api.get<{ user: User; messages: Message[] }>(`/messages/${this.username}`).subscribe({
      next: (r) => {
        this.other.set(r.user);
        this.messages = r.messages;
        this.loading = false;
        this.scroll();
      },
      error: (e) => {
        this.error.set(e.message);
        this.loading = false;
      },
    });
  }

  private refresh(): void {
    if (!this.other()) return;
    this.api.get<{ user: User; messages: Message[] }>(`/messages/${this.username}`).subscribe({
      next: (r) => {
        this.messages = r.messages;
        this.scroll(false);
      },
      error: () => {},
    });
  }

  private onSocketMessage(m: SocketMessage): void {
    const me = this.auth.user()?.id;
    const otherId = this.other()?.id;
    if (me == null || otherId == null) return;
    if (m.sender_id !== otherId && m.recipient_id !== otherId) return;
    if (this.messages.some((x) => x.id === m.id)) return;

    const msg: Message = {
      ...m,
      mine: m.sender_id === me,
    };
    this.messages = [...this.messages, msg];
    this.scroll();

    if (m.sender_id !== me) {
      this.socket.emit('mark_read', { other_id: m.sender_id });
    }
  }

  send(): void {
    const content = this.text.trim();
    const other = this.other();
    if (!content || !other) return;
    if (this.socket.emit('send_message', { recipient_id: other.id, content })) {
      this.text = '';
      return;
    }
    this.api.post<{ message: Message }>(`/messages/${this.username}`, { content }).subscribe({
      next: (r) => {
        this.messages = [...this.messages, r.message];
        this.text = '';
        this.scroll();
      },
      error: () => {},
    });
  }

  private scroll(force = true): void {
    setTimeout(() => {
      const el = this.thread().nativeElement;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (force || nearBottom) el.scrollTop = el.scrollHeight;
    }, 20);
  }
}
