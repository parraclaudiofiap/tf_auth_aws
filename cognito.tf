
resource "aws_cognito_user_pool" "auth_user_pool" {
  name = "app-user-pool"
}

resource "aws_cognito_user_pool_client" "client" {
  name                                 = "client"
  allowed_oauth_flows_user_pool_client = true
  generate_secret                      = false
  allowed_oauth_scopes                 = ["aws.cognito.signin.user.admin", "email", "openid", "profile"]
  allowed_oauth_flows                  = ["implicit", "code"]
  explicit_auth_flows                  = ["ADMIN_NO_SRP_AUTH", "USER_PASSWORD_AUTH"]
  supported_identity_providers         = ["COGNITO"]


  user_pool_id  = aws_cognito_user_pool.auth_user_pool.id
  callback_urls = ["https://example.com"]
  logout_urls   = ["https://example.com"]
}

data "aws_secretsmanager_secret" "secret_cs" {
   arn = "arn:aws:secretsmanager:us-east-1:341161836869:secret:cognito_configuration-951bHM"
}

resource "aws_secretsmanager_secret_version" "secret_cs_current" {
  secret_id = data.aws_secretsmanager_secret.secret_cs.id
  secret_string = aws_cognito_user_pool_client.client.id
}