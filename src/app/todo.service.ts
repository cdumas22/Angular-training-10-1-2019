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
  private _todos: Todo[] = []
  private todosSubject = new Subject<Todo[]>()

  public todos: Observable<Todo[]> = merge(
    // observable 1 - watches for any local changes to the todos (create, update, delete)
    this.todosSubject.asObservable(),
    // observable 2 - interval to triggerr getting todos from the server
    interval(5000).pipe(
      // always startWith so the interval fires immediately on subscribe
      startWith(0),
      // on interval switch to the observable we want to send out as the todos
      switchMap(() => {
        // observable 3 - combine together the call to get todos and users. This allows us to map todo.userId to an actual user
        return combineLatest(
          // observable 4 - request for todos
          this.http.get<Todo[]>(`/api/todos`).pipe(tap(() => console.log('get todos'))),
          // observable 5 - users
          this.userService.users
        ).pipe(
          // map users to a todo and return out our todo collection
          map(([todos, users]) => {
            console.log('merge users with todos')
            return todos.map(todo => {
              todo.user = users.find(user => user.id === todo.userId)
              return todo
            })
          }),
          // Save the current state to _todos.
          // This makes it possible for the todoSubject to send out updates
          tap(todos => this._todos = todos)
        )
      })),
  ).pipe(
    // share the completed collection
    // whenever the todoSubject or interval updates this updates
    shareReplay(1)
  );

  constructor(private http: HttpClient, private userService: UserService) { }

  /**
   * When you cancel updating we need to force a new event on the todos
   * so any updates that have come in while you were editing get sent out
   */
  public forceSendUpdates() {
    this.todosSubject.next(this._todos)
  }

  public create(todo: Todo) {
    return this.sendUpdateOrCreate(
      this.http.post<Todo>(`/api/todos`, todo)
    )
  }

  public update(todo: Todo) {
    return this.sendUpdateOrCreate(
      this.http.put<Todo>(`/api/todos`, todo),
      todo
    )
  }

  /**
   * Delete a todo from the collection
   */
  public delete(todo: Todo) {
    return this.http.delete(`/api/todos/${todo.id}`).pipe(
      take(1),
      tap(() => this._todos = this._todos.filter(x => x.id !== todo.id)),
      tap(() => this.todosSubject.next(this._todos))
    ).subscribe()
  }

  /**
   * Handles re-assigning the user and updating the collection of todos
   * then sending out the update
   */
  private sendUpdateOrCreate(httpRequest: Observable<Todo>, oldItem?: Todo) {
    return httpRequest.pipe(
      take(1),
      switchMap(newTodo => this.userService.users.pipe(
        map(users => {
          const user = users.find(x => x.id === newTodo.userId)
          newTodo.user = user
          return newTodo
        }))),
      tap(newTodo => this._todos = [
        ...(oldItem == null ? this._todos : this._todos.filter(x => x.id !== oldItem.id)),
        newTodo
      ]),
      tap(() => this.todosSubject.next(this._todos))
    ).subscribe()
  }
}
