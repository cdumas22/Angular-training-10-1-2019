import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Todo } from '../models/todo';
import { User } from '../models/user';

export class InMemoryService implements InMemoryDbService {
  public createDb() {
    const users: User[] = [
      { id: 1, firstName: 'Cameron', lastName: 'D' },
      { id: 2, firstName: 'Nic', lastName: 'C' },
      { id: 3, firstName: 'Wes', lastName: 'C' },
      { id: 4, firstName: 'Zach', lastName: 'W' }
    ]
    const todos: Todo[]  = [
      { id: 1, title: 'Buy Groceries', dueDate: new Date(), createDate: new Date(), userId: users[0].id },
      { id: 2, title: 'Exchange Present', dueDate: new Date(), createDate: new Date(),  userId: users[1].id },
      { id: 3, title: 'Go Running', dueDate: new Date(), createDate: new Date(),  userId: users[0].id },
    ];

    return {todos, users};
  }
}