// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
const ses = new SESClient({ region: 'us-west-2' });

export const handler = async (event) => {
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
    Source: process.env.SES_EMAIL_TO,
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
