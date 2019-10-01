import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, merge, combineLatest, interval, Subject } from 'rxjs';
import { tap, take, shareReplay, map, switchMap, startWith } from 'rxjs/operators'
import { Todo } from '../models/todo';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../user.service';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private baseUrl = 'http://fake-base-url/api'
  private _todos: Todo[] = []
  private todosSubject = new Subject<Todo[]>()

  public todos: Observable<Todo[]> = merge(
    this.todosSubject.asObservable(),
    interval(5000).pipe(
      startWith(0),
      switchMap(() => {
        return combineLatest(
          this.http.get<Todo[]>(`${this.baseUrl}/todos`),
          this.userService.users
        ).pipe(
          map(([todos, users]) => {
            console.log('retrieved items')
            return todos.map(todo => {
              todo.user = users.find(user => user.id === todo.userId)
              return todo
            })
          }),
          tap(todos => this._todos = todos)
        )
      })),
  ).pipe(shareReplay(1));

  constructor(private http: HttpClient, private userService: UserService) { }

  public create(todo: Todo) {
    return this.mergeWithCurrent(
      this.http.post<Todo>(`${this.baseUrl}/todos`, todo)
    ).pipe(
      take(1)
    ).subscribe()
  }

  public update(todo: Todo) {
    return this.mergeWithCurrent(
      this.http.put<Todo>(`${this.baseUrl}/todos`, todo),
      todo
    ).pipe(
      take(1)
    ).subscribe()
  }

  private mergeWithCurrent(o: Observable<Todo>, oldItem?: Todo) {
    return o.pipe(
      switchMap(newTodo => this.userService.users.pipe(
        map(users => {
          const user = users.find(x => x.id === newTodo.userId)
          newTodo.user = user
          return newTodo
        }))),
      tap(newTodo => this._todos = [...this._todos.filter(x => x !== oldItem), newTodo]),
      tap(() => this.todosSubject.next(this._todos))
    )
  }
}
