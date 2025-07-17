import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatbotRequest {
  message: string;
  sessionId?: string;
}

export interface ChatbotResponse {
  response: string;
  generatedSql?: string;
  queryResult?: any;
  isSuccessful: boolean;
  errorMessage?: string;
  sessionId: string;
}

export interface DatabaseSchema {
  tables: TableInfo[];
}

export interface TableInfo {
  tableName: string;
  description: string;
  columns: ColumnInfo[];
  relationships: RelationshipInfo[];
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
  description: string;
}

export interface RelationshipInfo {
  relationshipType: string;
  relatedTable: string;
  foreignKey: string;
  primaryKey: string;
}

export interface SqlQueryResult {
  isSuccessful: boolean;
  errorMessage?: string;
  data?: any;
  rowCount: number;
  executedSql: string;
}

export interface QueryValidationResult {
  isValid: boolean;
  query: string;
  message: string;
}

export interface ChatbotHelp {
  description: string;
  capabilities: string[];
  exampleQueries: string[];
  supportedOperations: string[];
  limitations: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sqlQuery?: string;
  queryResult?: any;
  isError?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chatbot`;
  private sessionId: string = '';
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  
  public messages$ = this.messagesSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.initializeSession();
  }

  private initializeSession(): void {
    this.sessionId = this.generateSessionId();
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for the Asset Management System. I can help you find information about assets, users, maintenance records, and more. Just ask me a question in plain English!',
      timestamp: new Date()
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  sendMessage(message: string): Observable<ChatbotResponse> {
    const request: ChatbotRequest = {
      message: message.trim(),
      sessionId: this.sessionId
    };

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ChatbotResponse>(`${this.apiUrl}/message`, request, { headers });
  }

  addAssistantMessage(response: ChatbotResponse): void {
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.response,
      timestamp: new Date(),
      sqlQuery: response.generatedSql,
      queryResult: response.queryResult,
      isError: !response.isSuccessful
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, assistantMessage]);
  }

  addErrorMessage(errorMessage: string): void {
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date(),
      isError: true
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, assistantMessage]);
  }

  getDatabaseSchema(): Observable<DatabaseSchema> {
    return this.http.get<DatabaseSchema>(`${this.apiUrl}/schema`);
  }

  getSchemaDescription(): Observable<{ description: string }> {
    return this.http.get<{ description: string }>(`${this.apiUrl}/schema/description`);
  }

  executeCustomQuery(sqlQuery: string): Observable<SqlQueryResult> {
    const request = {
      sqlQuery: sqlQuery,
      description: 'Custom query from chatbot'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<SqlQueryResult>(`${this.apiUrl}/query`, request, { headers });
  }

  validateQuery(sqlQuery: string): Observable<QueryValidationResult> {
    const request = {
      sqlQuery: sqlQuery
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<QueryValidationResult>(`${this.apiUrl}/validate-query`, request, { headers });
  }

  getDatabaseStats(): Observable<{ [key: string]: any }> {
    return this.http.get<{ [key: string]: any }>(`${this.apiUrl}/stats`);
  }

  getHelp(): Observable<ChatbotHelp> {
    return this.http.get<ChatbotHelp>(`${this.apiUrl}/help`);
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
    this.initializeSession();
  }

  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  exportChatHistory(): string {
    const messages = this.getMessages();
    const chatHistory = messages.map(msg => {
      const timestamp = msg.timestamp.toLocaleString();
      const role = msg.role === 'user' ? 'You' : 'AI Assistant';
      let content = `[${timestamp}] ${role}: ${msg.content}`;
      
      if (msg.sqlQuery) {
        content += `\n  Generated SQL: ${msg.sqlQuery}`;
      }
      
      if (msg.queryResult) {
        content += `\n  Query Result: ${JSON.stringify(msg.queryResult, null, 2)}`;
      }
      
      return content;
    }).join('\n\n');

    return `Chat History - ${new Date().toLocaleString()}\n` +
           `Session ID: ${this.sessionId}\n` +
           `=`.repeat(50) + '\n\n' +
           chatHistory;
  }

  downloadChatHistory(): void {
    const history = this.exportChatHistory();
    const blob = new Blob([history], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chatbot-history-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper method to format query results for display
  formatQueryResult(result: any): string {
    if (!result) return 'No data returned';
    
    if (Array.isArray(result)) {
      if (result.length === 0) return 'No records found';
      
      // Create a simple table format
      const keys = Object.keys(result[0]);
      let formatted = keys.join(' | ') + '\n';
      formatted += keys.map(() => '---').join(' | ') + '\n';
      
      result.slice(0, 10).forEach(row => { // Limit to first 10 rows
        formatted += keys.map(key => row[key] || 'NULL').join(' | ') + '\n';
      });
      
      if (result.length > 10) {
        formatted += `... and ${result.length - 10} more rows`;
      }
      
      return formatted;
    }
    
    return JSON.stringify(result, null, 2);
  }
}