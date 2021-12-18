import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
// decode
import { decode, verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
//import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import axios from 'axios'
import { Jwt } from '../../auth/Jwt'

const logger = createLogger('auth')

let cachedCert

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-8ytgzzp9.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  logger.info(`Verifying ${token}`)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  if(!jwt){
    throw new Error('invalid token')
  }
  const cert = await getCert()
  logger.info(`Received cert:\n ${cert}`)
  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}


function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}



// async function getCert(){
//   const response = await axios({
//     method: 'get',
//     url: jwksUrl,
//     responseType: 'json'
//   })
//   return response.data.keys[0].x5c
// }

async function getCert(): Promise<string> {
  if (cachedCert) return cachedCert

  logger.info(`Fetching certificate from ${jwksUrl}`)

  const response = await axios.get(jwksUrl)
  const keys = response.data.keys
  logger.info(`Received response from Auth0`)
  if (!keys || !keys.length)
    throw new Error('No JWKS keys found')

  const signingKeys = keys.filter(
    key => key.use === 'sig'
           && key.kty === 'RSA'
           && key.alg === 'RS256'
           && key.n
           && key.e
           && key.kid
           && (key.x5c && key.x5c.length)
  )

  

  if (!signingKeys.length)
    throw new Error('No JWKS signing keys found')
  
  // XXX: Only handles single signing key
  const key = signingKeys[0]
  const pub = key.x5c[0]  // public key
  logger.info(`Got the public key:\n${pub}`)
  // Certificate found!
  cachedCert = certToPEM(pub)

  logger.info('Valid certificate found', cachedCert)

  return cachedCert
}

function certToPEM(cert:string){
  cert = cert.match(/.{1,64}/g).join('\n')
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  return cert
}

