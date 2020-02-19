import uuid from "uuid";
import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function create_location(event, context) {
  // We are also using the async/await pattern here to refactor our Lambda function.
  // This allows us to return once we are done processing; instead of using the callback function.
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.tasksTableName,
    Item: {
      tripId: data.tripId,
      taskId: "place_"+ uuid.v1(), // all created places will be NON-drives
      userId: event.requestContext.identity.cognitoIdentityId,
      taskType: "location",
      taskName: data.taskName,
      taskDuration: data.taskDuration,
      taskNotes: data.taskNotes,
      taskAttachment: data.taskAttachment,
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false , error : e});
  }
}


export async function create_drive(event, context) {
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.tasksTableName,
    Item: {
      tripId: data.tripId,
      taskId: "drive_"+ uuid.v1(), // all created places will be NON-drives
      userId: event.requestContext.identity.cognitoIdentityId,
      taskType: "drive",
      taskName: null,
      taskDuration: data.taskDuration,
      taskNotes: null,
      taskAttachment: null,
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false , error : e});
  }
}


export async function update(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.tasksTableName,
    Key: {
      tripId: event.pathParameters.tripId,
      taskId: event.pathParameters.taskId
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: "SET taskName = :taskName, taskType = :taskType, taskDuration = :taskDuration, taskNotes = :taskNotes, taskAttachment = :taskAttachment",
    ExpressionAttributeValues: {
      ":taskName": data.taskName,
      ":taskType": data.taskType,
      ":taskDuration": data.taskDuration,
      ":taskNotes": data.taskNotes,
      ":taskAttachment": data.taskAttachment,
    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLib.call("update", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false , error : e });
  }
}

export async function get(event, context) {
  const params = {
    TableName: process.env.tasksTableName,
    Key: {
      tripId: event.pathParameters.tripId,
      taskId: event.pathParameters.taskId
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);
    if (result.Item) {
      // Return the retrieved item
      return success(result.Item);
    } else {
      return failure({ status: false, error: "Item not found." });
    }
  } catch (e) {
    return failure({ status: false  , error : e});
  }
}

export async function getall(event, context) {
    const params = {
        TableName: process.env.tasksTableName,
        KeyConditionExpression: "tripId = :tripId",
        ExpressionAttributeValues: {
            ":tripId": event.pathParameters.tripId
        }
    };

    try {
        const result = await dynamoDbLib.call("query", params);
        if (result.Items) {
            return success(result.Items);
        } else {
            return failure({ status: false, error: "User not found." });
        }
    } catch (e) {
        return failure({ status: false , error : e});
    }
}


export async function delete_function(event, context) {
  const params = {
    TableName: process.env.tasksTableName,
    Key: {
      tripId: event.pathParameters.tripId,
      taskId: event.pathParameters.taskId
    }
  };

  try {
    await dynamoDbLib.call("delete", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error : e });
  }
}