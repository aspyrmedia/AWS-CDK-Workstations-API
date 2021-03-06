// import * as AWS from "aws-sdk";
import WorkstationInstance from "./WorkstationInstance";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWSXRay = require("aws-xray-sdk-core");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AWS = AWSXRay.captureAWS(require("aws-sdk"));
const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });
AWS.config.update({ region: "us-east-2" });
// eslint-disable-next-line @typescript-eslint/no-empty-function
AWSXRay.setContextMissingStrategy(() => {});

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
    const params = {
      DryRun: false,
    };
    try {
      const instances = await ec2.describeInstances(params, (err, data) => {
        console.log(
          "Instances Inside Callback:\n" +
            "Data: \n" +
            JSON.stringify(typeof data) +
            "Err:\n" +
            JSON.stringify(typeof err) +
            "\n"
        );
        return JSON.stringify({ result: "almost" });
      });
      // console.log("Instances:\n" + JSON.stringify(instances));
      return JSON.stringify({ result: "almost2" });
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
