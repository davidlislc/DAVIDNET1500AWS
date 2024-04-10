import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sqsClient = new SQSClient({ region: "us-east-2" });
const ses = new SESClient({ region: "us-east-2" });

export const handler = async (event) => {
  try {
    const queueUrl = "https://sqs.us-east-2.amazonaws.com/873996336316/david-net1500-bigmover";

    const params = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10, // Maximum number of messages to retrieve
      WaitTimeSeconds: 10, // Wait time for long polling (optional)
    };

    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    const messages = data.Messages || [];

    if (messages.length === 0) {
      console.log("No messages found in the queue.");
      return;
    }

    const stocks = messages[0].Body || []

    console.log("Received message:" + stocks);
    console.log("Received message handle :" + messages[0].ReceiptHandle)

    const stockArray = JSON.parse(stocks)
    let emailbody=""
    for (let i = 0; i < stockArray.length; i++) {
      emailbody += JSON.stringify(stockArray[i].ticker) + ": "+
                   JSON.stringify(stockArray[i].priceChange) +
                    "\n" 
    }
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: ["dli@indianatech.edu"],
      },
      Message: {
        Body: {
          Text: { Data: emailbody },
        },

        Subject: { Data: "Top movers today" },
      },
      Source: "dli@indianatech.edu",
    });
    let response = await ses.send(command);
    console.log(response);

    const deleteParams = {
      QueueUrl: "https://sqs.us-east-2.amazonaws.com/873996336316/david-net1500-bigmover",
      ReceiptHandle: messages[0].ReceiptHandle,
    };
    const deleteResults = await sqsClient.send(new DeleteMessageCommand(deleteParams));
    console.log(deleteResults);
    console.log("Message retrieval done");
    return {
      statusCode: 200,
      body: "Messages received successfully!",
    };
  }
  catch (error) {
    console.error("Error receiving messages:", error);
    return {
      statusCode: 500,
      body: "Error receiving messages from SQS.",
    };
  }
};
