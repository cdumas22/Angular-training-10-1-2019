import { Component, OnInit } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { TodoService } from '../todo.service';

@Component({
  selector: 'app-todos',
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.scss']
})
export class TodosComponent implements OnInit {

  public todos: Observable<any> = this.todoService.todos
  public gridOptions: GridOptions = {}

  constructor(private todoService: TodoService) { }

  ngOnInit() {
  }

}
