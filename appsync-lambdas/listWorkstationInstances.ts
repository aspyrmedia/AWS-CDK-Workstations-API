// lambda-fns/listEC2Instances.js
import * as AWS from "aws-sdk";
const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });
AWS.config.update({ region: "us-east-2" });

async function listWorkstationInstances() {
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
}

export default listWorkstationInstances;
