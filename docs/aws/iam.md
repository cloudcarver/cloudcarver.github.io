## Describe and delete VPC Endpoints by resource tag keys
```
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "DeletionControl",
			"Effect": "Allow",
			"Action": "ec2:DeleteVpcEndpoints",
			"Resource": "arn:aws:ec2:*:*:vpc-endpoint/*",
			"Condition": {
				"StringLike": {
					"aws:ResourceTag/${tag key here}": "*"
				}
			}
		},
		{
			"Sid": "DescribeControl",
			"Effect": "Allow",
			"Action": "ec2:DescribeVpcEndpoints",
			"Resource": "*"
		}
	]
}
```
