resource "aws_lambda_function" "auth_lambda" {
  filename         = "index.zip"
  function_name    = "auth-lambda"
  role             = aws_iam_role.auth_lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  timeout          = 10
  environment {
    variables = {
      AWS_COGNITO_USER_POOL_ID          = aws_cognito_user_pool.auth_user_pool.id,
      AWS_COGNITO_CLIENT_ID             = aws_cognito_user_pool_client.client.id,
      AWS_COGNITO_DEFAULT_USER          = aws_cognito_user.user_anonimo.username,
      AWS_COGNITO_DEFAULT_USER_PASSWORD = aws_cognito_user.user_anonimo.password
    }
  }
}

resource "aws_iam_role" "auth_lambda_role" {
  name = "auth-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.auth_lambda_role.name
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.api_gateway.execution_arn}/*/*/*"
}

data "archive_file" "lambda_package" {
  type        = "zip"
  source_dir  = "function"
  output_path = "index.zip"
}

resource "aws_cognito_user" "user_anonimo" {
  user_pool_id = aws_cognito_user_pool.pool.id
  username     = "anonimo"
  password     = "Test@123"
}