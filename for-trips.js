import uuid from "uuid";
import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function create(event, context) {
  // We are also using the async/await pattern here to refactor our Lambda function.
  // This allows us to return once we are done processing; instead of using the callback function.
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.tripsTableName,
    // 'Item' contains the attributes of the item to be created
    // - 'userId': user identities are federated through the
    //             Cognito Identity Pool, we will use the identity id
    //             as the user id of the authenticated user
    // - 'noteId': a unique uuid
    // - 'content': parsed from request body
    // - 'attachment': parsed from request body
    // - 'createdAt': current Unix timestamp
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      tripId: uuid.v1(),
      name: data.name,
      startDate: data.startDate,
      startTime: data.startTime,
      endDate: data.endDate,
      endTime: data.endTime,
      location: data.location,
      notes: data.notes,
      colIds: data.colIds,
      wishlistIds: data.wishlistIds,
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false });
  }
}

export async function update(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.tripsTableName,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'noteId': path parameter
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      tripId: event.pathParameters.tripId
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: "SET #name = :name", //, startDate = :startDate, endDate = :endDate, startTime = :startTime, endTime = :endTime, location = :location, notes = :notes, colIds = :colIds, wishlistIds = :wishlistIds",
    ExpressionAttributeNames: {
      "#name": "name",
    },
    ExpressionAttributeValues: {
      ":name": {"S": data.name || null},
      // ":startDate": data.startDate || null,
      // ":startTime": data.startTime || null,
      // ":endDate": data.endDate || null,
      // ":endTime": data.endTime || null,
      // ":location": data.location || null,
      // ":notes": data.notes || null,
      // ":colIds": data.colIds || null,
      // ":wishlistIds": data.wishlistIds || null
    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLib.call("updateItem", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false });
  }
}

export async function get(event, context) {
  const params = {
    TableName: process.env.tripsTableName,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'noteId': path parameter
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      tripId: event.pathParameters.tripId
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
    return failure({ status: false });
  }
}

export async function getall(event, context) {
    const params = {
        TableName: process.env.tripsTableName,
        // 'KeyConditionExpression' defines the condition for the query
        // - 'userId = :userId': only return items with matching 'userId'
        //   partition key
        // 'ExpressionAttributeValues' defines the value in the condition
        // - ':userId': defines 'userId' to be Identity Pool identity id
        //   of the authenticated user
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
            ":userId": event.requestContext.identity.cognitoIdentityId
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
        return failure({ status: false });
    }
}


export async function delete_function(event, context) {
  const params = {
    TableName: process.env.tripsTableName,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'noteId': path parameter
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      tripId: event.pathParameters.tripId
    }
  };

  try {
    await dynamoDbLib.call("delete", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false });
  }
}