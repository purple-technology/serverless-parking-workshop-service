# S3 replicator

Destination s3 buckets must have this policy:

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Allow Purple Serverless Workshop",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::221940693656:root"
            },
            "Action": "s3:PutObject",
            "Resource": [
                "arn:aws:s3:::BUCKET_NAME",
                "arn:aws:s3:::BUCKET_NAME/*"
            ]
        }
    ]
}
```
