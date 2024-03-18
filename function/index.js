const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const jwt_decode = require('jwt-decode');
global.fetch = require('node-fetch');
let cognitoAttributeList = [];

const UserPoolId = process.env.AWS_COGNITO_USER_POOL_ID
const ClientId = process.env.AWS_COGNITO_CLIENT_ID

const poolData = {
    UserPoolId,
    ClientId
}

AWS.config.update({
    region: 'us-east-1'
})

async function registerUser(json) {
    const {
        username,
        password
    } = json

    return new Promise((resolve, reject) => {
        let attributeList = []

/*        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
            Name:"phone_number",
            Value: telephoneNumber
        }));

        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
            Name:"custom:confirmationCode",
            Value: confirmationCode
        }));*/
 
        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        userPool.aut
        userPool.signUp(username, password, attributeList, null, function(err, result) {
            if(err) {
                return resolve({
                    statusCode: 500,
                    err
                })
            }

            resolve({
                statusCode: 200,
                confirmationCode,
                message: 'User successfully registered'
            })
        })
    })
}

function signIn(email, password) {
  return new Promise((resolve) => {
      getCognitoUser(email).authenticateUser(getAuthDetails(email, password), {
      onSuccess: (result) => {
        const token = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        }  
        return resolve({ statusCode: 200, response: decodeJWTToken(token) });
      },
      
      onFailure: (err) => {
        return resolve({ statusCode: 400, response: err.message || JSON.stringify(err)});
      },
    });
  });
}


const attributes = (key, value) => { 
  return {
    Name : key,
    Value : value
  }
};

function setCognitoAttributeList(email, agent) {
  let attributeList = [];
  attributeList.push(attributes('email',email));
  attributeList.forEach(element => {
    cognitoAttributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(element));
  });
}

function getCognitoAttributeList() {
  return cognitoAttributeList;
}

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

function initAWS (region = process.env.AWS_COGNITO_REGION, identityPoolId = process.env.AWS_COGNITO_IDENTITY_POOL_ID) {
  AWS.config.region = region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
  });
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
    console.log('data: ', event)
  
    const json = JSON.parse(event.body)
  
    const {
      username,
      password
    } = json

    const token = await signIn(username,password)
    console.log(token)

    callback(null,token)
}