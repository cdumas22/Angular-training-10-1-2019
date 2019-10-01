import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, merge, combineLatest, interval, Subject } from 'rxjs';
import { tap, take, shareReplay, map, switchMap, startWith } from 'rxjs/operators'
import { Todo } from './models/todo';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private baseUrl = 'http://fake-base-url/api'

  public todos: Observable<Todo[]> = this.http.get<Todo[]>(`${this.baseUrl}/todos`)

  constructor(private http: HttpClient) { }
}
