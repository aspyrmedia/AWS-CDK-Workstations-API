// import * as AWS from "aws-sdk";
import WorkstationInstance from "./WorkstationInstance";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
// eslint-disable-next-line @typescript-eslint/no-empty-function
const client = new EC2Client({ region: "us-east-2" });

type AppSyncEvent = {
  info: {
    fieldName: string;
  };
  arguments: {
    limit: number;
    WorkstationInstanceId: string;
    WorkstationInstance: WorkstationInstance;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  const listWorkstationInstances = async function (event: AppSyncEvent) {
    try {
      console.log(`event ${JSON.stringify(event)}`)

      const command = new DescribeInstancesCommand({
        MaxResults: event.arguments.limit !== undefined ? event.arguments.limit : undefined,
      });
      const response = await client.send(command);
      const instances = {
        WorkstationInstances: response.Reservations?.map((reservation) => {
          if (reservation.Instances?.length === 1) {
            const nameTag = reservation.Instances[0].Tags?.filter(tag => tag.Key === "Name")[0]
            return {
              id: reservation.Instances[0].InstanceId,
              name: nameTag?.Value,
              status: reservation.Instances[0].State?.Name
            }
          } else return
        })
      };
      console.log(`Instances: ${JSON.stringify(instances)}`);
      return instances;
    } catch (err) {
      console.log("EC2 error: ", err);
      return null;
    }
  };
  console.log("event.info.fieldName: " + event.info.fieldName + "\n");
  switch (event.info.fieldName) {
    // case "getNoteById":
    //   return await getNoteById(event.arguments.noteId);
    // case "createNote":
    //   return await createNote(event.arguments.note);
    case "listWorkstationInstances":
      return await listWorkstationInstances(event);
    // case "deleteNote":
    //   return await deleteNote(event.arguments.noteId);
    // case "updateNote":
    //   return await updateNote(event.arguments.note);
    default:
      return null;
  }
};
