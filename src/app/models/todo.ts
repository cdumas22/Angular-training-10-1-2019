import { User } from './user';

export interface Todo {
    // The server generates the id. So it is optional
    // for creating the todo
    id?: number
    // Update date is optional because the server will set it
    // and when creating it should not be set
    updateDate?: string
    title: string
    dueDate: string
    userId: number
    // user id is not Populated on the server.
    // we will use rxjs to merge the user onto
    // the todo based on the userId
    user?: User
}
