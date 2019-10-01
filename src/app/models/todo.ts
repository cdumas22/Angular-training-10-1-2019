import { User } from './user';

export interface Todo {
    id?: number
    dueDate: Date
    createDate?: Date
    title: string
    description?: string,
    userId: number
    user?: User
}
