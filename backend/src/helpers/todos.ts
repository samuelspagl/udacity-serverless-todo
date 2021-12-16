import { TodoAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
//import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import * as createError from 'http-errors'

// TODO: Implement businessLogic

const todoAccess = new TodoAccess()

export function createAttachmentPresignedUrl(todoId: string): string {
    return AttachmentUtils(todoId)
}

export async function deleteTodo(todoId, userId):Promise<Object> {
  return await todoAccess.deleteTodoItem(todoId, userId)
}

export async function createTodo(createTodoRequest:CreateTodoRequest, userId): Promise<TodoItem> {
  
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  return await todoAccess.createTodoItem({
    todoId: todoId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    createdAt: createdAt,
    done: false
  })
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  return todoAccess.getTodosForUser(userId)
}


export async function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId:string): Promise<TodoItem>{
  return await todoAccess.updateTodoItem(updateTodoRequest, todoId, userId)
}