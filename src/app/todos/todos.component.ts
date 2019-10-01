import { Component, OnInit } from '@angular/core';
import { GridOptions, CellEditingStoppedEvent, ValueGetterParams } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { TodoService } from '../todo.service';
import { Todo } from '../models/todo';
import { User } from '../models/user';

@Component({
  selector: 'app-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.scss']
})
export class TodosComponent {

  public todos: Observable<any> = this.todoService.todos
  public gridOptions: GridOptions = {
    columnDefs: [
      {
        field: 'id',
      },
      {
        field: 'title',
        editable: true
      },
      {
        field: 'dueDate',
        editable: true
      },
      {
        field: 'user',
        valueGetter: (params: ValueGetterParams) => {
          const user: User | undefined = params.data.user
          return user != null ? `${user.firstName} ${user.lastName}` : '---'
        }
      }
    ],
    onCellEditingStopped: (event: CellEditingStoppedEvent) => {
      this.todoService.update(event.data as Todo)
    }
  }

  constructor(private todoService: TodoService) { }

  public create() {
    this.todoService.create({
      title: 'tester',
      dueDate: new Date(),
      userId: 1
    })
  }
}
