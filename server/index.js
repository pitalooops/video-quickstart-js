'use strict';

/**
 * Load Twilio configuration from .env config file - the following environment
 * variables should be set:
 * process.env.TWILIO_ACCOUNT_SID
 * process.env.TWILIO_API_KEY
 * process.env.TWILIO_API_SECRET
 */
require('dotenv').load();

var http = require('http');
var path = require('path');
var axios = require('axios');
var AccessToken = require('twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;
var ChatGrant = AccessToken.ChatGrant;
var express = require('express');
var randomName = require('./randomname');

// Create Express webapp.
var app = express();

// Set up the paths for the examples.
[
  'bandwidthconstraints',
  'codecpreferences',
  'localvideofilter',
  'localvideosnapshot',
  'mediadevices'
].forEach(function(example) {
  var examplePath = path.join(__dirname, `../examples/${example}/public`);
  app.use(`/${example}`, express.static(examplePath));
});

// Set up the path for the quickstart.
var quickstartPath = path.join(__dirname, '../quickstart/public');
app.use('/quickstart', express.static(quickstartPath));

// Set up the path for the examples page.
var examplesPath = path.join(__dirname, '../examples');
app.use('/examples', express.static(examplesPath));

/**
 * Default to the Quick Start application.
 */
app.get('/', function(request, response) {
  response.redirect('/quickstart');
});

/**
 * Generate an Access Token for a chat application user - it generates a random
 * username for the client requesting a token, and takes a device ID as a query
 * parameter.
 */
app.get('/token', function(request, response) {
  var identity = randomName(); // video
  var endpointId = request.query.endpointId;
  var isChat = request.query.isChat;
  if (isChat) {
     identity = request.query.identity; // chat
  }

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created.
  var token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  );

  // Assign the generated identity to the token.
  token.identity = identity;

  // Grant the access token Twilio Video capabilities.
  var grant = new VideoGrant();
  token.addGrant(grant);

  var chatGrant = new ChatGrant({
        serviceSid: process.env.TWILIO_IPM_SERVICE_SID,
        endpointId: endpointId
    });
  token.addGrant(chatGrant);

  // Serialize the token to a JWT string and include it in a JSON response.
  response.send({
    identity: identity,
    token: token.toJwt()
  });
});

app.get('/rooms', function(request, response) {
    axios.get('https://video.twilio.com/v1/Rooms', {
        auth: {
            username: process.env.TWILIO_API_KEY,
            password: process.env.TWILIO_API_SECRET
        }
    }).then(res => {
        response.send(res.data);
    });
})

// Create http server and run it.
var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('Express server running on *:' + port);
});
