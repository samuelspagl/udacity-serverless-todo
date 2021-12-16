import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // DONE: Remove a TODO item by id
    const userId = getUserId(event)

    const response = await deleteTodo(todoId, userId)
    if (!response['deleteSucceeded']){
      return{
        statusCode: 400,
        body: JSON.stringify({Error: response['errData']})
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify("Deleted Item ")
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )



  //Check if the Todo is part of the user
