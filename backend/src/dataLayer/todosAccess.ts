import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)
const todosTable = process.env.TODOS_TABLE

import { TodoItem } from '../models/TodoItem'


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

    async GetAllTodosPerUser(userId:string){
        const result = await this.docClient.query({
            TableName: todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues:{
                ':userId': userId
            },
            ScanIndexForward: false
        }).promise()

        return result.Items
    }

    async deleteTodoItem(todoId: String): Promise<Object>{
        var deleteSucceeded = true
        var errData 
        const result = this.docClient.delete({
            TableName: todosTable,
            Key:{
                todoId: todoId
            }
        }).on('error', function (error, data) { deleteSucceeded = false; errData = data })
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
  