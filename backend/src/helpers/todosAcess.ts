import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
//import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

//const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

const todosTable = process.env.TODOS_TABLE

export class TodoAccess{
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE){}

    async createTodoItem(item: TodoItem): Promise<TodoItem>{
        await this.docClient.put({
            TableName: this.todosTable,
            Item: item
        })
        return item
    }

    async updateTodoItem (item: TodoUpdate, todoId, userId:string): Promise<TodoItem>{
        console.log(userId)
        await this.docClient.update({
            TableName: todosTable,
            Key: {
                todoId: todoId
            },
            UpdateExpression: "set name = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues:{
                ":name" : item.name,
                ":done" : item.done,
                ":dueDate": item.dueDate
            },
            ReturnValues: "UPDATED_NEW"
        }).promise()

        return item as TodoItem
    }

    async getTodosForUser(userId:string): Promise<TodoItem[]>{
        const result = await this.docClient.query({
            TableName: todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues:{
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        return result.Items as TodoItem[]
    }

    async deleteTodoItem(todoId: string, userId:string): Promise<Object>{
        console.log(userId)
        var deleteSucceeded = true
        var errData 
        this.docClient.delete({
            TableName: todosTable,
            Key:{
                todoId: todoId
            }
        }).on('error', (data) => { deleteSucceeded = false; errData = data })
        return {deleteSucceeded: deleteSucceeded, errData: errData}
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
  