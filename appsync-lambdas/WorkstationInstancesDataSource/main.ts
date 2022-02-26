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
    WorkstationInstanceId: string;
    WorkstationInstance: WorkstationInstance;
  };
};

exports.handler = async (event: AppSyncEvent) => {
  const listWorkstationInstances = async function () {
    console.log("ListWorkstationInstances Fired...");
    try {
      console.log("ListWorkstationInstances makes call...");
      const command = new DescribeInstancesCommand({
        DryRun: false,
      });
      const response = await client.send(command);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instances = response.Reservations;
      // "domain","service","operation","params","httpRequest","startTime","response","_asm","_haltHandlersOnError","_events","emit","__send","send","API_CALL_ATTEMPT","API_CALL_ATTEMPT_RETRY","API_CALL"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instanceKeys = JSON.stringify(instances);
      console.log(`Instances: ${instanceKeys}\nTypeOf: ${typeof instances}`);
      console.log("ListWorkstationInstances finishes call...");
      // console.log("Instances:\n" + JSON.stringify(instances));
      return {
        items: { id: "123456", name: "test", status: "online" },
        result: "almost2",
      };
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
      return await listWorkstationInstances();
    // case "deleteNote":
    //   return await deleteNote(event.arguments.noteId);
    // case "updateNote":
    //   return await updateNote(event.arguments.note);
    default:
      return null;
  }
};
