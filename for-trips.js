import uuid from "uuid";
import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/, error: eresponse-lib";

export async function create(event, context) {
  // We are also using the async/await pattern here to refactor our Lambda function.
  // This allows us to return once we are done processing; instead of using the callback function.
  // Request body is passed in as a JSON encoded string in 'event.body'
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.tripsTableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      tripId: uuid.v1(),
      tripName: data.tripName,
      tripStartDate: data.tripStartDate,
      tripStartTime: data.tripStartTime,
      tripEndDate: data.tripEndDate,
      tripEndTime: data.tripEndTime,
      tripLocation: data.tripLocation,
      tripNotes: data.tripNotes,
      colIds: data.colIds,
      wishlistIds: data.wishlistIds,
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false, error: e });
  }
}

export async function update(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.tripsTableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      tripId: event.pathParameters.tripId
    },
    UpdateExpression: "SET tripName = :tripName, tripStartDate = :tripStartDate, tripEndDate = :tripEndDate, tripStartTime = :tripStartTime, tripEndTime = :tripEndTime, tripLocation = :tripLocation, tripNotes = :tripNotes, colIds = :colIds, wishlistIds = :wishlistIds",
    ExpressionAttributeValues: {
      ":tripName": data.tripName || null,
      ":tripStartDate": data.tripStartDate || null,
      ":tripStartTime": data.tripStartTime || null,
      ":tripEndDate": data.tripEndDate || null,
      ":tripEndTime": data.tripEndTime || null,
      ":tripLocation": data.tripLocation || null,
      ":tripNotes": data.tripNotes || null,
      ":colIds": data.colIds || null,
      ":wishlistIds": data.wishlistIds || null
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLib.call("update", params);
    return success({ status: true});
  } catch (e) {
    return failure({ status: false, error: e });
  }
}

export async function get(event, context) {
  const params = {
    TableName: process.env.tripsTableName,
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
    return failure({ status: false, error: e });
  }
}

export async function getall(event, context) {
    const params = {
        TableName: process.env.tripsTableName,
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
        return failure({ status: false, error: e });
    }
}


export async function delete_function(event, context) {
  const params = {
    TableName: process.env.tripsTableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      tripId: event.pathParameters.tripId
    }
  };

  try {
    await dynamoDbLib.call("delete", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}