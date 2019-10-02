# RxJS Railways

Reactive programming is a way of looking at data as streams. With this any changes to the data should be a change to the stream. 

You can merge different streams of data to create compilations and complex data streams. 

Subscribers will get all changes as a flow of data from the stream. This makes it easy to propegate changes out to others.

In this training we will look at a simple Todo list. This list of todos will have users associated with it and will handle updating, creating, and deleting.

To get started `npm install && npm start`

## Goals of training
1. GET todos and users
2. Merge a user into an todos that have a userId
3. POST(add)/PUT(update)/DELETE a todo and merge it into the full list of todos
4. Use an interval to periodically check for changes on both users and todos.
5. Handle concurrency issues with editing a Todo when new todos get sent from the interval.
6. Handle knowing when a todo that is being edited has changed on the server

### Project layout
There are three files we will be working with [app.component.ts](src/app/app.component.ts), [user.service.ts](src/app/user.service.ts), and [todo.service.ts](src/app/todo.service.ts). 

The api and backend have been mocked by the [in-memory-db-service.ts](src/app/mocks/in-memory-db-service.ts). You shouldn't have to deal with this but know that because of it you will not see network requests happen with the http calls.

### 1. Get Todos and Users

Retrieving data from and http endpoint is easy in angular, Inject the HttpClient into the service then use it. 

```typescript
// user.service.ts
...
public users = this.http.get<User[]>(`/api/users`)
...
```

```typescript
// todo.service.ts
...
public todos = this.http.get<Todo[]>(`/api/todos`)
...
```

```typescript
// app.component.ts
public todos = this.todoService.todos
```
```html
<!-- app.component.ts template -->
<!-- using the async pipe to make the subscription to the todos -->
<ag-grid-angular class="ag-theme-balham"
                    [gridOptions]="gridOptions"
                    [rowData]="todos | async"></ag-grid-angular>
```

This simple call will get the users from the endpoint. The downside is that every time someone subscribes to it the http request will trigger. It is best to cache the results. You do this by using the RxJS `shareReplay` operator.

```typescript
// user.service.ts
...
public users = this.http.get<User[]>(`/api/users`).pipe(
    // 1 specifies that you only want to replay the last (1) results from this observable
    shareReplay(1)
)
```
```typescript
// todo.service.ts
...
public todos = this.http.get<Todo[]>(`/api/todos`).pipe(
    shareReplay(1)
)
```

Doing this caches the results of the http call for other subscribers to use. It is also long lived. So even when all subscribers have unsubscribed this cache value still exists. Then when another subscribe happens the cached value is returned. This is a very handy operator for stateful entity services like users and todos.

### 2. Merge a user into an todos that have a userId

For perfomance and reasons and seperation of concerns we do not want the todos endpoint to be return any user objects. The todo does have a userId though. We can use this to set the user on the todo in the `todo.service.ts`

```typescript
// todo.service.ts
...
public todos = combineLatest(
    this.http.get<Todo[]>(`/api/todos`)
    this.userService.users,
).pipe(
    map(([todos, users]) => {
        return todos.map(todo =>  ({
            ...todo,
            user: users.find(user => user.id === todo.userId)
        }))
    }),
    shareReplay(1)
)
```

The `combineLatest` RxJS function will take the latest event from each of the observables and send them along. This allows you to merge together the responses from both todos and users.

Map to the list of todos that has the user property set.

The benifit of doing this is that when the list of users updates it will automatically remap the users to the todo and send out a new event on the todos stream.

### 3. POST(add)/PUT(update)/DELETE a todo and merge it into the full list of todos

The `todo.service.ts` is an angular service that contains the state of the todos. This should be the place where any updates to a todo happens. So to handle adding, updating and deleting we need to inject something into the `todos` stream to let the steam know of these updates. We will use a `Subject` to be this trigger that lets the stream know about changes.

```typescript
// todo.service.ts
...
// the current state of the todos
private _todos: Todo[] = []
// trigger to let user know of local changes to the todos
private todosSubject = new Subject<Todo[]>()
public todos = merge(
    this.todosSubject,
    combineLatest(
        this.http.get<Todo[]>(`/api/todos`)
        this.userService.users,
    ).pipe(
        map(([todos, users]) => {
            return todos.map(todo =>  ({
                ...todo,
                user: users.find(user => user.id === todo.userId)
            }))
        }),
        // Save the current state to _todos.
        // This makes it possible for the  todoSubject to send out updates
        tap(todos => this._todos = todos)
    )
).pipe(
    // make sure the shareReplay is always on the final result
    shareReplay(1)
)
...
```

Now implement the create, update, and delete to send out the values then update our internal `_todos` state then send those out in the `todosSubject`.

```typescript
...
// it is important to have your endpoints return the newly created or updated item. This makes it easy to keep your app up to date without making expensive calls to get all the todos again.

public create(todo: Todo) {
    return combineLatest(
        this.http.post<Todo>(`/api/todos`, todo),
        this.userService.users
    ).pipe(
        take(1),
        // Handle merging the user into the todo
        map(([newTodo, users]) => ({
            ...newTodo,
            user: users.find(x => x.id === newTodo.userId)
        })),
        // update our local start of _todos with the new todo
        tap(newTodo => this._todos = [
            ...this._todos, 
            newTodo
        ]),
        // send out the local state on the todosSubject
        tap(() => this.todosSubject.next(this._todos))
    ).subscribe()
}

public update(todo: Todo) {
    return combineLatest(
        this.http.put<Todo>(`/api/todos`, todo),
        this.userService.users
    ).pipe(
        take(1),
        // Handle merging the user into the todo
        map(([updatedTodo, users]) => ({
            ...updatedTodo,
            user: users.find(x => x.id === newTodo.userId)
        })),
        // update our local start of _todos with the updated todo
        tap(updatedTodo => this._todos = [
            ...this._todos.filter(x => x.id !== updatedTodo.id), 
            updatedTodo
        ]),
        // send out the local state on the todosSubject
        tap(() => this.todosSubject.next(this._todos))
    ).subscribe()
}

public delete(todo: Todo) {
    return this.http.delete(`/api/todos/${todo.id}`).pipe(
        take(1),
        // remove the todo from the local state
        tap(() => this._todos = this._todos.filter(x => x.id !== todo.id)),
        // send out the local state on the todosSubject
        tap(() => this.todosSubject.next(this._todos))
    ).subscribe()
}
...
```

### 4. Use an interval to periodically check for changes on both users and todos.

In many applications there are multiple users working on the same data at the same time. We want to keep everyone in sync. There are a few ways of doing this. One of the better ways is using web-sockets to immediently send changes to all users looking at the dataset. For this example though we will use the interval approach. We will re-query for the entire list of todos on an interval. Allowing us to see changes that have not been made by the current user.

```typescript
//todo.service.ts
...
public todos = merge(
    this.todosSubject,
    // the interval will be a trigger that causes the http request
    // to happen again. 
    interval(5000).pipe(
        // make sure to always start the interval with a value.
        // this allows us to immediatly get the todos on the first
        // subscription.
        startWith(0),
        // switch from the interval to the combineLatest we had 
        // before. this will be what we send out to the final stream
        switchMap(() => {
            return combineLatest(
                this.http.get<Todo[]>(`/api/todos`)
                this.userService.users,
            ).pipe(
                map(([todos, users]) => {
                    return todos.map(todo =>  ({
                        ...todo,
                        user: users.find(user => user.id === todo.userId)
                    }))
                }),
                tap(todos => this._todos = todos)
            )
        })
    )
).pipe(
    shareReplay(1)
)
...
```

```typescript
//user.service.ts
...
public users = interval(12000).pipe(
    startWith(0),
    switchMap(() => this.http.get<User[]>(`/api/users`)),
    shareReplay(1)
)
...
```

### 5. Handle concurrency issues with editing a Todo when new todos get sent from the interval.

This setup is great. We have todos and user merging together, we are getting updates immediately when we update, create, or delete, and we are receiving updates on an interval from the server to keep our list up to date with other users.

Now there is an issue when editing a todo we do not want it to update while we are editing it. So we dont want to update the list whenever we are updating one of the items. 

To do this we will keep track of which todo we are currently editing and pause receiving events from our todos stream while we have and editing todo.

```typescript
// app.component.ts
...
private editingTodo?: Todo
public todos = this.todoService.todos.pipe(
    // filter allows us to stop listening to the stream whenever the value is false
    filter(() => this.editingTodo == null)
)
...

public gridOptions: GridOptions = {
    ...
    // we are using ag-grid to update the todo
    // ag-grid provides two methods to know when we start and stop editing.
    onCellEditingStarted: ({data}: CellEditingStartedEvent) => {
        this.editingTodo = data
    },
    onCellEditingStopped: () => {
        this.editingTodo = undefined
    }
}
```

### 6. Handle knowing when a todo that is being edited has changed on the server

It would be nice to know if the item that we are editing has changed on the server. We have already stopped listening to changes while we are editing but we could create another fork of our stream to watch for the currently editing item having changed.

```typescript
// app.component.ts
...
public editingTodoHasChanges = false
private editingTodo?: Todo
// because we are subscribing to a stream ourselves we need
// to make sure we unsubscribe from it when the component 
// gets destroyed. using a destroy subject is a clean way of 
// doing this.
private destroySubject = new Subject<void>()
...
constructor(private todoService: TodoService) {
    todoService.todos.pipe(
        // takeUntil will unsubscribe when the destroySubject gets next called
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

public ngOnDestroy() {
    // when the component gets destroyed we want to next and complete
    // the destroy subject to cleanup any subscriptions in the component
    this.destroySubject.next()
    this.destroySubject.complete()
}
...
```

Now you can give a prompt to the user that the item they are currently editing has been updated on the server.

```html
<!-- app.component.ts template -->
<h3 *ngIf="editingTodoHasChanges">Editing Todo Has Changes</h3>
```

## Conclusion

Using RxJS streams create reliable efficient dataflows in an application. 

As you get use to thinking of data as a stream you can clean up interactions and provide a more robust application where data seems to just magically stay updated without having to create any state in the components. 