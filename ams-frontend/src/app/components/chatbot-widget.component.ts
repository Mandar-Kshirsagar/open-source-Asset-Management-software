import { Component, ChangeDetectionStrategy, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChangeDetectorRef } from '@angular/core';
import { NgZone, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChatbotService, ChatMessage } from '../services/chatbot.service';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatInputModule, MatProgressSpinnerModule, MatMenuModule, MatTooltipModule],
  template: `
    <div class="chatbot-fab" (click)="toggleChat()" *ngIf="!open">
      <mat-icon>chat</mat-icon>
    </div>
    <div class="chatbot-window" *ngIf="open" [ngStyle]="{top: position.top + 'px', left: position.left + 'px'}" (mousedown)="startDrag($event)">
      <div class="chatbot-header">
        <div class="avatar"><mat-icon>smart_toy</mat-icon></div>
        <span>AI Database Assistant</span>
        <div class="header-actions">
          <button mat-icon-button [matMenuTriggerFor]="menu" matTooltip="Options">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="showHelp()">
              <mat-icon>help</mat-icon>
              <span>Help</span>
            </button>
            <button mat-menu-item (click)="downloadHistory()">
              <mat-icon>download</mat-icon>
              <span>Download History</span>
            </button>
            <button mat-menu-item (click)="clearChat()">
              <mat-icon>clear</mat-icon>
              <span>Clear Chat</span>
            </button>
          </mat-menu>
          <button mat-icon-button (click)="toggleChat()"><mat-icon>close</mat-icon></button>
        </div>
      </div>
                      <div class="chatbot-messages" #scrollMe>
          <div *ngFor="let msg of messages" [ngClass]="msg.role">
            <div class="msg-bubble" [ngClass]="{'error-msg': msg.isError}">
              <div class="msg-content">
                <ng-container *ngIf="msg.role === 'user'">{{ msg.content }}</ng-container>
                <ng-container *ngIf="msg.role === 'assistant'">{{ msg.content }}</ng-container>
              </div>
              
            </div>
          </div>
          <div *ngIf="loading" class="loading-msg">
            <mat-progress-spinner diameter="24" mode="indeterminate"></mat-progress-spinner>
            <span>Thinking...</span>
          </div>
        </div>
      <form class="chatbot-input" (ngSubmit)="sendMessage()">
        <input matInput [(ngModel)]="input" name="input" placeholder="Type your question..." [disabled]="loading" autocomplete="off" />
        <button mat-icon-button color="primary" type="submit" [disabled]="!input.trim() || loading">
          <mat-icon>send</mat-icon>
        </button>
      </form>
    </div>
  `,
  styles: [`
    .chatbot-fab {
      position: fixed;
      bottom: 32px;
      right: 32px;
      background: linear-gradient(135deg, #1976d2 60%,rgb(105, 113, 119) 100%);
      color: #fff;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(25, 118, 210, 0.25), 0 1.5px 6px rgba(0,0,0,0.08);
      cursor: pointer;
      z-index: 1000;
      transition: background 0.2s, box-shadow 0.2s;
      font-size: 2rem;
    }
    .chatbot-fab:hover { background: linear-gradient(135deg, #1565c0 60%, #42a5f5 100%); box-shadow: 0 8px 32px rgba(25, 118, 210, 0.35); }
    .chatbot-window {
      position: fixed;
      width: 370px;
      max-width: 95vw;
      height: 520px;
      background: rgba(255,255,255,0.85);
      border-radius: 18px;
      box-shadow: 0 8px 32px rgba(25, 118, 210, 0.18), 0 2px 8px rgba(0,0,0,0.10);
      display: flex;
      flex-direction: column;
      z-index: 1001;
      overflow: hidden;
      backdrop-filter: blur(8px);
      border: 1.5px solid rgba(66,165,245,0.12);
      transition: box-shadow 0.2s, background 0.2s;
      user-select: none;
    }
    .chatbot-header {
      background: linear-gradient(90deg, #1976d2 70%, #42a5f5 100%);
      color: #fff;
      padding: 18px 18px 18px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 1.1rem;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.08);
      border-bottom: 1px solid rgba(66,165,245,0.12);
      cursor: move;
      gap: 10px;
    }
    .avatar {
      background: #fff2;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      font-size: 1.6rem;
      box-shadow: 0 1px 4px rgba(25, 118, 210, 0.10);
    }
    .chatbot-messages {
      flex: 1;
      padding: 18px 16px 12px 16px;
      overflow-y: auto;
      background: linear-gradient(135deg, #f7faff 60%, #e3f2fd 100%);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: background 0.2s;
    }
    .chatbot-input {
      display: flex;
      padding: 14px 18px;
      border-top: 1px solid #e3f2fd;
      background: rgba(255,255,255,0.95);
      align-items: center;
      gap: 10px;
      box-shadow: 0 -1px 4px rgba(25, 118, 210, 0.04);
    }
    .chatbot-input input {
      flex: 1;
      font-size: 1rem;
      border-radius: 8px;
      background: #f7faff;
      border: 1px solid #e3f2fd;
      padding: 8px 10px;
      transition: border 0.2s;
    }
    .chatbot-input input:focus {
      border: 1.5px solid #1976d2;
      outline: none;
      background: #fff;
    }
    .msg-bubble {
      background: linear-gradient(135deg, #e3f2fd 60%, #f7faff 100%);
      color: #222;
      border-radius: 12px;
      padding: 10px 14px;
      max-width: 80%;
      display: inline-block;
      word-break: break-word;
      font-size: 1rem;
      box-shadow: 0 1px 4px rgba(25, 118, 210, 0.06);
      transition: background 0.2s;
      white-space: pre-wrap;
    }
    .user .msg-bubble {
      background: linear-gradient(135deg, #1976d2 60%, #42a5f5 100%);
      color: #fff;
      margin-left: auto;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.10);
    }
    .assistant .msg-bubble {
      background: linear-gradient(135deg, #e3f2fd 60%, #f7faff 100%);
      color: #222;
      margin-right: auto;
    }
    .user-label, .assistant-label {
      font-size: 0.85em;
      font-weight: 500;
      margin-right: 4px;
      color: #888;
    }
    .loading-msg {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 8px 0;
    }
    @media (max-width: 600px) {
      .chatbot-window {
        width: 98vw;
        height: 70vh;
      }
    }
    
    /* New styles for enhanced chatbot */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .error-msg {
      border-left: 4px solid #f44336 !important;
      background: #ffebee !important;
    }
    
    .sql-query, .query-result {
      margin-top: 12px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    
    .sql-header, .result-header {
      background: #f5f5f5;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      color: #555;
    }
    
    .sql-code, .result-data {
      margin: 0;
      padding: 12px;
      background: #fafafa;
      border: none;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      overflow-x: auto;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .sql-code {
      background: #f8f8f8;
      color: #d73027;
    }
    
    .result-data {
      background: #f0f8ff;
      color: #333;
    }
    
    .loading-msg {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin: 16px 0;
    }
    
    .loading-msg span {
      font-size: 0.9rem;
      color: #666;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatbotWidgetComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
  open = false;
  input = '';
  messages: ChatMessage[] = [];
  loading = false;
  position = { top: 0, left: 0 };
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private windowWidth = 370; // match .chatbot-window width
  private windowHeight = 520; // match .chatbot-window height
  private subscription: Subscription = new Subscription();
  @ViewChild('scrollMe') scrollMe!: ElementRef;

  constructor(
    private chatbotService: ChatbotService,
    private cdr: ChangeDetectorRef, 
    private zone: NgZone, 
    private appRef: ApplicationRef
  ) {
    // Subscribe to messages from the service
    this.subscription.add(
      this.chatbotService.messages$.subscribe(messages => {
        this.messages = messages;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.open = !this.open;
    if (this.open) {
      // Set position to bottom right on open
      const padding = 32;
      const width = Math.min(this.windowWidth, window.innerWidth * 0.95);
      const height = Math.min(this.windowHeight, window.innerHeight * 0.7);
      this.position.left = window.innerWidth - width - padding;
      this.position.top = window.innerHeight - height - padding;
      this.cdr.markForCheck();
    }
  }

  sendMessage() {
    const msg = this.input.trim();
    if (!msg) return;
    
    this.input = '';
    this.loading = true;
    this.cdr.markForCheck();
    
    this.subscription.add(
      this.chatbotService.sendMessage(msg).subscribe({
        next: (response) => {
          this.zone.run(() => {
            this.chatbotService.addAssistantMessage(response);
            this.loading = false;
            this.cdr.markForCheck();
            this.appRef.tick();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            console.error('Chatbot error:', err);
            this.chatbotService.addErrorMessage('Sorry, there was an error processing your request. Please try again.');
            this.loading = false;
            this.cdr.markForCheck();
            this.appRef.tick();
          });
        }
      })
    );
  }

  showHelp() {
    this.subscription.add(
      this.chatbotService.getHelp().subscribe({
        next: (help) => {
          let helpMessage = `${help.description}\n\n`;
          helpMessage += `**Example Queries:**\n${help.exampleQueries.map(q => `• ${q}`).join('\n')}\n\n`;
          helpMessage += `**Capabilities:**\n${help.capabilities.map(c => `• ${c}`).join('\n')}\n\n`;
          helpMessage += `**Limitations:**\n${help.limitations.map(l => `• ${l}`).join('\n')}`;
          
          this.chatbotService.addAssistantMessage({
            response: helpMessage,
            isSuccessful: true,
            sessionId: ''
          });
        },
        error: () => {
          this.chatbotService.addErrorMessage('Unable to load help information.');
        }
      })
    );
  }

  downloadHistory() {
    this.chatbotService.downloadChatHistory();
  }

  clearChat() {
    this.chatbotService.clearMessages();
  }

  formatResult(result: any): string {
    return this.chatbotService.formatQueryResult(result);
  }

  startDrag(event: MouseEvent) {
    if (!(event.target as HTMLElement).classList.contains('chatbot-header')) return;
    this.dragging = true;
    this.dragOffset = {
      x: event.clientX - (event.currentTarget as HTMLElement).getBoundingClientRect().left,
      y: event.clientY - (event.currentTarget as HTMLElement).getBoundingClientRect().top
    };
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
  }

  onDrag = (event: MouseEvent) => {
    if (!this.dragging) return;
    this.position.top = event.clientY - this.dragOffset.y;
    this.position.left = event.clientX - this.dragOffset.x;
    this.cdr.markForCheck();
  };

  stopDrag = () => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  };

  private scrollToBottom() {
    try {
      if (this.scrollMe && this.scrollMe.nativeElement) {
        this.scrollMe.nativeElement.scrollTop = this.scrollMe.nativeElement.scrollHeight;
      }
    } catch {}
  }
}