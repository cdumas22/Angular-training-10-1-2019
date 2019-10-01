import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { Todo } from './models/todo';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private _todos: Todo[] = []
  private todosSubject = new ReplaySubject<Todo[]>()

  public todos: Observable<Todo[]> = this.todosSubject.asObservable();

  constructor() { }
}
