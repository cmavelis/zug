// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const ses = new SESClient({ region: 'us-west-2' });

module.exports.handler = async (event) => {
  let bodyText = 'BODY';
  if (event.queryStringParameters && event.queryStringParameters['message']) {
    bodyText = event.queryStringParameters['message'];
  }
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [process.env.SES_EMAIL_TO],
    },
    Message: {
      Body: {
        Text: { Data: bodyText },
      },

      Subject: { Data: 'Test Email' },
    },
    Source: process.env.SES_EMAIL_FROM,
  });

  try {
    let response = await ses.send(command);
    // process data.
    return response;
  } catch (error) {
    console.error(error);
  } finally {
    // finally.
  }
};
