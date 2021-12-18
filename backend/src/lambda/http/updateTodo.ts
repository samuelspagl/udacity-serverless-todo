import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'


import { createLogger } from '../../utils/logger'
const logger = createLogger('updateTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)
    logger.info(`Update Todo Item ${todoId} of User ${userId} with the Body:\n ${updatedTodo}`)
    // DONE: Update a TODO item with the provided id using values in the "updatedTodo" object
    const newTodo = await updateTodo(updatedTodo, todoId, userId)
    return {
      statusCode: 200,
      body: JSON.stringify({updatedContent: newTodo})
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
