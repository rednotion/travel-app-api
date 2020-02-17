import uuid from "uuid";
import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";

export async function create(event, context) {
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.colsTableName,
    Item: {
      tripId: data.tripId,
      userId: event.requestContext.identity.cognitoIdentityId,
      colId: uuid.v1(),
      // Let us not differentiate between WISHLIST and COLUMN now
      // when we create the days, we can return the UUID of each column iteratively
      // and then add it to the 'create-trip' API body
      colType: data.colType,
      colName: data.colName,
      colStartTime: data.colStartTime,
      colEndTime: data.colEndTime,
      taskIds: data.taskIds,
      colNotes: data.colNotes,
      colLodging: data.colLodging,
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) {
    return failure({ status: false, error: e  });
  }
}

export async function update(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.colsTableName,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'noteId': path parameter
    Key: {
      tripId: event.pathParameters.tripId,
      colId: event.pathParameters.colId
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: "SET colName = :colName, colType = :colType, taskIds = :taskIds, colStartTime = :colStartTime, colEndTime = :colEndTime, colNotes = :colNotes, colLodging = :colLodging",
    ExpressionAttributeValues: {
      ":colName": data.colName || null,
      ":colType": data.colType || null,
      ":taskIds": data.taskIds || null,
      ":colStartTime": data.colStartTime || null,
      ":colEndTime": data.colEndTime || null,
      ":colNotes": data.colNotes || null,
      ":colLodging": data.colLodging || null,
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
    return failure({ status: false, error: e });
  }
}

export async function append_task(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.colsTableName,
    Key: {
      tripId: event.pathParameters.tripId,
      colId: event.pathParameters.colId
      },
    UpdateExpression: "SET taskIds = list_append(if_not_exists(taskIds, :empty_list), :taskId)",
    ExpressionAttributeValues: {
      ':taskId': [data.taskId],
      ':empty_list': []
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    await dynamoDbLib.call("update", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e });
  }
}


export async function get(event, context) {
  const params = {
    TableName: process.env.colsTableName,
    Key: {
      tripId: event.pathParameters.tripId,
      colId: event.pathParameters.colId
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
    return failure({ status: false, error: e  });
  }
}

export async function getall(event, context) {
    const params = {
        TableName: process.env.colsTableName,
        KeyConditionExpression: "tripId = :tripId",
        ExpressionAttributeValues: {
            ":tripId": event.pathParameters.tripId,
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
        return failure({ status: false, error: e  });
    }
}


export async function delete_function(event, context) {
  const params = {
    TableName: process.env.colsTableName,
    Key: {
      tripId: event.pathParameters.tripId,
      colId: event.pathParameters.colId
    }
  };

  try {
    await dynamoDbLib.call("delete", params);
    return success({ status: true });
  } catch (e) {
    return failure({ status: false, error: e  });
  }
}