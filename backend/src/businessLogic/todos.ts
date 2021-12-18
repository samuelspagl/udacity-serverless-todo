import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import * as uuid from 'uuid'
import {TodoAccess} from '../dataLayer/todosAccess'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { getAttachmentUrl } from '../helpers/attachmentUtils'


const todoAccess = new TodoAccess()
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export function createAttachmentPresignedUrl(todoId: string): string {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: todoId,
        Expires: urlExpiration
      })
}

export async function deleteTodo(todoId, userId):Promise<Object> {
  console.log(userId)
  return await todoAccess.deleteTodoItem(todoId)
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

export async function updateTodoAttUrl(todoId:string, userId, attId:string){
  const item = await todoAccess.getTodoById(todoId)
  if(!item){
    throw new Error("TodoId was not found in the system")
  }

  if(userId != item.userId){
    throw new Error("User is not the owner of the specified task.")
  }
  const attUrl = await getAttachmentUrl(attId)
  return await todoAccess.updateAttUrl(todoId, attUrl)
}