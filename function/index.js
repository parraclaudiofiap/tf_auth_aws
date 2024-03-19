const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const jwt_decode = require('jwt-decode');
global.fetch = require('node-fetch');

const UserPoolId = process.env.AWS_COGNITO_USER_POOL_ID
const ClientId = process.env.AWS_COGNITO_CLIENT_ID
const AnonimousUsername = process.env.AWS_COGNITO_DEFAULT_USER
const AnonimousPassword = process.env.AWS_COGNITO_DEFAULT_USER_PASSWORD

const poolData = {
    UserPoolId,
    ClientId
}

AWS.config.update({
    region: 'us-east-1'
})

function getCognitoUser(username) {
  const userData = {
    Username: username,
    Pool: getUserPool()
  };
  return new AmazonCognitoIdentity.CognitoUser(userData);
}

function getUserPool(){
  return new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

function getAuthDetails(username, password) {
  var authenticationData = {
    Username: username,
    Password: password,
   };
  return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
}

function decodeJWTToken(token) {
  const {  email, exp, auth_time , token_use, sub} = jwt_decode(token.idToken);
  return {  token, email, exp, uid: sub, auth_time, token_use };
}

function signIn(username, password) {
  return new Promise((resolve) => {
    getCognitoUser(username).authenticateUser(getAuthDetails(username, password), {
      onSuccess: (result) => {
        const token = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        }  
        return resolve({ statusCode: 200, body: decodeJWTToken(token).token.idToken });
      },
      
      onFailure: (err) => {
        return resolve({ statusCode: 400, body: err.message || JSON.stringify(err)});
      },
    });
  });
}

exports.handler =  async function(event, context, callback) {
  
  if(event.body == undefined)
  {
    const token = await signIn(AnonimousUsername,AnonimousPassword)
  }
  else
  {
    const json = JSON.parse(event.body)
  
    const {
      username,
      password
    } = json
  
    const token = await signIn(username,password)
  }

  callback(null,token)
}    