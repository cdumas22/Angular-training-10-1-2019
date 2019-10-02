import { InMemoryDbService, ResponseOptions, RequestInfo } from 'angular-in-memory-web-api';
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
    const todos: Todo[] = [
      { id: 1, title: 'Buy Groceries', dueDate: (new Date()).toISOString(), updateDate: (new Date()).toISOString(), userId: users[0].id },
      { id: 2, title: 'Exchange Present', dueDate: (new Date()).toISOString(), updateDate: (new Date()).toISOString(), userId: users[1].id },
      { id: 3, title: 'Go Running', dueDate: (new Date()).toISOString(), updateDate: (new Date()).toISOString(), userId: users[0].id },
    ];

    return { todos, users };
  }

  public responseInterceptor(responseOptions: ResponseOptions, requestInfo: RequestInfo) {
    if (requestInfo.collectionName === 'todos') {
      if (requestInfo.method === 'put' || requestInfo.method === 'post') {
        // whenever an item is updated or added set the updateDate on the item
        (responseOptions.body as Todo).updateDate = (new Date()).toISOString()
      } else if (requestInfo.method === 'get') {
        // to mock having the serve updating an item we will pick the first item
        // and update it every time items are requested
        responseOptions.body[0].updateDate = (new Date()).toISOString()
      }
    }

    return responseOptions
  }
}
