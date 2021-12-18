import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('todoAccess')


export class TodoAccess{
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosByUserIndex = process.env.TODOS_BY_USER_INDEX){}

    async createTodoItem(item: TodoItem): Promise<TodoItem>{
        logger.info(`Sending new TodoItem to Database`, item)
        await this.docClient.put({
            TableName: this.todosTable,
            Item: item
        }).promise()
        return item
    }

    async updateTodoItem (item: TodoUpdate, todoId, userId:string): Promise<TodoItem>{
        logger.info(`TodoAcess: Starting updating TodoId: ${todoId} of UserId ${userId}`)
        try{
            await this.docClient.update({
                TableName: this.todosTable,
                Key: {
                    todoId: todoId
                },
                UpdateExpression: "set #name = :name, dueDate = :dueDate, done = :done",
                ExpressionAttributeNames: {
                    "#name": "name"
                  },
                ExpressionAttributeValues:{
                    ":name" : item.name,
                    ":done" : item.done,
                    ":dueDate": item.dueDate
                },
                ReturnValues: "UPDATED_NEW"
            }).promise()
            logger.info("Updating successfull")
            return item as TodoItem
        }catch(err) {
            logger.error(`Error updating: ${err}`)
        }
        
    }

    async getTodosForUser(userId:string): Promise<TodoItem[]>{
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosByUserIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues:{
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        return result.Items as TodoItem[]
    }

    async getTodoById(todoId: string): Promise<TodoItem>{
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': todoId
            }
        }).promise()
        return result.Items[0] as TodoItem
    }

    async deleteTodoItem(todoId: string): Promise<Object>{
        logger.info(`Trying to delete the item`)
        var deleteSucceeded = true
        try{
            await this.docClient.delete({
                TableName: this.todosTable,
                Key:{
                    todoId: todoId
                }
            }).promise()
            return {deleteSucceeded}
        }catch(e){
            return {deleteSucceeded: deleteSucceeded, errData: e}
        }
    }

    async updateAttUrl(todoId: string, attUrl: string){
        logger.info(`Updating the TodoId ${todoId} with the url ${attUrl}`)

        try{
            await this.docClient.update({
                TableName: this.todosTable,
                Key: {
                    todoId
                },
                UpdateExpression: "set attachmentUrl = :attachmentUrl",
                ExpressionAttributeValues:{
                    ':attachmentUrl' : attUrl
                }
            }).promise()
        }catch(e){
            logger.error('An Error occurred while updating Todo ID with new URL', e)
        }
    }
}


function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }
  