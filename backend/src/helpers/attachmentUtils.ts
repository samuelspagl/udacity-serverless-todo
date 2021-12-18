import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })


const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION


export function AttachmentUtils(todoId:string){
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: todoId,
        Expires: urlExpiration
      })
}

export async function getAttachmentUrl(attachmentId: string): Promise<string> {
  const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${attachmentId}`
  return attachmentUrl
}