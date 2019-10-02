import { Component, OnDestroy } from '@angular/core';
import { Todo } from './models/todo';
import { Subject, Observable } from 'rxjs';
import { GridOptions, ValueGetterParams, CellEditingStartedEvent, CellValueChangedEvent, CellClickedEvent } from 'ag-grid-community';
import { filter, takeUntil, map, tap } from 'rxjs/operators';
import { User } from './models/user';
import { TodoService } from './todo.service';

@Component({
  selector: 'app-root',
  styles: ['ag-grid-angular { height: 500px; }'],
  template: `<h1 style="text-align:center">Welcome to {{ title }}!</h1>
    <button type="button" (click)="create()">Create New Todo</button>
    <h3 *ngIf="editingTodoHasChanges">Editing Todo Has Changes</h3>
    <ag-grid-angular class="ag-theme-balham"
                    [gridOptions]="gridOptions"
                    [rowData]="todos | async"></ag-grid-angular>`
})
export class AppComponent implements OnDestroy {
  public title = 'RXjs Railways';
  public editingTodoHasChanges = false
  private editingTodo?: Todo
  private todoUpdated = false
  private destroySubject = new Subject<void>()

  public todos: Observable<Todo[]> = this.todoService.todos.pipe(
    // if we are editing a todo then pause updates to the todos.
    // this allows the list not to change while editing
    filter(() => this.editingTodo == null)
  )

  public gridOptions: GridOptions = {
    columnDefs: [
      {
        valueGetter: () => 'DELETE',
        width: 70,
        cellClass: 'delete-link',
        onCellClicked: ({ data }: CellClickedEvent) => {
          this.todoService.delete(data as Todo)
        }
      },
      { field: 'id', sort: 'asc', },
      { field: 'title', editable: true },
      { field: 'updateDate' },
      {
        field: 'user',
        valueGetter: ({ data }: ValueGetterParams) => {
          const user: User | undefined = (data as Todo).user
          return user != null ? `${user.firstName} ${user.lastName}` : '---'
        }
      }
    ],
    onCellEditingStarted: ({ data }: CellEditingStartedEvent) => {
      this.editingTodo = data
    },
    onCellValueChanged: ({ data }: CellValueChangedEvent) => {
      // create state for knowing if we have updated a todo.
      // this is important to know if the cell stopped editing needs
      // to update the collection or not
      this.todoUpdated = true
      this.todoService.update(data as Todo)
    },
    onCellEditingStopped: () => {
      this.editingTodo = undefined
      // if a todo was not updated then we want to force the collection
      // to update. This will handle cases where we were editing
      // when a timed update came throught.
      if (!this.todoUpdated) {
        this.todoService.forceSendUpdates()
      }
      this.todoUpdated = false
    }
  }

  constructor(private todoService: TodoService) {
    // We want to know if the currently editing todo received changes
    // from the server.
    todoService.todos.pipe(
      // clean up subscription on destroy
      takeUntil(this.destroySubject),
      map(todos => this.editingTodo == null ? null : todos.find(x =>
        // if one of the todos is being edited then find it
        x.id === this.editingTodo.id &&
        // only return it if the update dates differ (it has been updated on the server)
        x.updateDate !== this.editingTodo.updateDate)
      ),
      tap(todo => {
        // if there is a todo here that means
        // that the todo being edited has changed on the server
        this.editingTodoHasChanges = todo != null
      })
    ).subscribe()
  }

  public create() {
    this.todoService.create({
      title: 'tester',
      dueDate: (new Date()).toISOString(),
      userId: 1
    })
  }

  public ngOnDestroy() {
    this.destroySubject.next()
    this.destroySubject.complete()
  }
}
