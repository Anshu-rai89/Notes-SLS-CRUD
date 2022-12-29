'use strict';
const uuid = require('uuid'),
  dynamoDB = require('aws-sdk/clients/dynamodb'),
  documentClient = new dynamoDB.DocumentClient({
    region:'us-east-2',
    maxRetries:3,
    httpOptions:{
      timeout:5000
    }
  }),
  uuidv4 = uuid.v4,
  NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;


const send = (statusCode,data) => {
  return {
    statusCode,
    body: JSON.stringify(data)
  }
}
module.exports.createNote = async (event,context,cb) => {
  try {
    context.callbackWaitForEmptyEventLoop = false;
    const id = uuidv4();
    const data = JSON.parse(event.body);
    data.id = id;

    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesID: id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesID)"
    }
    const note = await documentClient.put(params).promise();

    cb(null,send(201,data));

}catch(error) {
  console.log(error);
  cb(null,send(500, error.message))
}
};

module.exports.updateNote = async (event,context,cb) => {
  context.callbackWaitForEmptyEventLoop = false;
  try {
    const notesID = event.pathParameters.id,
      data = JSON.parse(event.body);

    const params = {
      TableName: NOTES_TABLE_NAME,
        Key: { notesID },
        UpdateExpression: "set #title = :title, #body = :body",
        ExpressionAttributeNames: {
          "#title": "title",
          "#body": "body",
        },
        ExpressionAttributeValues: {
          ":title": data.title,
          ":body": data.body,
        },
      ConditionExpression: "attribute_exists(notesID)",
    };

    await documentClient.update(params).promise();
    cb(null, send(200, data));
  } catch (err) {
    cb(null, send(500, err.message));
  }
};


module.exports.getNotes = async (event,context,cb) => {
  context.callbackWaitForEmptyEventLoop = false;
  try{
    const params = {
      TableName: NOTES_TABLE_NAME
    };

    const notes = await documentClient.scan(params).promise();
    cb(null, send(200,notes))
  }catch(err) {
    cb(null,send(500, err.message))
  }
};

module.exports.deleteNote = async (event,context,cb) => {
  try{
    context.callbackWaitForEmptyEventLoop = false;
    const notesID = event.pathParameters.id;
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesID },
      ConditionExpression: "attribute_exists(notesID)",
    };

    await documentClient.delete(params).promise();
    cb(null,send(200,notesId));
  }catch(err) {
    cb(null,send(500, err.message))
  }
};